import { Router } from 'express'
import type { QueryFilter } from 'mongoose'
import { z } from 'zod'
import { Comment, type IComment } from '../models/Comment.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { isAdminUser } from '../utils/adminAccess.js'
import { COMMENTABLE_TARGET_TYPES } from '../constants/social.js'
import { checkAndAwardBadges } from '../services/badgeService.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'
import { validate } from '../utils/validate.js'

const router = Router()

const MAX_BODY_LENGTH = 2000
const RATE_LIMIT_MS = 10_000
const EDIT_WINDOW_MS = 15 * 60 * 1000

const listQuerySchema = z.object({
  targetType: z.enum(COMMENTABLE_TARGET_TYPES),
  targetId: z.string().min(1),
}).passthrough()

const createBodySchema = z.object({
  targetType: z.enum(COMMENTABLE_TARGET_TYPES),
  targetId: z.string().min(1),
  body: z.string().min(1).max(MAX_BODY_LENGTH),
  parentId: z.string().nullable().optional(),
}).passthrough()

const editBodySchema = z.object({
  body: z.string().min(1).max(MAX_BODY_LENGTH),
}).passthrough()

const moderateBodySchema = z.object({
  status: z.enum(['visible', 'hidden', 'deleted']),
}).passthrough()

const idParamsSchema = z.object({ id: z.string().min(1) })

const usernameParamsSchema = z.object({ username: z.string().min(1) })

const paginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
}).passthrough()

const adminQueueQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

/**
 * GET / — List visible comments for a given target.
 * Deleted comments that have replies are returned with scrubbed body/username.
 */
router.get('/', optionalAuth, async (req, res) => {
  const { targetType, targetId } = validate(listQuerySchema, req.query)

  try {
    const comments = await Comment.find({
      targetType,
      targetId,
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
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to fetch comments: ${message}` })
  }
})

/**
 * POST / — Create a new comment.
 */
router.post('/', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const { targetType, targetId, body, parentId } = validate(createBodySchema, req.body)

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
      username: user.username ?? '',
    })

    if (user.username) {
      checkAndAwardBadges(user.id, user.username).catch((err) =>
        console.warn('[comments] badge check failed:', toErrorMessage(err)),
      )
    }

    res.status(201).json(comment)
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to create comment: ${message}` })
  }
})

/**
 * PUT /:id — Edit a comment (author only, within 15 minutes).
 */
router.put('/:id', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const { id } = validate(idParamsSchema, req.params)
  const { body } = validate(editBodySchema, req.body)

  try {
    const comment = await Comment.findById(id)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    if (comment.userId !== user.id) {
      return res.status(403).json({ error: 'You can only edit your own comments' })
    }

    const elapsed = Date.now() - comment.createdAt.getTime()
    if (elapsed > EDIT_WINDOW_MS) {
      return res.status(403).json({ error: 'Edit window has expired (15 minutes)' })
    }

    comment.body = body
    comment.editedAt = new Date()
    await comment.save()

    res.json(comment)
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to edit comment: ${message}` })
  }
})

/**
 * DELETE /:id — Soft-delete a comment (author or admin).
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Authentication required' })

  const { id } = validate(idParamsSchema, req.params)

  try {
    const comment = await Comment.findById(id)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    // Allow the comment author or an admin to delete
    const isAuthor = comment.userId === user.id
    const isAdmin = isAdminUser(user)

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own comments' })
    }

    comment.status = 'deleted'
    await comment.save()

    res.json({ success: true })
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to delete comment: ${message}` })
  }
})

/**
 * PUT /:id/moderate — Admin moderation (change status).
 */
router.put('/:id/moderate', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const { status } = validate(moderateBodySchema, req.body)

  try {
    const comment = await Comment.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    )
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    res.json(comment)
  } catch (err) {
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to moderate comment: ${message}` })
  }
})

/**
 * GET /admin/queue — Admin queue of all comments with optional status filter.
 */
router.get('/admin/queue', requireAuth, adminOnly, async (req, res) => {
  const { page = '1', limit = '20', status } = validate(adminQueueQuerySchema, req.query)

  const { pageNum, limitNum, skip } = parsePagination(page, limit, 100)

  const filter: Record<string, string> = {}
  if (status) {
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
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to fetch admin queue: ${message}` })
  }
})

/**
 * GET /user/:username — Public list of visible comments by username.
 */
router.get('/user/:username', async (req, res) => {
  const { username } = validate(usernameParamsSchema, req.params)
  const { page = '1', limit = '20' } = validate(paginationQuerySchema, req.query)

  const { pageNum, limitNum, skip } = parsePagination(page, limit, 100)

  try {
    const filter: QueryFilter<IComment> = { username, status: 'visible' }
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
    const message = toErrorMessage(err)
    res.status(500).json({ error: `Failed to fetch user comments: ${message}` })
  }
})

export default router
