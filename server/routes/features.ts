import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { config } from '../config.js'
import { Vote } from '../models/Vote.js'
import { FeatureProposal } from '../models/FeatureProposal.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { checkAndAwardBadges } from '../services/badgeService.js'
import {
  GitHubApiError,
  clearFeatureIssueCache,
  createFeatureIssue,
  derivePriority,
  deriveStatus,
  fetchFeatureIssue,
  fetchFeatureIssueComments,
  findFeatureRepo,
  issueVoteKey,
  listFeatureRepos,
  loadFeatureRequests,
  repoKey,
} from '../services/featureBoard.js'
import { reconcileFeaturePriorities } from '../services/featurePriority.js'
import { getPriorityTiers } from '../constants/featurePriority.js'
import {
  BODY_MAX_LENGTH,
  BODY_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
  buildProposalIssueBody,
  sanitizeProposalBody,
  sanitizeProposalTitle,
} from '../utils/proposalText.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'
import { validate } from '../utils/validate.js'

const router = Router()

const listQuerySchema = z.object({
  status: z.string().optional(),
  app: z.string().optional(),
  sort: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  state: z.string().optional(),
}).passthrough()

const issueParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  number: z.string().regex(/^\d+$/, 'issue number must be numeric'),
})

/**
 * GitHub `author_association` values that mean the commenter speaks for the
 * project. Everything else, including CONTRIBUTOR, is an ordinary participant.
 */
const MAINTAINER_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])

const proposalBodySchema = z.object({
  // `owner/repo`, exactly the `key` served by GET /apps.
  app: z.string().min(3).max(120),
  // Generous outer bounds so an over-long submission is rejected with a message
  // about the real limit, after sanitising, rather than by the schema.
  title: z.string().min(1).max(TITLE_MAX_LENGTH * 2),
  body: z.string().min(1).max(BODY_MAX_LENGTH * 2),
})

/**
 * Burst guard in front of the proposal endpoint.
 *
 * Keyed on the Oxy user id rather than the IP: the route is behind
 * `requireAuth`, so the identity is known and is the thing worth limiting, and
 * keying on identity sidesteps the question of which proxy header to trust
 * behind the load balancer. It is per instance and in memory, so it is the fast
 * guard, not the real quota. The durable per-user quota inside the handler is
 * what holds across instances and across restarts.
 *
 * Only a request that actually created an issue counts against it. What is
 * being limited is writes to the issue tracker, and a rejected submission wrote
 * nothing; counting those instead locks someone out for a minute for
 * mistyping a title twice, which is the one case where this endpoint's user is
 * definitely not an attacker.
 */
const proposalBurstLimiter = rateLimit({
  windowMs: 60_000,
  limit: config.featureBoard.proposalBurstPerMinute,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req) => req.user?.id ?? 'anonymous',
  handler: (_req, res) => {
    res.status(429).json({ error: 'You are proposing too quickly. Wait a minute and try again.' })
  },
})

/**
 * GET /apps  — the apps the board covers.
 *
 * One source for three things: the board's filter, the proposal form's
 * selector, and the allow-list every other route in this file checks against.
 */
router.get('/apps', async (_req, res) => {
  const repos = await listFeatureRepos()
  res.json({
    apps: repos.map((repo) => ({
      key: repo.key,
      owner: repo.owner,
      repo: repo.repo,
      displayName: repo.displayName,
      acceptsProposals: repo.acceptsProposals,
    })),
    priorities: getPriorityTiers().map((tier) => ({ key: tier.key, label: tier.label })),
    // Served rather than duplicated in the SPA, so the form's counters and the
    // validation that actually rejects a submission can never disagree.
    limits: {
      titleMin: TITLE_MIN_LENGTH,
      titleMax: TITLE_MAX_LENGTH,
      bodyMin: BODY_MIN_LENGTH,
      bodyMax: BODY_MAX_LENGTH,
    },
  })
})

// GET /  — feature requests across every tracked app
router.get('/', optionalAuth, async (req, res) => {
  const { status, app, sort = 'votes', page = '1', limit = '20', state } = validate(listQuerySchema, req.query)

  try {
    let items = await loadFeatureRequests(req.user?.id)

    items = state === 'closed'
      ? items.filter((item) => item.state === 'closed')
      : items.filter((item) => item.state === 'open')

    if (status) {
      items = items.filter((item) => item.status === status)
    }

    if (app) {
      const wanted = app.toLowerCase()
      items = items.filter((item) => item.app.key === wanted)
    }

    if (sort === 'newest') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sort === 'oldest') {
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    // `votes` is the order `loadFeatureRequests` already returns.

    const { pageNum, limitNum } = parsePagination(page, limit)
    const total = items.length

    res.json({
      items: items.slice((pageNum - 1) * limitNum, pageNum * limitNum),
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    })
  } catch (err) {
    const message = toErrorMessage(err)
    console.error('[features] list failed:', message)
    res.status(502).json({ error: 'Failed to fetch features' })
  }
})

