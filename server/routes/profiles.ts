import { Router } from 'express'
import { and, asc, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { comments, likes, newsroomPosts, userBadges, userProfileExtras, votes } from '../db/schema/index.js'
import { optionalAuth, oxy, requireAuth } from '../middleware/auth.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'
import { validate } from '../utils/validate.js'

const router = Router()

/** `count()` comes back as a one-row result; this unwraps it. */
async function countRows(query: Promise<Array<{ value: number }>>): Promise<number> {
  const [row] = await query
  return Number(row?.value ?? 0)
}

const userIdParamsSchema = z.object({ userId: z.string().min(1) })
const usernameParamsSchema = z.object({ username: z.string().min(1) })

const updateMeBodySchema = z.object({
  bio: z.string().max(280, 'Bio must be 280 characters or less').optional(),
  showActivity: z.boolean().optional(),
}).passthrough()

const activityQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.string().optional(),
}).passthrough()

// Get basic user info by ID (for article author display)
// MUST be before /:username to avoid Express matching "id" as a username
router.get('/id/:userId', async (req, res) => {
  const { userId } = validate(userIdParamsSchema, req.params)
  try {
    const oxyUser = await oxy.getUserById(userId)
    res.json({
      _id: oxyUser.id,
      username: oxyUser.username,
      name: oxyUser.name,
      avatar: oxyUser.avatar,
      color: oxyUser.color,
    })
  } catch {
    return res.status(404).json({ error: 'User not found' })
  }
})

// Update own profile
// MUST be before /:username to avoid Express matching "me" as a username
router.put('/me', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const { bio, showActivity } = validate(updateMeBodySchema, req.body)

  try {
    const update: Record<string, unknown> = {}
    if (bio !== undefined) update.bio = bio
    if (showActivity !== undefined) update.showActivity = showActivity

    const values = { ...update, userId: user.id, username: user.username ?? '' }
    const [profile] = await db
      .insert(userProfileExtras)
      .values(values as never)
      .onConflictDoUpdate({ target: userProfileExtras.userId, set: { ...update, updatedAt: new Date() } as never })
      .returning()

    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: `Failed to update profile: ${toErrorMessage(err)}` })
  }
})

// Get public profile
router.get('/:username', optionalAuth, async (req, res) => {
  const { username } = validate(usernameParamsSchema, req.params)

  try {
    let oxyUser: Awaited<ReturnType<typeof oxy.getProfileByUsername>>
    try {
      oxyUser = await oxy.getProfileByUsername(username)
    } catch {
      return res.status(404).json({ error: 'User not found' })
    }

    const [[profileExtra], badges] = await Promise.all([
      db.select().from(userProfileExtras).where(eq(userProfileExtras.username, username)).limit(1),
      db
        .select({ badgeId: userBadges.badgeId, awardedAt: userBadges.awardedAt })
        .from(userBadges)
        .where(eq(userBadges.username, username))
        .orderBy(desc(userBadges.awardedAt), asc(userBadges._id)),
    ])

    const isSelf = req.user?.username === username
    const showActivity = profileExtra?.showActivity !== false

    const userId = oxyUser.id
    let stats = null
    if (showActivity || isSelf) {
      const [commentCount, likeCount, voteCount, articleCount, followers, following] = await Promise.all([
        countRows(db.select({ value: count() }).from(comments).where(and(eq(comments.userId, userId), eq(comments.status, 'visible')))),
        countRows(db.select({ value: count() }).from(likes).where(eq(likes.userId, userId))),
        countRows(db.select({ value: count() }).from(votes).where(eq(votes.userId, userId))),
        countRows(
          db
            .select({ value: count() })
            .from(newsroomPosts)
            .where(and(eq(newsroomPosts.oxyUserId, userId), eq(newsroomPosts.status, 'published'))),
        ),
        oxy.getUserFollowers(userId).then(r => r.total).catch(() => 0),
        oxy.getUserFollowing(userId).then(r => r.total).catch(() => 0),
      ])
      stats = { comments: commentCount, likes: likeCount, votes: voteCount, articles: articleCount, followers, following }
    }

    res.json({
      user: {
        _id: oxyUser.id,
        username: oxyUser.username,
        name: oxyUser.name,
        avatar: oxyUser.avatar,
        color: oxyUser.color,
        createdAt: oxyUser.createdAt,
      },
      bio: profileExtra?.bio || oxyUser.bio || '',
      showActivity: profileExtra?.showActivity !== false,
      badges,
      stats,
    })
  } catch (err) {
    res.status(500).json({ error: `Failed to load profile: ${toErrorMessage(err)}` })
  }
})

// Get user activity feed
router.get('/:username/activity', async (req, res) => {
  const { username } = validate(usernameParamsSchema, req.params)
  const { page, limit, type } = validate(activityQuerySchema, req.query)

  try {
    const { limitNum, skip } = parsePagination(page, limit)

    const [profileExtra] = await db
      .select()
      .from(userProfileExtras)
      .where(eq(userProfileExtras.username, username))
      .limit(1)
    if (profileExtra?.showActivity === false) {
      return res.json({ items: [], total: 0 })
    }

    const activities: Array<{ type: string; data: unknown; createdAt: Date }> = []
    // Count across the whole collection, not just the page that was fetched.
    let total = 0

    if (!type || type === 'comments') {
      const where = and(eq(comments.username, username), eq(comments.status, 'visible'))
      const [rows, commentCount] = await Promise.all([
        db.select().from(comments).where(where).orderBy(desc(comments.createdAt), asc(comments._id)).offset(skip).limit(limitNum),
        countRows(db.select({ value: count() }).from(comments).where(where)),
      ])
      rows.forEach(row => activities.push({ type: 'comment', data: row, createdAt: row.createdAt }))
      total += commentCount
    }

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    res.json({ items: activities, total })
  } catch (err) {
    res.status(500).json({ error: `Failed to load activity: ${toErrorMessage(err)}` })
  }
})

// Get user badges
router.get('/:username/badges', async (req, res) => {
  const { username } = validate(usernameParamsSchema, req.params)
  try {
    const badges = await db
      .select({ badgeId: userBadges.badgeId, awardedAt: userBadges.awardedAt })
      .from(userBadges)
      .where(eq(userBadges.username, username))
      .orderBy(desc(userBadges.awardedAt), asc(userBadges._id))
    res.json(badges)
  } catch (err) {
    res.status(500).json({ error: `Failed to load badges: ${toErrorMessage(err)}` })
  }
})

export default router
