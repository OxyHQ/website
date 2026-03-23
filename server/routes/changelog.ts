import { Router } from 'express'
import { ChangelogEntry } from '../models/ChangelogEntry.js'
import TrackedRepo from '../models/TrackedRepo.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { syncAllRepos, syncSingleRepo } from '../services/githubSync.js'

const router = Router()

// GET /  — filtered + paginated changelog entries
router.get('/', async (req, res) => {
  const { repo, page: pageParam, limit: limitParam } = req.query

  const page = Math.max(1, parseInt(pageParam as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(limitParam as string) || 20))

  const filter: Record<string, any> = {}
  if (repo) {
    // repo can be "owner/name" or just "name"
    const parts = (repo as string).split('/')
    if (parts.length === 2) {
      filter.repoOwner = parts[0]
      filter.repoName = parts[1]
    } else {
      filter.repoName = repo
    }
  }

  const [entries, total, repoAgg] = await Promise.all([
    ChangelogEntry.find(filter)
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(limit),
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

  res.json({
    entries,
    total,
    page,
    pages: Math.ceil(total / limit),
    repos,
  })
})

// POST /  — create manual changelog entry (admin)
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const entry = await ChangelogEntry.create(req.body)
  res.status(201).json(entry)
})

// PUT /:id  — update changelog entry (admin)
router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const entry = await ChangelogEntry.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!entry) return res.status(404).json({ error: 'Entry not found' })
  res.json(entry)
})

// ── Tracked Repos ──

// GET /repos  — list tracked repos
router.get('/repos', async (_req, res) => {
  const repos = await TrackedRepo.find().sort('displayName')
  res.json(repos)
})

// POST /repos  — add tracked repo (admin)
router.post('/repos', requireAuth, adminOnly, async (req, res) => {
  const { owner, repo, displayName, defaultTags, active } = req.body
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
  const tracked = await TrackedRepo.findByIdAndDelete(req.params.id)
  if (!tracked) return res.status(404).json({ error: 'Tracked repo not found' })
  res.json({ ok: true })
})

// POST /repos/:id/sync  — manual sync single repo (admin)
router.post('/repos/:id/sync', requireAuth, adminOnly, async (req, res) => {
  try {
    const count = await syncSingleRepo(req.params.id)
    res.json({ ok: true, synced: count })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// POST /sync  — sync all repos (admin)
router.post('/sync', requireAuth, adminOnly, async (_req, res) => {
  // Run async — don't block the response
  syncAllRepos().catch((err) => console.error('[GitHub Sync] Manual sync error:', err))
  res.json({ ok: true, message: 'Sync started' })
})

export default router
