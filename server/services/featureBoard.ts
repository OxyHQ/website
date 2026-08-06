import { config } from '../config.js'
import TrackedRepo, { type ITrackedRepo } from '../models/TrackedRepo.js'
import { Vote } from '../models/Vote.js'
import { getPriorityTiers } from '../constants/featurePriority.js'

/** The one label that makes an issue a feature request. */
export const FEATURE_LABEL = 'feature-request'

const GITHUB_API_BASE = 'https://api.github.com'
/** GitHub rejects a search query longer than this many characters. */
const SEARCH_QUERY_MAX_LENGTH = 256
const SEARCH_PAGE_SIZE = 100
/** Pages per search query. 10 x 100 covers far more than the board will hold. */
const SEARCH_MAX_PAGES = 10
const CACHE_TTL_MS = 5 * 60 * 1000
/** How long the cache is held past its TTL when GitHub rate limits us. */
const CACHE_RATE_LIMIT_EXTENSION_MS = 5 * 60 * 1000

export interface GitHubLabel {
  name: string
  color: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  html_url: string
  state: string
  labels: GitHubLabel[]
  user: { login: string; avatar_url: string }
  reactions: { '+1': number; total_count: number }
  comments: number
  created_at: string
  updated_at: string
  repository_url: string
}

/** An error carrying the HTTP status GitHub answered with. */
export class GitHubApiError extends Error {
  public readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
  }
}

/**
 * Call the GitHub REST API.
 *
 * `write: true` demands the feature board token, which is the only credential
 * allowed to change anything in a tracked repo. Reads prefer the same token
 * (authenticated search allows 30 requests a minute against 10 anonymous) and
 * fall back to the changelog sync token, then to no credential at all.
 *
 * A token never reaches the thrown message or a log line: GitHub's error body
 * is echoed, the Authorization header is not.
 */
export async function githubRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; write?: boolean } = {},
): Promise<T> {
  const token = options.write
    ? config.featureBoard.githubToken
    : config.featureBoard.githubToken || config.githubToken

  if (options.write && !token) {
    throw new GitHubApiError(503, 'FEATURE_BOARD_GITHUB_TOKEN is not configured')
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Oxy-Website-FeatureBoard',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new GitHubApiError(response.status, `GitHub ${response.status}: ${text.slice(0, 500)}`)
  }

  return response.json() as Promise<T>
}

/** Canonical, case-insensitive key for a repo: `owner/repo`, lowercased. */
export function repoKey(owner: string, repo: string): string {
  return `${owner}/${repo}`.toLowerCase()
}

/** The vote document key for one issue: `owner/repo#number`, as stored. */
export function issueVoteKey(owner: string, repo: string, issueNumber: number | string): string {
  return `${owner}/${repo}#${issueNumber}`
}

export interface FeatureRepo {
  key: string
  owner: string
  repo: string
  displayName: string
  acceptsProposals: boolean
}

function toFeatureRepo(doc: ITrackedRepo): FeatureRepo {
  return {
    key: repoKey(doc.owner, doc.repo),
    owner: doc.owner,
    repo: doc.repo,
    displayName: doc.displayName,
    acceptsProposals: doc.acceptsProposals,
  }
}

/**
 * Every repo on the board, in display order.
 *
 * This list is the allow-list too. A repo absent from it cannot be listed,
 * voted on, proposed to or labelled, whichever org it belongs to, so covering a
 * new org is a row in this collection rather than an edit to a constant.
 */
export async function listFeatureRepos(): Promise<FeatureRepo[]> {
  const docs = await TrackedRepo.find({ featureBoard: true }).sort('displayName')
  return docs.map(toFeatureRepo)
}

/** The tracked repo behind `owner/repo`, or null when it is not on the board. */
export async function findFeatureRepo(owner: string, repo: string): Promise<FeatureRepo | null> {
  const repos = await listFeatureRepos()
  return repos.find((candidate) => candidate.key === repoKey(owner, repo)) ?? null
}

/**
 * Split the tracked repos into search queries that each stay inside GitHub's
 * 256 character limit.
 *
 * Qualifiers of the same kind are OR-ed by GitHub, so `repo:a/b repo:c/d`
 * means either repo, and repeating a qualifier does not count against the
 * five-operator limit that applies to explicit AND/OR/NOT.
 */
export function buildSearchQueries(repos: FeatureRepo[]): string[] {
  const base = `label:${FEATURE_LABEL} is:issue`
  const queries: string[] = []
  let current = base

  for (const repo of repos) {
    const qualifier = ` repo:${repo.owner}/${repo.repo}`
    if (current.length + qualifier.length > SEARCH_QUERY_MAX_LENGTH) {
      if (current === base) {
        // One repo whose name alone overflows the limit cannot be searched for.
        // Skipping it beats sending a query GitHub will reject outright.
        console.warn(`[features] skipping ${repo.key}: repo qualifier exceeds the search query limit`)
        continue
      }
      queries.push(current)
      current = base
    }
    current += qualifier
  }

  if (current !== base) queries.push(current)
  return queries
}

