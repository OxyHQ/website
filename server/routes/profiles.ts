import { Router } from 'express'
import { UserProfileExtra } from '../models/UserProfileExtra.js'
import { UserBadge } from '../models/UserBadge.js'
import { Comment } from '../models/Comment.js'
import { Like } from '../models/Like.js'
import { Vote } from '../models/Vote.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { config } from '../config.js'

const router = Router()

// Lazy-init OxyServices to handle ESM/CJS interop
let oxy: { getProfileByUsername(username: string): Promise<Record<string, unknown>> }
async function getOxy() {
  if (!oxy) {
    const mod = await import('@oxyhq/core')
    const OxyServices = mod.OxyServices || mod.default
    oxy = new OxyServices({ baseURL: config.oxyApiBase })
  }
  return oxy
}

// Get basic user info by ID (for article author display)
// MUST be before /:username to avoid Express matching "id" as a username
router.get('/id/:userId', async (req, res) => {
  try {
    const client = await getOxy()
    const oxyUser = await (client as Record<string, Function>).getUserById(req.params.userId) as Record<string, unknown>
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to update profile: ${message}` })
  }
})

// Get public profile
router.get('/:username', optionalAuth, async (req, res) => {
  const { username } = req.params

  try {
    let oxyUser: Record<string, unknown>
    try {
      const client = await getOxy()
      oxyUser = await client.getProfileByUsername(username) as Record<string, unknown>
    } catch {
      return res.status(404).json({ error: 'User not found' })
    }

    const [profileExtra, badges] = await Promise.all([
      UserProfileExtra.findOne({ username }),
      UserBadge.find({ username }).sort('-awardedAt'),
    ])

    const isSelf = req.user?.username === username
    const showActivity = profileExtra?.showActivity !== false

    let stats = null
    if (showActivity || isSelf) {
      const userId = oxyUser._id ?? oxyUser.id
      const [comments, likes, votes] = await Promise.all([
        Comment.countDocuments({ userId, status: 'visible' }),
        Like.countDocuments({ userId }),
        Vote.countDocuments({ userId }),
      ])
      stats = { comments, likes, votes }
    }

    res.json({
      user: {
        _id: oxyUser._id ?? oxyUser.id,
        username: oxyUser.username,
        name: oxyUser.name,
        avatar: oxyUser.avatar,
        color: oxyUser.color,
        bio: oxyUser.bio,
      },
      bio: profileExtra?.bio ?? '',
      showActivity: profileExtra?.showActivity !== false,
      badges: badges.map(b => ({ badgeId: b.badgeId, awardedAt: b.awardedAt })),
      stats,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to load profile: ${message}` })
  }
})

// Get user activity feed
router.get('/:username/activity', async (req, res) => {
  const { username } = req.params
  const { page = '1', limit = '20', type } = req.query

  try {
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20))
    const skip = (pageNum - 1) * limitNum

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
    const sliced = activities.slice(0, limitNum)

    res.json({ items: sliced, total: sliced.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to load activity: ${message}` })
  }
})

// Get user badges
router.get('/:username/badges', async (req, res) => {
  try {
    const badges = await UserBadge.find({ username: req.params.username }).sort('-awardedAt')
    res.json(badges.map(b => ({ badgeId: b.badgeId, awardedAt: b.awardedAt })))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to load badges: ${message}` })
  }
})

export default router
