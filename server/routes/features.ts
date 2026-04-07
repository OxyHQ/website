import { Router } from 'express'
import { Vote } from '../models/Vote.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { config } from '../config.js'
import { checkAndAwardBadges } from '../services/badgeService.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'

const router = Router()

const GITHUB_ORG = 'oxyhq'
const FEATURE_LABEL = 'feature-request'

interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  html_url: string
  state: string
  labels: Array<{ name: string; color: string }>
  user: { login: string; avatar_url: string }
  reactions: { '+1': number; total_count: number }
  comments: number
  created_at: string
  updated_at: string
  repository_url: string
}

interface CachedData {
  issues: GitHubIssue[]
  expires: number
}

// In-memory cache — 5 minute TTL
let issueCache: CachedData | null = null
const CACHE_TTL = 5 * 60 * 1000

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`
  }
  return headers
}

function parseRepoFromUrl(repoUrl: string): { owner: string; repo: string } {
  // repository_url looks like "https://api.github.com/repos/oxyhq/mention"
  const parts = repoUrl.split('/')
  return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] }
}

async function fetchAllIssues(): Promise<GitHubIssue[]> {
  if (issueCache && issueCache.expires > Date.now()) {
    return issueCache.issues
  }

  const allIssues: GitHubIssue[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = `https://api.github.com/search/issues?q=org:${GITHUB_ORG}+label:${FEATURE_LABEL}+is:issue&sort=reactions-%2B1&order=desc&per_page=${perPage}&page=${page}`
    const resp = await fetch(url, { headers: githubHeaders() })

    if (resp.status === 429 || resp.status === 403) {
      if (issueCache) {
        issueCache.expires = Date.now() + CACHE_TTL * 2
        return issueCache.issues
      }
      throw new Error(`GitHub rate limit hit: ${resp.status}`)
    }

    if (!resp.ok) {
      const body = await resp.text()
      throw new Error(`GitHub API error ${resp.status}: ${body}`)
    }

    const data = await resp.json()
    allIssues.push(...data.items)

    if (data.items.length < perPage || allIssues.length >= data.total_count) break
    page++
    if (page > 10) break // Safety limit
  }

  issueCache = { issues: allIssues, expires: Date.now() + CACHE_TTL }
  return allIssues
}

// Derive status from GitHub labels
function deriveStatus(labels: Array<{ name: string }>): string {
  const labelNames = labels.map(l => l.name.toLowerCase())
  if (labelNames.includes('completed') || labelNames.includes('done') || labelNames.includes('shipped')) return 'completed'
  if (labelNames.includes('in-progress') || labelNames.includes('in progress')) return 'in_progress'
  if (labelNames.includes('planned') || labelNames.includes('accepted')) return 'planned'
  if (labelNames.includes('under-review') || labelNames.includes('under review') || labelNames.includes('triage')) return 'under_review'
  if (labelNames.includes('declined') || labelNames.includes('wontfix') || labelNames.includes("won't fix")) return 'declined'
  return 'open'
}

// Derive category from GitHub labels (first label that isn't a status or feature-request)
function deriveCategory(labels: Array<{ name: string }>): string {
  const statusLabels = new Set(['feature-request', 'completed', 'done', 'shipped', 'in-progress', 'in progress', 'planned', 'accepted', 'under-review', 'under review', 'triage', 'declined', 'wontfix', "won't fix"])
  const category = labels.find(l => !statusLabels.has(l.name.toLowerCase()))
  return category?.name ?? 'General'
}