interface IssueCache {
  /** Identifies the repo set the cached issues were fetched for. */
  signature: string
  issues: GitHubIssue[]
  expires: number
}

let issueCache: IssueCache | null = null

function cacheSignature(repos: FeatureRepo[]): string {
  return repos.map((repo) => repo.key).sort().join(',')
}

/**
 * Per-issue caches, for the detail page.
 *
 * Separate from the search cache above because they answer a different
 * question, and the detail page is public: without them every page view and
 * every refresh spent a GitHub request, which is how a single shared link
 * exhausts the hourly budget for the whole board. Bounded and evicted oldest
 * first, since the key space is every issue number a visitor can type.
 */
const DETAIL_CACHE_TTL_MS = 60 * 1000
const DETAIL_CACHE_MAX_ENTRIES = 500

interface CacheEntry<T> {
  value: T
  expires: number
}

const issueDetailCache = new Map<string, CacheEntry<GitHubIssue | null>>()
const issueCommentsCache = new Map<string, CacheEntry<IssueComments>>()

/**
 * Read through a bounded TTL cache, with the same rate-limit treatment the
 * search path uses: when GitHub refuses, a stale entry is held for another
 * window and served rather than failing the page. Only a caller with nothing
 * cached at all sees the error.
 */
async function cachedGithubRead<T>(
  store: Map<string, CacheEntry<T>>,
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  const cached = store.get(key)
  if (cached && cached.expires > Date.now()) return cached.value

  try {
    const value = await load()
    if (store.size >= DETAIL_CACHE_MAX_ENTRIES) {
      // Map iterates in insertion order, so the first key is the oldest write.
      const oldest = store.keys().next()
      if (!oldest.done) store.delete(oldest.value)
    }
    store.set(key, { value, expires: Date.now() + DETAIL_CACHE_TTL_MS })
    return value
  } catch (err) {
    if (cached && err instanceof GitHubApiError && (err.status === 429 || err.status === 403)) {
      cached.expires = Date.now() + CACHE_RATE_LIMIT_EXTENSION_MS
      return cached.value
    }
    throw err
  }
}

/** Drop every cached GitHub read. Used by the admin cache-clear endpoint. */
export function clearFeatureIssueCache(): void {
  issueCache = null
  issueDetailCache.clear()
  issueCommentsCache.clear()
}

interface SearchResponse {
  total_count: number
  items: GitHubIssue[]
}

/**
 * Fetch every `feature-request` issue across the tracked repos.
 *
 * Results are filtered against the tracked set again after the fact: the search
 * index can lag a repo being renamed or transferred, and the board must never
 * show an issue from a repo that is no longer on it.
 */
export async function fetchFeatureIssues(repos: FeatureRepo[]): Promise<GitHubIssue[]> {
  const signature = cacheSignature(repos)
  if (issueCache && issueCache.signature === signature && issueCache.expires > Date.now()) {
    return issueCache.issues
  }

  if (repos.length === 0) {
    issueCache = { signature, issues: [], expires: Date.now() + CACHE_TTL_MS }
    return []
  }

  const allowed = new Set(repos.map((repo) => repo.key))
  const issues: GitHubIssue[] = []

  for (const query of buildSearchQueries(repos)) {
    for (let page = 1; page <= SEARCH_MAX_PAGES; page++) {
      const params = new URLSearchParams({
        q: query,
        sort: 'reactions-+1',
        order: 'desc',
        per_page: String(SEARCH_PAGE_SIZE),
        page: String(page),
      })

      let data: SearchResponse
      try {
        data = await githubRequest<SearchResponse>(`/search/issues?${params}`)
      } catch (err) {
        // A rate limit is the one failure where stale data beats no data: hold
        // what we already have for another window rather than emptying the
        // board for everyone until the limit resets.
        if (err instanceof GitHubApiError && (err.status === 429 || err.status === 403) && issueCache) {
          issueCache.expires = Date.now() + CACHE_RATE_LIMIT_EXTENSION_MS
          return issueCache.issues
        }
        throw err
      }

      issues.push(...data.items.filter((issue) => allowed.has(repoKeyFromApiUrl(issue.repository_url))))

      if (data.items.length < SEARCH_PAGE_SIZE) break
    }
  }

  issueCache = { signature, issues, expires: Date.now() + CACHE_TTL_MS }
  return issues
}

