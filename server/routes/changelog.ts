import { Router } from 'express'
import { z } from 'zod'
import { ChangelogEntry } from '../models/ChangelogEntry.js'
import TrackedRepo from '../models/TrackedRepo.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany } from '../utils/localize.js'
import { syncAllRepos, syncSingleRepo } from '../services/githubSync.js'
import { parsePagination } from '../utils/parsePagination.js'
import { validate } from '../utils/validate.js'

const router = Router()

// The changelog list pages larger than the default API page size.
const MAX_CHANGELOG_PAGE_SIZE = 100

const listQuerySchema = z.object({
  repo: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

const idParamsSchema = z.object({ id: z.string().min(1) })

const entryBodySchema = z.object({}).passthrough()

const trackedRepoBodySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  displayName: z.string().optional(),
  defaultTags: z.array(z.object({
    label: z.string(),
    color: z.string(),
  })).optional(),
  active: z.boolean().optional(),
}).passthrough()

// GET /  — filtered + paginated changelog entries
router.get('/', localeMiddleware, async (req, res) => {
  const { repo, page: pageParam, limit: limitParam } = validate(listQuerySchema, req.query)

  const { pageNum, limitNum, skip } = parsePagination(pageParam, limitParam, MAX_CHANGELOG_PAGE_SIZE)

  const filter: Record<string, string> = {}
  if (repo) {
    // repo can be "owner/name" or just "name"
    const parts = repo.split('/')
    if (parts.length === 2) {
      filter.repoOwner = parts[0]
      filter.repoName = parts[1]
    } else {
      filter.repoName = repo
    }
  }

  const [entries, total, repoAgg] = await Promise.all([
    ChangelogEntry.find(filter)
      .populate('media')
      .sort('-date')
      .skip(skip)
      .limit(limitNum),
    ChangelogEntry.countDocuments(filter),
    ChangelogEntry.aggregate([
      { $match: { repoOwner: { $ne: null } } },
      { $group: { _id: { owner: '$repoOwner', name: '$repoName', display: '$repoDisplayName' } } },
      { $sort: { '_id.display': 1 } },
    ]),
  ])

  const repos = repoAgg.map((r) => ({
    owner: r._id.owner,
    name: r._id.name,
    displayName: r._id.display,
  }))

  const serialized = await localizeMany(req, 'changelog', entries)

  res.json({
    entries: serialized,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    repos,
  })
})

// POST /  — create manual changelog entry (admin)
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(entryBodySchema, req.body)
  const entry = await ChangelogEntry.create(body)
  res.status(201).json(entry)
})

// PUT /:id  — update changelog entry (admin)
router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const body = validate(entryBodySchema, req.body)
  const entry = await ChangelogEntry.findByIdAndUpdate(id, body, { new: true })
  if (!entry) return res.status(404).json({ error: 'Entry not found' })
  res.json(entry)
})

// DELETE /:id  — delete changelog entry (admin)
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const entry = await ChangelogEntry.findByIdAndDelete(id)
  if (!entry) return res.status(404).json({ error: 'Entry not found' })
  res.json({ ok: true })
})

// ── Tracked Repos ──

// GET /repos  — list tracked repos
router.get('/repos', async (_req, res) => {
  const repos = await TrackedRepo.find().sort('displayName')
  res.json(repos)
})

// POST /repos  — add tracked repo (admin)
router.post('/repos', requireAuth, adminOnly, async (req, res) => {
  const { owner, repo, displayName, defaultTags, active } = validate(trackedRepoBodySchema, req.body)
  const tracked = await TrackedRepo.create({
    owner,
    repo,
    displayName: displayName || `${owner}/${repo}`,
    defaultTags: defaultTags || [],
    active: active !== false,
  })
  res.status(201).json(tracked)
})

// DELETE /repos/:id  — remove tracked repo (admin)
router.delete('/repos/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const tracked = await TrackedRepo.findByIdAndDelete(id)
  if (!tracked) return res.status(404).json({ error: 'Tracked repo not found' })
  res.json({ ok: true })
})

// POST /repos/:id/sync  — manual sync single repo (admin)
router.post('/repos/:id/sync', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  try {
    const count = await syncSingleRepo(id)
    res.json({ ok: true, synced: count })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    res.status(400).json({ error: message })
  }
})

// POST /sync  — sync all repos (admin)
router.post('/sync', requireAuth, adminOnly, async (_req, res) => {
  // Run async — don't block the response
  syncAllRepos().catch((err) => console.error('[GitHub Sync] Manual sync error:', err))
  res.json({ ok: true, message: 'Sync started' })
})

export default router
