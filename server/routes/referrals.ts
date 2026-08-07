import { Router } from 'express'
import { z } from 'zod'
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { referrals } from '../db/schema/index.js'
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
  const filters: SQL[] = []
  if (query.type) filters.push(eq(referrals.type, query.type))
  if (query.status) filters.push(eq(referrals.status, query.status))
  const docs = await db
    .select()
    .from(referrals)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(asc(referrals.type), desc(referrals.createdAt), asc(referrals._id))
  res.json(docs)
})

// ── Public: resolve a code ──────────────────────────────────────────────────
// Only returns the public-safe subset — no email, no commission, no counts.
router.get('/:code', async (req, res) => {
  const [doc] = await db.select().from(referrals).where(eq(referrals.code, String(req.params.code))).limit(1)
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

// ── Dashboard view ─────────────────────────────────────────────────────────
// Returns the same public fields plus clicks / signups / commissionPercent.
// The referral code itself is the soft secret — anyone holding it can see
// these counters. Email and admin notes stay hidden.
router.get('/:code/dashboard', async (req, res) => {
  const [doc] = await db.select().from(referrals).where(eq(referrals.code, String(req.params.code))).limit(1)
  if (!doc) return res.status(404).json({ error: 'Not found' })
  if (doc.status !== 'active') return res.status(404).json({ error: 'Not found' })
  res.json({
    code: doc.code,
    name: doc.name,
    type: doc.type,
    status: doc.status,
    customLandingUrl: doc.customLandingUrl ?? null,
    clicks: doc.clicks,
    signups: doc.signups,
    commissionPercent: doc.commissionPercent ?? null,
    oxyUserId: doc.oxyUserId ?? null,
  })
})

// ── Admin: create ───────────────────────────────────────────────────────────
router.post('/', requireAuth, adminOnly, async (req, res) => {
  const body = validate(referralBodySchema, req.body)
  const [existing] = await db.select({ id: referrals._id }).from(referrals).where(eq(referrals.code, body.code)).limit(1)
  if (existing) {
    return res.status(409).json({ error: 'Referral with this code already exists' })
  }
  const [doc] = await db.insert(referrals).values(body as never).returning()
  res.status(201).json(doc)
})

// ── Admin: partial update ───────────────────────────────────────────────────
router.put('/:code', requireAuth, adminOnly, async (req, res) => {
  const patch = validate(referralUpdateSchema, req.body)
  const [doc] = await db
    .update(referrals)
    .set({ ...patch, updatedAt: new Date() } as never)
    .where(eq(referrals.code, String(req.params.code)))
    .returning()
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// ── Admin: hard delete ──────────────────────────────────────────────────────
router.delete('/:code', requireAuth, adminOnly, async (req, res) => {
  const [doc] = await db.delete(referrals).where(eq(referrals.code, String(req.params.code))).returning({ id: referrals._id })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true, code: req.params.code })
})

// ── Public: click ping ──────────────────────────────────────────────────────
// Atomic increment on the clicks counter, done in SQL rather than read-modify-
// write so two clicks arriving together both count. Only bumps active codes so
// paused/revoked entries stop accumulating stats. Always responds 204 to keep
// the client fire-and-forget — unknown / inactive codes are silently ignored.
router.post('/:code/click', async (req, res) => {
  await db
    .update(referrals)
    .set({ clicks: sql`${referrals.clicks} + 1` })
    .where(and(eq(referrals.code, String(req.params.code)), eq(referrals.status, 'active')))
  res.status(204).end()
})

export default router