/** `https://api.github.com/repos/oxyhq/mention` becomes `oxyhq/mention`. */
function repoKeyFromApiUrl(repositoryUrl: string): string {
  const parts = repositoryUrl.split('/')
  return repoKey(parts[parts.length - 2] ?? '', parts[parts.length - 1] ?? '')
}

/** Owner and repo exactly as GitHub spells them, from the search result. */
function repoFromApiUrl(repositoryUrl: string): { owner: string; repo: string } {
  const parts = repositoryUrl.split('/')
  return { owner: parts[parts.length - 2] ?? '', repo: parts[parts.length - 1] ?? '' }
}

const STATUS_LABELS = new Map<string, string>([
  ['completed', 'completed'],
  ['done', 'completed'],
  ['shipped', 'completed'],
  ['in-progress', 'in_progress'],
  ['in progress', 'in_progress'],
  ['planned', 'planned'],
  ['accepted', 'planned'],
  ['under-review', 'under_review'],
  ['under review', 'under_review'],
  ['triage', 'under_review'],
  ['declined', 'declined'],
  ['wontfix', 'declined'],
  ["won't fix", 'declined'],
])

/** Workflow status, read off the issue's labels. */
export function deriveStatus(labels: GitHubLabel[]): string {
  const order = ['completed', 'in_progress', 'planned', 'under_review', 'declined']
  const found = new Set<string>()
  for (const label of labels) {
    const status = STATUS_LABELS.get(label.name.toLowerCase())
    if (status) found.add(status)
  }
  return order.find((status) => found.has(status)) ?? 'open'
}

/** The priority tier key currently on the issue, or null. */
export function derivePriority(labels: GitHubLabel[]): string | null {
  const tiers = getPriorityTiers()
  const names = new Set(labels.map((label) => label.name.toLowerCase()))
  return tiers.find((tier) => names.has(tier.label.toLowerCase()))?.key ?? null
}

export interface FeatureRequestDto {
  id: number
  number: number
  title: string
  description: string
  htmlUrl: string
  state: string
  status: string
  priority: string | null
  labels: GitHubLabel[]
  author: string
  authorAvatar: string
  githubReactions: number
  localVotes: number
  totalVotes: number
  commentCount: number
  owner: string
  repoName: string
  app: { key: string; owner: string; repo: string; displayName: string }
  userVoted: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Every feature request on the board, with site votes and GitHub reactions
 * merged into `totalVotes` and sorted by it.
 *
 * `userId` marks which of them the caller has already voted for; omit it for an
 * anonymous request.
 */
export async function loadFeatureRequests(userId?: string): Promise<FeatureRequestDto[]> {
  const repos = await listFeatureRepos()
  const reposByKey = new Map(repos.map((repo) => [repo.key, repo]))
  const issues = await fetchFeatureIssues(repos)

  const voteKeys = issues.map((issue) => {
    const { owner, repo } = repoFromApiUrl(issue.repository_url)
    return issueVoteKey(owner, repo, issue.number)
  })

  const votes = await Vote.find({ featureRequestId: { $in: voteKeys } })
  const voteCounts = new Map<string, number>()
  const votedByUser = new Set<string>()
  for (const vote of votes) {
    voteCounts.set(vote.featureRequestId, (voteCounts.get(vote.featureRequestId) ?? 0) + 1)
    if (userId && vote.userId === userId) votedByUser.add(vote.featureRequestId)
  }

  const items: FeatureRequestDto[] = []
  for (const issue of issues) {
    const { owner, repo } = repoFromApiUrl(issue.repository_url)
    const app = reposByKey.get(repoKey(owner, repo))
    if (!app) continue

    const key = issueVoteKey(owner, repo, issue.number)
    const localVotes = voteCounts.get(key) ?? 0

    items.push({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.body ?? '',
      htmlUrl: issue.html_url,
      state: issue.state,
      status: deriveStatus(issue.labels),
      priority: derivePriority(issue.labels),
      labels: issue.labels,
      author: issue.user.login,
      authorAvatar: issue.user.avatar_url,
      githubReactions: issue.reactions['+1'],
      localVotes,
      totalVotes: issue.reactions['+1'] + localVotes,
      commentCount: issue.comments,
      owner,
      repoName: repo,
      app: { key: app.key, owner: app.owner, repo: app.repo, displayName: app.displayName },
      userVoted: votedByUser.has(key),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    })
  }

  items.sort((a, b) => b.totalVotes - a.totalVotes)
  return items
}

/**
 * Words carried by almost every feature request, so matching on them says
 * nothing. Kept deliberately short: an aggressive stop list starts throwing away
 * words that carry the meaning ("show", "list", "search" are all real features
 * here).
 */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'but', 'by', 'can', 'for', 'from', 'have',
  'i', 'if', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to',
  'we', 'with', 'would', 'should', 'add', 'feature', 'request', 'support',
])