/**
 * POST /proposals  — open a real GitHub issue from the website.
 *
 * On a GitHub failure nothing is recorded and nothing is half created: the
 * caller is told the proposal did not go through, the failure is logged with
 * the status GitHub answered, and the user's quota is untouched so they can try
 * again once it is fixed. Swallowing the error and answering 201 would leave a
 * visitor believing a proposal exists that nobody will ever see.
 */
router.post('/proposals', requireAuth, proposalBurstLimiter, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const input = validate(proposalBodySchema, req.body)

  const title = sanitizeProposalTitle(input.title)
  const body = sanitizeProposalBody(input.body)

  if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
    return res.status(400).json({
      error: `Give the proposal a title between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters.`,
    })
  }
  if (body.length < BODY_MIN_LENGTH || body.length > BODY_MAX_LENGTH) {
    return res.status(400).json({
      error: `Describe the proposal in between ${BODY_MIN_LENGTH} and ${BODY_MAX_LENGTH} characters.`,
    })
  }

  const [owner, repo] = input.app.split('/')
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Choose which app the proposal is for.' })
  }

  const target = await findFeatureRepo(owner, repo)
  if (!target) {
    return res.status(404).json({ error: 'That app is not on the feature board.' })
  }
  if (!target.acceptsProposals) {
    return res.status(409).json({ error: `${target.displayName} is not accepting proposals from the website.` })
  }

  const { proposalsPerWindow, proposalWindowHours } = config.featureBoard
  const windowStart = new Date(Date.now() - proposalWindowHours * 60 * 60 * 1000)
  const usedInWindow = await FeatureProposal.countDocuments({
    userId: user.id,
    createdAt: { $gte: windowStart },
  })
  if (usedInWindow >= proposalsPerWindow) {
    return res.status(429).json({
      error: `You can propose ${proposalsPerWindow} features every ${proposalWindowHours} hours. Try again later.`,
    })
  }

  const username = user.username?.trim() || user.id

  let created: { number: number; htmlUrl: string }
  try {
    created = await createFeatureIssue(target, {
      title,
      body: buildProposalIssueBody(body, {
        username,
        userId: user.id,
        boardUrl: `${config.siteUrl}/features`,
      }),
    })
  } catch (err) {
    const message = toErrorMessage(err)
    const status = err instanceof GitHubApiError ? err.status : 0
    console.error(`[features] proposal to ${target.key} failed (github ${status || 'unreachable'}):`, message)

    if (status === 503) {
      return res.status(503).json({ error: 'Proposals are not available right now. Please try again later.' })
    }
    if (status === 410) {
      return res.status(409).json({ error: `${target.displayName} is not accepting proposals right now.` })
    }
    if (status === 422) {
      return res.status(400).json({ error: 'GitHub rejected this proposal. Try rewording it.' })
    }
    return res.status(502).json({ error: 'GitHub did not accept the proposal. Nothing was created, please try again later.' })
  }

  await FeatureProposal.create({
    userId: user.id,
    username,
    owner: target.owner,
    repo: target.repo,
    issueNumber: created.number,
    issueUrl: created.htmlUrl,
    title,
  })

  // The board caches GitHub's search results; drop it so the new issue can show
  // up as soon as GitHub has indexed it rather than up to five minutes later.
  clearFeatureIssueCache()

  res.status(201).json({
    issueNumber: created.number,
    issueUrl: created.htmlUrl,
    app: { key: target.key, displayName: target.displayName },
  })
})

// GET /:owner/:repo/:number  — one feature request
router.get('/:owner/:repo/:number', optionalAuth, async (req, res) => {
  const { owner, repo, number } = validate(issueParamsSchema, req.params)

  const app = await findFeatureRepo(owner, repo)
  if (!app) return res.status(404).json({ error: 'Issue not found' })

  try {
    const issue = await fetchFeatureIssue(app, number)
    if (!issue) return res.status(404).json({ error: 'Issue not found' })

    const key = issueVoteKey(app.owner, app.repo, number)
    const [localVotes, userVote] = await Promise.all([
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
      priority: derivePriority(issue.labels),
      labels: issue.labels,
      author: issue.user.login,
      authorAvatar: issue.user.avatar_url,
      githubReactions: issue.reactions['+1'],
      localVotes,
      totalVotes: issue.reactions['+1'] + localVotes,
      commentCount: issue.comments,
      owner: app.owner,
      repoName: app.repo,
      app: { key: app.key, owner: app.owner, repo: app.repo, displayName: app.displayName },
      userVoted: userVote !== null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    })
  } catch (err) {
    const message = toErrorMessage(err)
    console.error(`[features] detail ${repoKey(owner, repo)}#${number} failed:`, message)
    res.status(502).json({ error: 'Failed to fetch feature' })
  }
})

