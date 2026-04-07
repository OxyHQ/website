import { Router } from 'express'
import { UserBadge } from '../models/UserBadge.js'
import { BADGE_DEFINITIONS, BADGE_IDS } from '../data/badges.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { checkAndAwardBadges } from '../services/badgeService.js'

const router = Router()

// Get badge definitions (public)
router.get('/definitions', (_req, res) => {
  res.json(BADGE_DEFINITIONS)
})

// Admin: award badge
router.post('/award', requireAuth, adminOnly, async (req, res) => {
  const { userId, username, badgeId } = req.body

  if (!userId || !username || !badgeId) {
    return res.status(400).json({ error: 'userId, username, and badgeId are required' })
  }
  if (!BADGE_IDS.includes(badgeId)) {
    return res.status(400).json({ error: `Invalid badgeId. Must be one of: ${BADGE_IDS.join(', ')}` })
  }

  try {
    const badge = await UserBadge.findOneAndUpdate(
      { userId, badgeId },
      { userId, username, badgeId, awardedAt: new Date(), awardedBy: req.user.id },
      { upsert: true, new: true },
    )
    res.status(201).json(badge.toJSON())
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to award badge: ${message}` })
  }
})

// Admin: revoke badge
router.delete('/:userId/:badgeId', requireAuth, adminOnly, async (req, res) => {
  try {
    const result = await UserBadge.findOneAndDelete({
      userId: req.params.userId,
      badgeId: req.params.badgeId,
    })
    if (!result) return res.status(404).json({ error: 'Badge not found' })
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to revoke badge: ${message}` })
  }
})

// Admin: trigger auto-award check for a user
router.post('/check/:userId', requireAuth, adminOnly, async (req, res) => {
  const { userId } = req.params
  const { username } = req.body

  if (!username) return res.status(400).json({ error: 'username is required in body' })

  try {
    await checkAndAwardBadges(userId, username)
    const badges = await UserBadge.find({ userId }).sort('-awardedAt')
    res.json(badges.map(b => ({ badgeId: b.badgeId, awardedAt: b.awardedAt })))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to check badges: ${message}` })
  }
})

export default router