// List feature requests (GitHub Issues)
router.get('/', optionalAuth, async (req, res) => {
  const { status, category, sort = 'votes', page = '1', limit = '20', state } = req.query

  try {
    let issues = await fetchAllIssues()

    // Filter by GitHub state (open/closed)
    if (state === 'closed') {
      issues = issues.filter(i => i.state === 'closed')
    } else {
      issues = issues.filter(i => i.state === 'open')
    }

    // Filter by derived status
    if (status && typeof status === 'string') {
      issues = issues.filter(i => deriveStatus(i.labels) === status)
    }

    // Filter by category
    if (category && typeof category === 'string') {
      issues = issues.filter(i => deriveCategory(i.labels).toLowerCase() === category.toLowerCase())
    }

    // Get local vote counts + user votes in a single query
    const issueKeys = issues.map(i => {
      const { owner, repo } = parseRepoFromUrl(i.repository_url)
      return `${owner}/${repo}#${i.number}`
    })

    const votes = await Vote.find({ featureRequestId: { $in: issueKeys } })
    const voteCounts = new Map<string, number>()
    const userVotedSet = new Set<string>()
    for (const v of votes) {
      voteCounts.set(v.featureRequestId, (voteCounts.get(v.featureRequestId) ?? 0) + 1)
      if (req.user && v.userId === req.user.id) {
        userVotedSet.add(v.featureRequestId)
      }
    }

    // Map to response format
    let items = issues.map(issue => {
      const { owner, repo } = parseRepoFromUrl(issue.repository_url)
      const key = `${owner}/${repo}#${issue.number}`
      const localVotes = voteCounts.get(key) ?? 0

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        description: issue.body ?? '',
        htmlUrl: issue.html_url,
        state: issue.state,
        status: deriveStatus(issue.labels),
        category: deriveCategory(issue.labels),
        labels: issue.labels,
        author: issue.user.login,
        authorAvatar: issue.user.avatar_url,
        githubReactions: issue.reactions['+1'],
        localVotes,
        totalVotes: issue.reactions['+1'] + localVotes,
        commentCount: issue.comments,
        repo: `${owner}/${repo}`,
        owner,
        repoName: repo,
        userVoted: userVotedSet.has(key),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      }
    })

    // Sort
    if (sort === 'newest') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sort === 'oldest') {
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else {
      // Default: sort by total votes (GitHub reactions + local)
      items.sort((a, b) => b.totalVotes - a.totalVotes)
    }

    // Paginate
    const { pageNum, limitNum } = parsePagination(page, limit)
    const total = items.length
    items = items.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    })
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to fetch features: ${message}` })
  }
})

// Get single issue details
router.get('/:owner/:repo/:number', optionalAuth, async (req, res) => {
  const { owner, repo, number } = req.params

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${number}`
    const resp = await fetch(url, { headers: githubHeaders() })

    if (!resp.ok) {
      if (resp.status === 404) return res.status(404).json({ error: 'Issue not found' })
      throw new Error(`GitHub API error ${resp.status}`)
    }

    const issue: GitHubIssue = await resp.json()
    const key = `${owner}/${repo}#${number}`

    const [localVoteCount, userVote] = await Promise.all([
      Vote.countDocuments({ featureRequestId: key }),
      req.user ? Vote.findOne({ featureRequestId: key, userId: req.user.id }) : null,
    ])

    res.json({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.body ?? '',
      htmlUrl: issue.html_url,
      state: issue.state,
      status: deriveStatus(issue.labels),
      category: deriveCategory(issue.labels),
      labels: issue.labels,
      author: issue.user.login,
      authorAvatar: issue.user.avatar_url,
      githubReactions: issue.reactions['+1'],
      localVotes: localVoteCount,
      totalVotes: issue.reactions['+1'] + localVoteCount,
      commentCount: issue.comments,
      repo: `${owner}/${repo}`,
      owner,
      repoName: repo,
      userVoted: userVote !== null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    })
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to fetch feature: ${message}` })
  }
})

// Toggle vote on an issue
router.post('/:owner/:repo/:number/vote', requireAuth, async (req, res) => {
  const { owner, repo, number } = req.params
  const key = `${owner}/${repo}#${number}`

  try {
    const existing = await Vote.findOneAndDelete({ featureRequestId: key, userId: req.user.id })

    if (!existing) {
      await Vote.create({ featureRequestId: key, userId: req.user.id })
    }

    const localVoteCount = await Vote.countDocuments({ featureRequestId: key })

    // Fire-and-forget badge check
    checkAndAwardBadges(req.user.id, req.user.username).catch(() => {})

    res.json({ localVotes: localVoteCount, userVoted: !existing })
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to toggle vote: ${message}` })
  }
})

// Clear cache (admin utility)
router.post('/cache/clear', requireAuth, async (_req, res) => {
  issueCache = null
  res.json({ success: true })
})

export default router
