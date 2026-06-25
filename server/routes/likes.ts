import { Router } from 'express'
import { z } from 'zod'
import { Like } from '../models/Like.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { LIKEABLE_TARGET_TYPES } from '../constants/social.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { validate } from '../utils/validate.js'

const router = Router()

const listQuerySchema = z.object({
  targetType: z.string().min(1, 'targetType and targetId are required'),
  targetId: z.string().min(1, 'targetType and targetId are required'),
}).passthrough()

const toggleBodySchema = z.object({
  targetType: z.enum(LIKEABLE_TARGET_TYPES),
  targetId: z.string().min(1),
}).passthrough()

router.get('/', optionalAuth, async (req, res) => {
  const { targetType, targetId } = validate(listQuerySchema, req.query)

  try {
    const filter = { targetType, targetId }
    const [count, existing] = await Promise.all([
      Like.countDocuments(filter),
      req.user
        ? Like.findOne({ ...filter, userId: req.user.id })
        : null,
    ])

    res.json({ count, liked: existing !== null })
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to fetch likes: ${message}` })
  }
})

router.post('/toggle', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const { targetType, targetId } = validate(toggleBodySchema, req.body)

  try {
    const filter = { targetType, targetId, userId: user.id }
    const existing = await Like.findOneAndDelete(filter)

    if (!existing) {
      await Like.create({ ...filter, username: user.username ?? '' })
    }

    const count = await Like.countDocuments({ targetType, targetId })
    res.json({ count, liked: !existing })
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to toggle like: ${message}` })
  }
})

export default router
