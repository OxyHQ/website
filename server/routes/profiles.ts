import { Router } from 'express'
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

const router = Router()

interface OxyClient {
  getProfileByUsername(username: string): Promise<Record<string, unknown>>
  getUserById(userId: string): Promise<Record<string, unknown>>
  getUserFollowers(userId: string): Promise<{ total: number }>
  getUserFollowing(userId: string): Promise<{ total: number }>
}

let oxyPromise: Promise<OxyClient> | null = null
function getOxy(): Promise<OxyClient> {
  if (!oxyPromise) {
    oxyPromise = import('@oxyhq/core').then(mod => {
      const OxyServices = mod.OxyServices ?? mod.default
      return new OxyServices({ baseURL: config.oxyApiBase }) as OxyClient
    })
  }
  return oxyPromise
}

// Get basic user info by ID (for article author display)
// MUST be before /:username to avoid Express matching "id" as a username
router.get('/id/:userId', async (req, res) => {
  try {
    const client = await getOxy()
    const oxyUser = await client.getUserById(req.params.userId)
    res.json({
      _id: oxyUser._id ?? oxyUser.id,
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
  const { bio, showActivity } = req.body

  try {
    const update: Record<string, unknown> = {}
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 280) {
        return res.status(400).json({ error: 'Bio must be 280 characters or less' })
      }
      update.bio = bio
    }
    if (showActivity !== undefined) {
      update.showActivity = !!showActivity
    }

    const profile = await UserProfileExtra.findOneAndUpdate(
      { userId: req.user.id },
      { ...update, userId: req.user.id, username: req.user.username },
      { upsert: true, new: true },
    )

    res.json(profile.toJSON())
  } catch (err) {
    res.status(500).json({ error: `Failed to update profile: ${toErrorMessage(err)}` })
  }
})

// Get public profile
router.get('/:username', optionalAuth, async (req, res) => {
  const { username } = req.params

  try {
    let oxyUser: Record<string, unknown>
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

    const userId = (oxyUser._id ?? oxyUser.id) as string
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
        _id: oxyUser._id ?? oxyUser.id,
        username: oxyUser.username,
        name: oxyUser.name,
        avatar: oxyUser.avatar,
        color: oxyUser.color,
      },
      bio: profileExtra?.bio || (oxyUser.bio as string) || '',
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
  const { username } = req.params
  const { page, limit, type } = req.query

  try {
    const { pageNum: _page, limitNum, skip } = parsePagination(page, limit)

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
  try {
    const badges = await UserBadge.find({ username: req.params.username }).sort('-awardedAt')
    res.json(badges.map(b => ({ badgeId: b.badgeId, awardedAt: b.awardedAt })))
  } catch (err) {
    res.status(500).json({ error: `Failed to load badges: ${toErrorMessage(err)}` })
  }
})

export default router