/** Lowercase alphanumeric words, stop words dropped. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => !STOPWORDS.has(word))
}

/**
 * How much of the query's vocabulary a candidate reuses, from 0 to 1.
 *
 * Token overlap, and nothing cleverer on purpose. It is cheap, it runs over the
 * set already in memory, and above all it is explainable: a reader can see why
 * two requests were called similar. Embeddings would rank better on paraphrases
 * and worse on everything a reader can check, and this is a hint shown next to
 * a form, not a decision anybody is bound by.
 *
 * A token counts when it prefixes a word in the candidate, so "dark mo" still
 * finds "dark mode" while someone is still typing. The reverse also counts, so
 * "rewards" finds "reward", but only past `MIN_REVERSE_PREFIX` characters:
 * without that floor a stray one-letter word in a body ("a", "t") prefixes
 * almost every query token, and every request matches every query. Measured on
 * the real board, where "zzzz quantum teleport" matched an unrelated proposal
 * through a lone "t".
 */
const MIN_REVERSE_PREFIX = 4

export function overlapScore(queryTokens: string[], candidate: string): number {
  if (queryTokens.length === 0) return 0
  const candidateTokens = tokenize(candidate)
  if (candidateTokens.length === 0) return 0

  let matched = 0
  for (const token of queryTokens) {
    const hit = candidateTokens.some((word) =>
      word.startsWith(token) || (word.length >= MIN_REVERSE_PREFIX && token.startsWith(word)),
    )
    if (hit) matched++
  }
  return matched / queryTokens.length
}

/**
 * Score a request against a query: the title carries the meaning, the body is
 * corroboration worth a fraction of it.
 */
export function scoreRequest(queryTokens: string[], request: FeatureRequestDto): number {
  const title = overlapScore(queryTokens, request.title)
  const body = overlapScore(queryTokens, request.description.slice(0, 600))
  return title + body * 0.25
}

/**
 * One issue from a tracked repo, or null when it does not exist or is not a
 * feature request.
 *
 * The label check lives here rather than at the route so both the detail page
 * and its comments answer the same question from one cached read: the board
 * shows feature requests, and an issue in a tracked repo that is not one is
 * simply not on the board.
 */
export async function fetchFeatureIssue(repo: FeatureRepo, issueNumber: string): Promise<GitHubIssue | null> {
  return cachedGithubRead(issueDetailCache, `${repo.key}#${issueNumber}`, async () => {
    let issue: GitHubIssue
    try {
      issue = await githubRequest<GitHubIssue>(`/repos/${repo.owner}/${repo.repo}/issues/${issueNumber}`)
    } catch (err) {
      // A miss is cached like any other answer, so a crawler walking issue
      // numbers cannot turn every 404 into a GitHub request.
      if (err instanceof GitHubApiError && err.status === 404) return null
      throw err
    }
    return issue.labels.some((label) => label.name.toLowerCase() === FEATURE_LABEL) ? issue : null
  })
}

export interface GitHubIssueComment {
  id: number
  body: string | null
  html_url: string
  created_at: string
  updated_at: string
  author_association: string
  user: { login: string; avatar_url: string; html_url: string }
}

export interface IssueComments {
  comments: GitHubIssueComment[]
  /** True when the thread runs past what one page holds. */
  hasMore: boolean
}

/** Comments on an issue, capped at one page. */
const COMMENTS_PAGE_SIZE = 100

/**
 * Read the comments on a feature request.
 *
 * One page, deliberately: a thread long enough to overflow it is a
 * conversation, and the honest thing is to send the reader to GitHub for the
 * rest rather than paginate a mirror of it here.
 */
export async function fetchFeatureIssueComments(
  repo: FeatureRepo,
  issueNumber: string,
): Promise<IssueComments> {
  return cachedGithubRead(issueCommentsCache, `${repo.key}#${issueNumber}`, async () => {
    const comments = await githubRequest<GitHubIssueComment[]>(
      `/repos/${repo.owner}/${repo.repo}/issues/${issueNumber}/comments?per_page=${COMMENTS_PAGE_SIZE}`,
    )
    return { comments, hasMore: comments.length === COMMENTS_PAGE_SIZE }
  })
}

/** Create a `feature-request` issue in a tracked repo. */
export async function createFeatureIssue(
  repo: FeatureRepo,
  issue: { title: string; body: string },
): Promise<{ number: number; htmlUrl: string }> {
  const created = await githubRequest<{ number: number; html_url: string }>(
    `/repos/${repo.owner}/${repo.repo}/issues`,
    { method: 'POST', write: true, body: { title: issue.title, body: issue.body, labels: [FEATURE_LABEL] } },
  )
  return { number: created.number, htmlUrl: created.html_url }
}
