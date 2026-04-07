import { Router } from 'express'
import { UserProfileExtra } from '../models/UserProfileExtra.js'
import { UserBadge } from '../models/UserBadge.js'
import { Comment } from '../models/Comment.js'
import { Like } from '../models/Like.js'
import { Vote } from '../models/Vote.js'
import { FeatureRequest } from '../models/FeatureRequest.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { config } from '../config.js'

const router = Router()

// In-memory cache for Oxy user data (5 minute TTL)
const userCache = new Map<string, { data: Record<string, unknown>; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000

async function fetchOxyUser(username: string): Promise<Record<string, unknown> | null> {
  const cached = userCache.get(username)
  if (cached && cached.expires > Date.now()) return cached.data

  try {
    const resp = await fetch(`${config.oxyApiBase}/api/users/username/${username}`)
    if (!resp.ok) return null
    const body = await resp.json()
    const data = body.data ?? body
    userCache.set(username, { data, expires: Date.now() + CACHE_TTL })
    return data
  } catch {
    return null
  }
}

// Get public profile
router.get('/:username', optionalAuth, async (req, res) => {
  const { username } = req.params

  try {
    const [oxyUser, profileExtra, badges] = await Promise.all([
      fetchOxyUser(username),
      UserProfileExtra.findOne({ username }),
      UserBadge.find({ username }).sort('-awardedAt'),
    ])

    if (!oxyUser) return res.status(404).json({ error: 'User not found' })

    const isSelf = req.user?.username === username
    const showActivity = profileExtra?.showActivity !== false

    // Activity stats (only if public or self)
    let stats = null
    if (showActivity || isSelf) {
      const userId = (oxyUser as Record<string, unknown>)._id as string
      const [comments, likes, votes, featureRequests] = await Promise.all([
        Comment.countDocuments({ userId, status: 'visible' }),
        Like.countDocuments({ userId }),
        Vote.countDocuments({ userId }),
        FeatureRequest.countDocuments({ userId }),
      ])
      stats = { comments, likes, votes, featureRequests }
    }

    res.json({
      user: {
        username: (oxyUser as Record<string, unknown>).username,
        name: (oxyUser as Record<string, unknown>).name,
        avatar: (oxyUser as Record<string, unknown>).avatar,
        color: (oxyUser as Record<string, unknown>).color,
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

// Update own profile
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

// Get user activity feed
router.get('/:username/activity', async (req, res) => {
  const { username } = req.params
  const { page = '1', limit = '20', type } = req.query

  try {
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20))
    const skip = (pageNum - 1) * limitNum

    // Check privacy
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

    if (!type || type === 'features') {
      const features = await FeatureRequest.find({ username })
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
      features.forEach(f => activities.push({ type: 'feature_request', data: f.toJSON(), createdAt: f.createdAt }))
    }

    // Sort combined activities by date
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