/**
 * GET /:owner/:repo/:number/comments  — the issue thread, read only.
 *
 * Read only on purpose, and the asymmetry with proposals is deliberate.
 * Proposing is one issue per person per day against a form with length limits
 * and sanitising; commenting is unbounded, lands on a thread real people are
 * subscribed to, and every message notifies them. That is a different abuse
 * surface and it needs its own design, so writing from the website is out of
 * scope here. Reading costs nothing extra: these repos are public, the
 * comments already are too, and the point is that a visitor does not have to
 * leave to follow the discussion.
 */
router.get('/:owner/:repo/:number/comments', async (req, res) => {
  const { owner, repo, number } = validate(issueParamsSchema, req.params)

  const app = await findFeatureRepo(owner, repo)
  if (!app) return res.status(404).json({ error: 'Issue not found' })

  try {
    // Gated on the issue being a feature request, from the same cached read the
    // detail route uses, so the comments of an unrelated issue in a tracked
    // repo are not reachable through the board.
    const issue = await fetchFeatureIssue(app, number)
    if (!issue) return res.status(404).json({ error: 'Issue not found' })

    const { comments, hasMore } = await fetchFeatureIssueComments(app, number)

    res.json({
      comments: comments.map((comment) => ({
        id: comment.id,
        body: comment.body ?? '',
        htmlUrl: comment.html_url,
        author: comment.user.login,
        authorAvatar: comment.user.avatar_url,
        authorUrl: comment.user.html_url,
        // GitHub's author_association, narrowed to the one distinction a reader
        // cares about: is this person answering for the project.
        fromMaintainer: MAINTAINER_ASSOCIATIONS.has(comment.author_association),
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      })),
      hasMore,
      threadUrl: issue.html_url,
    })
  } catch (err) {
    const message = toErrorMessage(err)
    console.error(`[features] comments ${repoKey(owner, repo)}#${number} failed:`, message)
    res.status(502).json({ error: 'Failed to fetch comments' })
  }
})

// POST /:owner/:repo/:number/vote  — toggle this user's vote
router.post('/:owner/:repo/:number/vote', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const { owner, repo, number } = validate(issueParamsSchema, req.params)

  // Votes are only accepted for repos on the board, so an arbitrary
  // owner/repo/number cannot seed vote rows for issues the board will never
  // show, or for repos Oxy does not track at all.
  const app = await findFeatureRepo(owner, repo)
  if (!app) return res.status(404).json({ error: 'Issue not found' })

  const key = issueVoteKey(app.owner, app.repo, number)

  try {
    const existing = await Vote.findOneAndDelete({ featureRequestId: key, userId: user.id })
    if (!existing) {
      await Vote.create({ featureRequestId: key, userId: user.id })
    }

    const localVotes = await Vote.countDocuments({ featureRequestId: key })

    // Fire-and-forget badge check
    if (user.username) {
      checkAndAwardBadges(user.id, user.username).catch((err) =>
        console.warn('[features] badge check failed:', toErrorMessage(err)),
      )
    }

    res.json({ localVotes, userVoted: !existing })
  } catch (err) {
    const message = toErrorMessage(err)
    console.error(`[features] vote on ${key} failed:`, message)
    res.status(500).json({ error: 'Failed to toggle vote' })
  }
})

// POST /cache/clear  — drop the cached GitHub search results (admin)
router.post('/cache/clear', requireAuth, adminOnly, async (_req, res) => {
  clearFeatureIssueCache()
  res.json({ success: true })
})

// POST /priority/reconcile  — run the priority label pass now (admin)
router.post('/priority/reconcile', requireAuth, adminOnly, async (_req, res) => {
  try {
    res.json(await reconcileFeaturePriorities())
  } catch (err) {
    const message = toErrorMessage(err)
    console.error('[features] priority reconcile failed:', message)
    res.status(502).json({ error: `Reconcile failed: ${message}` })
  }
})

export default router
