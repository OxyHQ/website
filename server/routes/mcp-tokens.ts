import { Router } from 'express'
import crypto from 'node:crypto'
import { McpToken } from '../models/McpToken.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'

const router = Router()

// All endpoints require admin
router.use(requireAuth, adminOnly)

// List tokens (never expose hashes)
router.get('/', async (_req, res) => {
  const tokens = await McpToken.find({}, 'name createdBy createdAt lastUsedAt expiresAt revoked').sort('-createdAt')
  res.json(tokens)
})

// Generate a new token
router.post('/', async (req, res) => {
  const { name, expiresAt } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const token = await McpToken.create({
    name,
    tokenHash,
    createdBy: req.user!.username,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  })

  // Return raw token only once
  res.status(201).json({
    _id: token._id,
    name: token.name,
    token: rawToken,
    createdAt: token.createdAt,
    expiresAt: token.expiresAt,
  })
})

// Revoke a token
router.delete('/:id', async (req, res) => {
  const token = await McpToken.findByIdAndUpdate(req.params.id, { revoked: true }, { new: true })
  if (!token) return res.status(404).json({ error: 'Token not found' })
  res.json({ ok: true })
})

export default router
