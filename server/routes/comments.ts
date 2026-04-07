import { Router } from 'express'
import { Comment } from '../models/Comment.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

const VALID_TARGET_TYPES = ['newsroom', 'changelog', 'feature_request']
const MAX_BODY_LENGTH = 2000
const RATE_LIMIT_MS = 10_000
const EDIT_WINDOW_MS = 15 * 60 * 1000

/**
 * GET / — List visible comments for a given target.
 * Deleted comments that have replies are returned with scrubbed body/username.
 */
router.get('/', optionalAuth, async (req, res) => {
  const { targetType, targetId } = req.query

  if (!targetType || !targetId) {
    return res.status(400).json({ error: 'targetType and targetId are required' })
  }

  if (!VALID_TARGET_TYPES.includes(targetType as string)) {
    return res.status(400).json({ error: `targetType must be one of: ${VALID_TARGET_TYPES.join(', ')}` })
  }

  try {
    const comments = await Comment.find({
      targetType: targetType as string,
      targetId: targetId as string,
      status: { $in: ['visible', 'deleted'] },
    }).sort({ createdAt: 1 })

    // Collect IDs of all parent comments that have replies
    const parentIdsWithReplies = new Set(
      comments
        .filter(c => c.parentId !== null)
        .map(c => c.parentId?.toString()),
    )

    const result = comments
      .filter(c => {
        // Keep all visible comments
        if (c.status === 'visible') return true
        // Keep deleted comments only if they have replies (show placeholder)
        return parentIdsWithReplies.has(c._id.toString())
      })
      .map(c => {
        const json = c.toJSON()
        if (c.status === 'deleted') {
          return { ...json, body: '[deleted]', username: '[deleted]' }
        }
        return json
      })

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to fetch comments: ${message}` })
  }
})

/**
 * POST / — Create a new comment.
 */
router.post('/', requireAuth, async (req, res) => {
  const { targetType, targetId, body, parentId } = req.body
  const user = req.user

  if (!user) return res.status(401).json({ error: 'Authentication required' })

  if (!targetType || !targetId || !body) {
    return res.status(400).json({ error: 'targetType, targetId, and body are required' })
  }

  if (!VALID_TARGET_TYPES.includes(targetType)) {
    return res.status(400).json({ error: `targetType must be one of: ${VALID_TARGET_TYPES.join(', ')}` })
  }

  if (typeof body !== 'string' || body.length > MAX_BODY_LENGTH) {
    return res.status(400).json({ error: `body must be a string of at most ${MAX_BODY_LENGTH} characters` })
  }

  try {
    // Rate limit: no more than 1 comment per 10 seconds on the same target
    const recentCutoff = new Date(Date.now() - RATE_LIMIT_MS)
    const recentComment = await Comment.findOne({
      userId: user.id,
      targetType,
      targetId,
      createdAt: { $gte: recentCutoff },
    })

    if (recentComment) {
      return res.status(429).json({ error: 'You are commenting too fast. Please wait a few seconds.' })
    }

    // If parentId is provided, validate it references a top-level comment
    if (parentId) {
      const parentComment = await Comment.findById(parentId)
      if (!parentComment) {
        return res.status(400).json({ error: 'Parent comment not found' })
      }
      if (parentComment.parentId !== null) {
        return res.status(400).json({ error: 'Cannot reply to a reply. Replies must reference a top-level comment.' })
      }
    }

    const comment = await Comment.create({
      targetType,
      targetId,
      body,
      parentId: parentId ?? null,
      userId: user.id,
      username: user.username,
    })

    res.status(201).json(comment)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to create comment: ${message}` })
  }
})

/**
 * PUT /:id — Edit a comment (author only, within 15 minutes).
 */
router.put('/:id', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    if (comment.userId !== user.id) {
      return res.status(403).json({ error: 'You can only edit your own comments' })
    }

    const elapsed = Date.now() - comment.createdAt.getTime()
    if (elapsed > EDIT_WINDOW_MS) {
      return res.status(403).json({ error: 'Edit window has expired (15 minutes)' })
    }

    const { body } = req.body
    if (!body || typeof body !== 'string' || body.length > MAX_BODY_LENGTH) {
      return res.status(400).json({ error: `body must be a string of at most ${MAX_BODY_LENGTH} characters` })
    }

    comment.body = body
    comment.editedAt = new Date()
    await comment.save()

    res.json(comment)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to edit comment: ${message}` })
  }
})

/**
 * DELETE /:id — Soft-delete a comment (author or admin).
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    // Allow the comment author or an admin to delete
    const isAuthor = comment.userId === user.id
    // Inline admin check: import config to check admin list
    const { config } = await import('../config.js')
    const isAdmin = config.adminUsernames.includes(user.username)

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own comments' })
    }

    comment.status = 'deleted'
    await comment.save()

    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to delete comment: ${message}` })
  }
})

/**
 * PUT /:id/moderate — Admin moderation (change status).
 */
router.put('/:id/moderate', requireAuth, adminOnly, async (req, res) => {
  const { status } = req.body
  const validStatuses = ['visible', 'hidden', 'deleted']

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` })
  }

  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    )
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    res.json(comment)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to moderate comment: ${message}` })
  }
})

/**
 * GET /admin/queue — Admin queue of all comments with optional status filter.
 */
router.get('/admin/queue', requireAuth, adminOnly, async (req, res) => {
  const { page = '1', limit = '20', status } = req.query

  const pageNum = Math.max(1, parseInt(page as string) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
  const skip = (pageNum - 1) * limitNum

  const filter: Record<string, string> = {}
  if (status && typeof status === 'string') {
    filter.status = status
  }

  try {
    const [comments, total] = await Promise.all([
      Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Comment.countDocuments(filter),
    ])

    res.json({
      comments,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to fetch admin queue: ${message}` })
  }
})

/**
 * GET /user/:username — Public list of visible comments by username.
 */
router.get('/user/:username', async (req, res) => {
  const { page = '1', limit = '20' } = req.query

  const pageNum = Math.max(1, parseInt(page as string) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
  const skip = (pageNum - 1) * limitNum

  try {
    const filter = { username: req.params.username, status: 'visible' }
    const [comments, total] = await Promise.all([
      Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Comment.countDocuments(filter),
    ])

    res.json({
      comments,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Failed to fetch user comments: ${message}` })
  }
})

export default router
