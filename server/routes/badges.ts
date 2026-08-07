import { Router } from 'express'
import { and, asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { userBadges } from '../db/schema/index.js'
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
    const [badge] = await db
      .insert(userBadges)
      .values({ userId, username, badgeId, awardedAt: new Date(), awardedBy })
      .onConflictDoUpdate({
        target: [userBadges.userId, userBadges.badgeId],
        set: { username, awardedAt: new Date(), awardedBy },
      })
      .returning()
    res.status(201).json(badge)
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to award badge: ${message}` })
  }
})

// Admin: revoke badge
router.delete('/:userId/:badgeId', requireAuth, adminOnly, async (req, res) => {
  const { userId, badgeId } = validate(revokeParamsSchema, req.params)
  try {
    const [result] = await db
      .delete(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
      .returning({ id: userBadges._id })
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
    const badges = await db
      .select({ badgeId: userBadges.badgeId, awardedAt: userBadges.awardedAt })
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.awardedAt), asc(userBadges._id))
    res.json(badges)
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to check badges: ${message}` })
  }
})

export default router
