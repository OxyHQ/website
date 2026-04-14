import { Router } from 'express'
import { z } from 'zod'
import { UserBadge } from '../models/UserBadge.js'
import { BADGE_DEFINITIONS, BADGE_IDS } from '../data/badges.js'
import { requireAuth } from '../middleware/auth.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { checkAndAwardBadges } from '../services/badgeService.js'
import { validate } from '../utils/validate.js'

const router = Router()

const awardBodySchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
  badgeId: z.string().min(1).refine(
    (value) => BADGE_IDS.includes(value),
    { message: `Invalid badgeId. Must be one of: ${BADGE_IDS.join(', ')}` },
  ),
}).passthrough()

const revokeParamsSchema = z.object({
  userId: z.string().min(1),
  badgeId: z.string().min(1),
})

const checkParamsSchema = z.object({
  userId: z.string().min(1),
})

const checkBodySchema = z.object({
  username: z.string().min(1),
}).passthrough()

// Get badge definitions (public)
router.get('/definitions', (_req, res) => {
  res.json(BADGE_DEFINITIONS)
})

// Admin: award badge
router.post('/award', requireAuth, adminOnly, async (req, res) => {
  const { userId, username, badgeId } = validate(awardBodySchema, req.body)
  const awardedBy = req.user?.id ?? ''

  try {
    const badge = await UserBadge.findOneAndUpdate(
      { userId, badgeId },
      { userId, username, badgeId, awardedAt: new Date(), awardedBy },
      { upsert: true, new: true },
    )
    res.status(201).json(badge.toJSON())
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to award badge: ${message}` })
  }
})

// Admin: revoke badge
router.delete('/:userId/:badgeId', requireAuth, adminOnly, async (req, res) => {
  const { userId, badgeId } = validate(revokeParamsSchema, req.params)
  try {
    const result = await UserBadge.findOneAndDelete({ userId, badgeId })
    if (!result) return res.status(404).json({ error: 'Badge not found' })
    res.json({ success: true })
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to revoke badge: ${message}` })
  }
})

// Admin: trigger auto-award check for a user
router.post('/check/:userId', requireAuth, adminOnly, async (req, res) => {
  const { userId } = validate(checkParamsSchema, req.params)
  const { username } = validate(checkBodySchema, req.body)

  try {
    await checkAndAwardBadges(userId, username)
    const badges = await UserBadge.find({ userId }).sort('-awardedAt')
    res.json(badges.map(b => ({ badgeId: b.badgeId, awardedAt: b.awardedAt })))
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to check badges: ${message}` })
  }
})

export default router
