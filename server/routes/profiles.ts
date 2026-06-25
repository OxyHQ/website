import { Router } from 'express'
import { z } from 'zod'
import { UserProfileExtra } from '../models/UserProfileExtra.js'
import { UserBadge } from '../models/UserBadge.js'
import { Comment } from '../models/Comment.js'
import { Like } from '../models/Like.js'
import { Vote } from '../models/Vote.js'
import { NewsroomPost } from '../models/NewsroomPost.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { config } from '../config.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'
import { validate } from '../utils/validate.js'

const router = Router()

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

type OxyClient = InstanceType<typeof import('@oxyhq/core').OxyServices>

let oxyPromise: Promise<OxyClient> | null = null
function getOxy(): Promise<OxyClient> {
  if (!oxyPromise) {
    oxyPromise = import('@oxyhq/core').then(mod => new mod.OxyServices({ baseURL: config.oxyApiBase }))
  }
  return oxyPromise
}

// Get basic user info by ID (for article author display)
// MUST be before /:username to avoid Express matching "id" as a username
router.get('/id/:userId', async (req, res) => {
  const { userId } = validate(userIdParamsSchema, req.params)
  try {
    const client = await getOxy()
    const oxyUser = await client.getUserById(userId)
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

    const profile = await UserProfileExtra.findOneAndUpdate(
      { userId: user.id },
      { ...update, userId: user.id, ...(user.username != null && { username: user.username }) },
      { upsert: true, new: true },
    )

    res.json(profile.toJSON())
  } catch (err) {
    res.status(500).json({ error: `Failed to update profile: ${toErrorMessage(err)}` })
  }
})

// Get public profile
router.get('/:username', optionalAuth, async (req, res) => {
  const { username } = validate(usernameParamsSchema, req.params)

  try {
    let oxyUser: Awaited<ReturnType<OxyClient['getProfileByUsername']>>
    try {
      const client = await getOxy()
      oxyUser = await client.getProfileByUsername(username)
    } catch {
      return res.status(404).json({ error: 'User not found' })
    }

    const [profileExtra, badges] = await Promise.all([
      UserProfileExtra.findOne({ username }),
      UserBadge.find({ username }).sort('-awardedAt'),
    ])

    const isSelf = req.user?.username === username
    const showActivity = profileExtra?.showActivity !== false

    const userId = oxyUser.id
    let stats = null
    if (showActivity || isSelf) {
      const client = await getOxy()
      const [comments, likes, votes, articles, followers, following] = await Promise.all([
        Comment.countDocuments({ userId, status: 'visible' }),
        Like.countDocuments({ userId }),
        Vote.countDocuments({ userId }),
        NewsroomPost.countDocuments({ oxyUserId: userId, status: 'published' }),
        client.getUserFollowers(userId).then(r => r.total).catch(() => 0),
        client.getUserFollowing(userId).then(r => r.total).catch(() => 0),
      ])
      stats = { comments, likes, votes, articles, followers, following }
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
      badges: badges.map(b => ({ badgeId: b.badgeId, awardedAt: b.awardedAt })),
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

    const profileExtra = await UserProfileExtra.findOne({ username })
    if (profileExtra?.showActivity === false) {
      return res.json({ items: [], total: 0 })
    }

    const activities: Array<{ type: string; data: unknown; createdAt: Date }> = []

    if (!type || type === 'comments') {
      const comments = await Comment.find({ username, status: 'visible' })
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
      comments.forEach(c => activities.push({ type: 'comment', data: c.toJSON(), createdAt: c.createdAt }))
    }

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    res.json({ items: activities, total: activities.length })
  } catch (err) {
    res.status(500).json({ error: `Failed to load activity: ${toErrorMessage(err)}` })
  }
})

// Get user badges
router.get('/:username/badges', async (req, res) => {
  const { username } = validate(usernameParamsSchema, req.params)
  try {
    const badges = await UserBadge.find({ username }).sort('-awardedAt')
    res.json(badges.map(b => ({ badgeId: b.badgeId, awardedAt: b.awardedAt })))
  } catch (err) {
    res.status(500).json({ error: `Failed to load badges: ${toErrorMessage(err)}` })
  }
})

export default router
