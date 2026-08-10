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
 * `publicRead: true` deliberately sends no credential for data that will be
 * returned by a public website endpoint, so private resources fail closed.
 *
 * A token never reaches the thrown message or a log line: GitHub's error body
 * is echoed, the Authorization header is not.
 */
export async function githubRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; write?: boolean; publicRead?: boolean } = {},
): Promise<T> {
  const token = options.publicRead
    ? undefined
    : (options.write
        ? config.featureBoard.githubToken
        : config.featureBoard.githubToken || config.githubToken)

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

interface RepoVisibilityCacheEntry {
  public: boolean
  expires: number
}

const repoVisibilityCache = new Map<string, RepoVisibilityCacheEntry>()

async function isPublicRepo(repo: FeatureRepo): Promise<boolean> {
  const cached = repoVisibilityCache.get(repo.key)
  if (cached && cached.expires > Date.now()) return cached.public

  let isPublic = false
  try {
    const response = await githubRequest<{ private: boolean }>(
      `/repos/${repo.owner}/${repo.repo}`,
      { publicRead: true },
    )
    isPublic = !response.private
  } catch (err) {
    if (!(err instanceof GitHubApiError) || err.status !== 404) throw err
  }

  repoVisibilityCache.set(repo.key, { public: isPublic, expires: Date.now() + CACHE_TTL_MS })
  return isPublic
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
  const repos = docs.map(toFeatureRepo)
  const visibility = await Promise.all(repos.map(isPublicRepo))
  return repos.filter((_repo, index) => visibility[index])
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
  const base = `label:${FEATURE_LABEL} is:issue is:public`
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

/** Drop the cached GitHub issues. Used by the admin cache-clear endpoint. */
export function clearFeatureIssueCache(): void {
  issueCache = null
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
        // This response is returned by a public endpoint, so deliberately do
        // not let a configured token expand the search into private repos.
        data = await githubRequest<SearchResponse>(`/search/issues?${params}`, { publicRead: true })
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
