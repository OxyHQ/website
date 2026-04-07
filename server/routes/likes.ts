import { Router } from 'express'
import { Like } from '../models/Like.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', optionalAuth, async (req, res) => {
  const { targetType, targetId } = req.query

  if (!targetType || !targetId) {
    return res.status(400).json({ error: 'targetType and targetId are required' })
  }

  try {
    const filter = { targetType: targetType as string, targetId: targetId as string }
    const [count, existing] = await Promise.all([
      Like.countDocuments(filter),
      req.user
        ? Like.findOne({ ...filter, userId: req.user.id })
        : null,
    ])

    res.json({ count, liked: existing !== null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to fetch likes: ${message}` })
  }
})

router.post('/toggle', requireAuth, async (req, res) => {
  const { targetType, targetId } = req.body

  if (!targetType || !targetId) {
    return res.status(400).json({ error: 'targetType and targetId are required' })
  }

  const validTypes = ['newsroom', 'changelog']
  if (!validTypes.includes(targetType)) {
    return res.status(400).json({ error: `targetType must be one of: ${validTypes.join(', ')}` })
  }

  try {
    const filter = { targetType, targetId, userId: req.user.id }
    const existing = await Like.findOneAndDelete(filter)

    if (!existing) {
      await Like.create({ ...filter, username: req.user.username })
    }

    const count = await Like.countDocuments({ targetType, targetId })
    res.json({ count, liked: !existing })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to toggle like: ${message}` })
  }
})

export default router
