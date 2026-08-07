import { Router } from 'express'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { media, teamMembers } from '../db/schema/index.js'
import { populate, populateOne } from '../db/refs.js'
import { isUniqueViolation } from '../db/pgErrors.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { localizeMany, localizeOne } from '../utils/localize.js'
import { validate } from '../utils/validate.js'

const router = Router()

const slugParamsSchema = z.object({ slug: z.string().min(1) })
const idParamsSchema = z.object({ id: z.string().min(1) })
const teamMemberBodySchema = z.object({}).passthrough()

// List active team members (public)
router.get('/', localeMiddleware, async (req, res) => {
  const rows = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.active, true))
    .orderBy(asc(teamMembers.order), asc(teamMembers.name), asc(teamMembers._id))
  res.json(await localizeMany(req, 'team', await populate(rows, { avatar: media })))
})

// Get single team member by slug (public)
router.get('/:slug', localeMiddleware, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const [row] = await db.select().from(teamMembers).where(eq(teamMembers.slug, slug)).limit(1)
  const member = await populateOne(row, { avatar: media })
  if (!member) return res.status(404).json({ error: 'Team member not found' })
  res.json(await localizeOne(req, 'team', member))
})

// Create team member (admin)
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(teamMemberBodySchema, req.body)
  try {
    const [member] = await db.insert(teamMembers).values(body as never).returning()
    res.status(201).json(member)
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'A team member with this slug already exists' })
    }
    throw err
  }
})

// Update team member (admin)
router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const body = validate(teamMemberBodySchema, req.body)
  const [member] = await db
    .update(teamMembers)
    .set({ ...body, updatedAt: new Date() } as never)
    .where(eq(teamMembers._id, id))
    .returning()
  if (!member) return res.status(404).json({ error: 'Team member not found' })
  res.json(member)
})

// Delete team member (admin)
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const [member] = await db.delete(teamMembers).where(eq(teamMembers._id, id)).returning({ id: teamMembers._id })
  if (!member) return res.status(404).json({ error: 'Team member not found' })
  res.json({ ok: true })
})

export default router
