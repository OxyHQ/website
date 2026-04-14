import { Router } from 'express'
import { z } from 'zod'
import { TeamMember } from '../models/TeamMember.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'

const router = Router()

const slugParamsSchema = z.object({ slug: z.string().min(1) })
const idParamsSchema = z.object({ id: z.string().min(1) })
const teamMemberBodySchema = z.object({}).passthrough()

// List active team members (public)
router.get('/', async (_req, res) => {
  const members = await TeamMember.find({ active: true }).populate('avatar').sort('order name')
  res.json(members)
})

// Get single team member by slug (public)
router.get('/:slug', async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const member = await TeamMember.findOne({ slug }).populate('avatar')
  if (!member) return res.status(404).json({ error: 'Team member not found' })
  res.json(member)
})

// Create team member (admin)
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(teamMemberBodySchema, req.body)
  try {
    const member = await TeamMember.create(body)
    res.status(201).json(member)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return res.status(409).json({ error: 'A team member with this slug already exists' })
    }
    throw err
  }
})

// Update team member (admin)
router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const body = validate(teamMemberBodySchema, req.body)
  const member = await TeamMember.findByIdAndUpdate(id, body, { new: true })
  if (!member) return res.status(404).json({ error: 'Team member not found' })
  res.json(member)
})

// Delete team member (admin)
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const member = await TeamMember.findByIdAndDelete(id)
  if (!member) return res.status(404).json({ error: 'Team member not found' })
  res.json({ ok: true })
})

export default router
