import { Router } from 'express'
import { z } from 'zod'
import { and, asc, count, desc, eq, isNotNull, type SQL } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { changelogEntries, media, trackedRepos } from '../db/schema/index.js'
import { populate } from '../db/refs.js'
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
  featureBoard: z.boolean().optional(),
  acceptsProposals: z.boolean().optional(),
}).passthrough()

const trackedRepoUpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  defaultTags: z.array(z.object({
    label: z.string(),
    color: z.string(),
  })).optional(),
  active: z.boolean().optional(),
  featureBoard: z.boolean().optional(),
  acceptsProposals: z.boolean().optional(),
}).passthrough()

// GET /  — filtered + paginated changelog entries
router.get('/', localeMiddleware, async (req, res) => {
  const { repo, page: pageParam, limit: limitParam } = validate(listQuerySchema, req.query)

  const { pageNum, limitNum, skip } = parsePagination(pageParam, limitParam, MAX_CHANGELOG_PAGE_SIZE)

  const filters: SQL[] = []
  if (repo) {
    // repo can be "owner/name" or just "name"
    const parts = repo.split('/')
    if (parts.length === 2) {
      filters.push(eq(changelogEntries.repoOwner, parts[0]))
      filters.push(eq(changelogEntries.repoName, parts[1]))
    } else {
      filters.push(eq(changelogEntries.repoName, repo))
    }
  }
  const where = filters.length > 0 ? and(...filters) : undefined

  const [rows, [totals], repos] = await Promise.all([
    db.select().from(changelogEntries).where(where).orderBy(desc(changelogEntries.date), asc(changelogEntries._id)).offset(skip).limit(limitNum),
    db.select({ value: count() }).from(changelogEntries).where(where),
    // The distinct repos that have entries, for the filter dropdown. The
    // aggregation this replaces grouped on the same three fields.
    db
      .selectDistinct({
        owner: changelogEntries.repoOwner,
        name: changelogEntries.repoName,
        displayName: changelogEntries.repoDisplayName,
      })
      .from(changelogEntries)
      .where(isNotNull(changelogEntries.repoOwner))
      .orderBy(asc(changelogEntries.repoDisplayName), asc(changelogEntries._id)),
  ])
  const total = Number(totals?.value ?? 0)
  const entries = await populate(rows, { media })

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
  const [entry] = await db.insert(changelogEntries).values(body as never).returning()
  res.status(201).json(entry)
})

// PUT /:id  — update changelog entry (admin)
router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const body = validate(entryBodySchema, req.body)
  const [entry] = await db
    .update(changelogEntries)
    .set({ ...body, updatedAt: new Date() } as never)
    .where(eq(changelogEntries._id, id))
    .returning()
  if (!entry) return res.status(404).json({ error: 'Entry not found' })
  res.json(entry)
})

// DELETE /:id  — delete changelog entry (admin)
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const [entry] = await db.delete(changelogEntries).where(eq(changelogEntries._id, id)).returning({ id: changelogEntries._id })
  if (!entry) return res.status(404).json({ error: 'Entry not found' })
  res.json({ ok: true })
})

// ── Tracked Repos ──

// GET /repos  — list tracked repos
router.get('/repos', async (_req, res) => {
  const repos = await db.select().from(trackedRepos).orderBy(asc(trackedRepos.displayName), asc(trackedRepos._id))
  res.json(repos)
})

// POST /repos  — add tracked repo (admin)
router.post('/repos', requireAuth, adminOnly, async (req, res) => {
  const { owner, repo, displayName, defaultTags, active, featureBoard, acceptsProposals } =
    validate(trackedRepoBodySchema, req.body)
  const [tracked] = await db.insert(trackedRepos).values({
    owner,
    repo,
    displayName: displayName || `${owner}/${repo}`,
    defaultTags: defaultTags || [],
    active: active !== false,
    // Opt in explicitly. A repo added to sync releases does not join the public
    // feature board, or start taking public issues, unless it is asked to.
    featureBoard: featureBoard === true,
    acceptsProposals: acceptsProposals === true,
  }).returning()
  res.status(201).json(tracked)
})

// PUT /repos/:id  — update a tracked repo (admin)
router.put('/repos/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const body = validate(trackedRepoUpdateSchema, req.body)

  // Explicit field list: `owner` and `repo` identify the row and are not
  // editable here, and nothing else from the request body is allowed near the
  // update.
  const update: Record<string, unknown> = {}
  if (body.displayName !== undefined) update.displayName = body.displayName
  if (body.defaultTags !== undefined) update.defaultTags = body.defaultTags
  if (body.active !== undefined) update.active = body.active
  if (body.featureBoard !== undefined) update.featureBoard = body.featureBoard
  if (body.acceptsProposals !== undefined) update.acceptsProposals = body.acceptsProposals

  // A repo can only take proposals if it is on the board at all, so turning the
  // board off turns proposals off with it rather than leaving a row that would
  // accept an issue for an app nobody can see.
  if (update.featureBoard === false) update.acceptsProposals = false

  const [tracked] = await db
    .update(trackedRepos)
    .set({ ...update, updatedAt: new Date() } as never)
    .where(eq(trackedRepos._id, id))
    .returning()
  if (!tracked) return res.status(404).json({ error: 'Tracked repo not found' })
  res.json(tracked)
})

// DELETE /repos/:id  — remove tracked repo (admin)
router.delete('/repos/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const [tracked] = await db.delete(trackedRepos).where(eq(trackedRepos._id, id)).returning({ id: trackedRepos._id })
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
