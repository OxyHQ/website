import { Router } from 'express'
import { TeamMember } from '../models/TeamMember.js'
import { Media } from '../models/Media.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

/** If a field looks like a MongoDB ObjectId, populate it from the Media collection */
async function resolveMedia(value: any): Promise<string> {
  if (!value) return ''
  if (typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value)) {
    const media = await Media.findById(value)
    return media?.url || value
  }
  if (typeof value === 'object' && value.url) return value.url
  return String(value)
}

async function resolveMemberMedia(member: any) {
  const obj = member.toJSON ? member.toJSON() : { ...member }
  obj.avatar = await resolveMedia(obj.avatar)
  return obj
}

const router = Router()

// List active team members (public)
router.get('/', async (_req, res) => {
  const members = await TeamMember.find({ active: true }).sort('order name')
  const resolved = await Promise.all(members.map(resolveMemberMedia))
  res.json(resolved)
})

// Get single team member by slug (public)
router.get('/:slug', async (req, res) => {
  const member = await TeamMember.findOne({ slug: req.params.slug })
  if (!member) return res.status(404).json({ error: 'Team member not found' })
  res.json(await resolveMemberMedia(member))
})

// Create team member (admin)
router.post('/', requireAuth, adminOnly, async (req, res) => {
  try {
    const member = await TeamMember.create(req.body)
    res.status(201).json(member)
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ error: 'A team member with this slug already exists' })
    throw err
  }
})

// Update team member (admin)
router.put('/:id', requireAuth, adminOnly, async (req, res) => {
  const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!member) return res.status(404).json({ error: 'Team member not found' })
  res.json(member)
})

// Delete team member (admin)
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const member = await TeamMember.findByIdAndDelete(req.params.id)
  if (!member) return res.status(404).json({ error: 'Team member not found' })
  res.json({ ok: true })
})

export default router
