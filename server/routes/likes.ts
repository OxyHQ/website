import { Router } from 'express'
import { and, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { likes } from '../db/schema/index.js'
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

async function countLikes(targetType: string, targetId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(likes)
    .where(and(eq(likes.targetType, targetType), eq(likes.targetId, targetId)))
  return Number(row?.value ?? 0)
}

router.get('/', optionalAuth, async (req, res) => {
  const { targetType, targetId } = validate(listQuerySchema, req.query)

  try {
    // `listQuerySchema` accepts any non-empty string (not the enum) so an
    // unrecognized targetType harmlessly matches zero rows instead of 400ing.
    const [total, existing] = await Promise.all([
      countLikes(targetType, targetId),
      req.user
        ? db
            .select({ id: likes._id })
            .from(likes)
            .where(and(eq(likes.targetType, targetType), eq(likes.targetId, targetId), eq(likes.userId, req.user.id)))
            .limit(1)
        : Promise.resolve([]),
    ])

    res.json({ count: total, liked: existing.length > 0 })
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
    // Delete-then-insert in one transaction: two taps arriving together must
    // not leave the row half-toggled, and the unique index decides the winner.
    const liked = await db.transaction(async (tx) => {
      const removed = await tx
        .delete(likes)
        .where(and(eq(likes.targetType, targetType), eq(likes.targetId, targetId), eq(likes.userId, user.id)))
        .returning({ id: likes._id })

      if (removed.length > 0) return false

      await tx
        .insert(likes)
        .values({ targetType, targetId, userId: user.id, username: user.username ?? '' })
        .onConflictDoNothing()
      return true
    })

    res.json({ count: await countLikes(targetType, targetId), liked })
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to toggle like: ${message}` })
  }
})

export default router
