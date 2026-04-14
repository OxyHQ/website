import { Router } from 'express'
import { z } from 'zod'
import { Referral } from '../models/Referral.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'

const router = Router()

const CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

const referralBodySchema = z.object({
  code: z.string().min(2).max(64).regex(CODE_REGEX, 'Code must be URL-safe: letters, digits, dash, underscore'),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  type: z.enum(['paid', 'ambassador', 'user']).default('user'),
  status: z.enum(['active', 'paused', 'revoked']).default('active'),
  oxyUserId: z.string().optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  customLandingUrl: z.string().optional(),
  notes: z.string().optional(),
})

const referralUpdateSchema = referralBodySchema.partial().omit({ code: true })

const listQuerySchema = z.object({
  type: z.enum(['paid', 'ambassador', 'user']).optional(),
  status: z.enum(['active', 'paused', 'revoked']).optional(),
})

// ── Admin: list all referrals ───────────────────────────────────────────────
router.get('/', requireAuth, adminOnly, async (req, res) => {
  const query = validate(listQuerySchema, req.query)
  const mongoQuery: Record<string, unknown> = {}
  if (query.type) mongoQuery.type = query.type
  if (query.status) mongoQuery.status = query.status
  const docs = await Referral.find(mongoQuery).sort({ type: 1, createdAt: -1 })
  res.json(docs)
})

// ── Public: resolve a code ──────────────────────────────────────────────────
// Only returns the public-safe subset — no email, no commission, no counts.
router.get('/:code', async (req, res) => {
  const doc = await Referral.findOne({ code: req.params.code })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  if (doc.status !== 'active') return res.status(404).json({ error: 'Not found' })
  res.json({
    code: doc.code,
    name: doc.name,
    type: doc.type,
    status: doc.status,
    customLandingUrl: doc.customLandingUrl ?? null,
  })
})

// ── Admin: create ───────────────────────────────────────────────────────────
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(referralBodySchema, req.body)
  const existing = await Referral.findOne({ code: body.code })
  if (existing) {
    return res.status(409).json({ error: 'Referral with this code already exists' })
  }
  const doc = await Referral.create(body)
  res.status(201).json(doc)
})

// ── Admin: partial update ───────────────────────────────────────────────────
router.put('/:code', requireAuth, adminOnly, async (req, res) => {
  const patch = validate(referralUpdateSchema, req.body)
  const doc = await Referral.findOneAndUpdate(
    { code: req.params.code },
    patch,
    { new: true, runValidators: true },
  )
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// ── Admin: hard delete ──────────────────────────────────────────────────────
router.delete('/:code', requireAuth, adminOnly, async (req, res) => {
  const doc = await Referral.findOneAndDelete({ code: req.params.code })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true, code: req.params.code })
})

// ── Public: click ping ──────────────────────────────────────────────────────
// Atomic $inc on the clicks counter. Only bumps active codes so paused/revoked
// entries stop accumulating stats. Always responds 204 to keep the client fire-
// and-forget — unknown / inactive codes are silently ignored.
router.post('/:code/click', async (req, res) => {
  await Referral.updateOne(
    { code: req.params.code, status: 'active' },
    { $inc: { clicks: 1 } },
  )
  res.status(204).end()
})

export default router
