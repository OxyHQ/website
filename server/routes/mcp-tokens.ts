import { Router } from 'express'
import crypto from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import { mcpTokens } from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'

const router = Router()

const createTokenBodySchema = z.object({
  name: z.string().min(1),
  expiresAt: z.union([z.string(), z.number()]).optional(),
}).passthrough()

const idParamsSchema = z.object({ id: z.string().min(1) })

// All endpoints require admin
router.use(requireAuth, adminOnly)

// List tokens. The hash is never selected, so it cannot leak through this route.
router.get('/', async (_req, res) => {
  const tokens = await db
    .select({
      _id: mcpTokens._id,
      name: mcpTokens.name,
      createdBy: mcpTokens.createdBy,
      createdAt: mcpTokens.createdAt,
      lastUsedAt: mcpTokens.lastUsedAt,
      expiresAt: mcpTokens.expiresAt,
      revoked: mcpTokens.revoked,
    })
    .from(mcpTokens)
    .orderBy(desc(mcpTokens.createdAt))
  res.json(tokens)
})

// Generate a new token
router.post('/', async (req, res) => {
  const { name, expiresAt } = validate(createTokenBodySchema, req.body)

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const createdBy = req.user?.username ?? 'unknown'

  const [token] = await db
    .insert(mcpTokens)
    .values({ name, tokenHash, createdBy, expiresAt: expiresAt ? new Date(expiresAt) : null })
    .returning()

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
  const { id } = validate(idParamsSchema, req.params)
  const [token] = await db
    .update(mcpTokens)
    .set({ revoked: true, updatedAt: new Date() })
    .where(eq(mcpTokens._id, id))
    .returning({ id: mcpTokens._id })
  if (!token) return res.status(404).json({ error: 'Token not found' })
  res.json({ ok: true })
})

export default router
