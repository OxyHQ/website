import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { OxyServices } from '@oxy.so/core'
import { and, desc, eq, lt, sql } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { salesInquiries } from '../db/schema/index.js'
import { isUniqueViolation } from '../db/pgErrors.js'
import { validate } from '../utils/validate.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { config } from '../config.js'
import {
  INQUIRY_RETENTION_DAYS,
  INQUIRY_STATUSES,
  idempotencyKeyFor,
  salesInquirySchema,
  type InquiryStatus,
  type SalesInquiryInput,
} from '../contracts/salesInquiry.js'
import { z } from 'zod'

const router = Router()

/**
 * Burst guard in front of the public submission endpoint.
 *
 * This one is anonymous, so it cannot key on an Oxy user id the way the feature
 * board's does. It uses express-rate-limit's default key, which is derived from
 * the connection and held IN MEMORY for the window — nothing about the client
 * reaches the database, which is what keeps the no-IP-retention invariant
 * intact while still bounding a flood.
 *
 * It is deliberately the cheap guard rather than the real one: the durable
 * defence against duplicates is the unique `idempotency_key`, which holds
 * across instances and across restarts.
 */
const submitLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many requests. Wait a few minutes and try again.' })
  },
})

/**
 * Verify that the signed-in caller can actually see the account and application
 * they asked us to attach.
 *
 * A client-supplied account id is a CLAIM of access, not proof of one, and
 * writing it unchecked would let anyone label their inquiry with someone else's
 * organization. So the check runs as the caller, with the caller's own token,
 * against the Oxy control plane — the only system that knows the answer.
 *
 * A fresh `OxyServices` per request rather than the shared instance: the shared
 * one is unauthenticated and `setTokens` on it would leak one caller's token
 * into another caller's request.
 */
async function verifiedAccountRefs(
  bearerToken: string | undefined,
  accountId: string | undefined,
  applicationId: string | undefined,
): Promise<{ accountId?: string; applicationId?: string }> {
  if (!bearerToken || !accountId) return {}
  try {
    const asCaller = new OxyServices({ baseURL: config.oxyApiBase })
    asCaller.setTokens(bearerToken)
    const accounts = await asCaller.listAccounts()
    if (!accounts.some((node) => node.accountId === accountId)) return {}
    if (!applicationId) return { accountId }
    const apps = await asCaller.listAccountApps(accountId)
    return apps.some((app) => app._id === applicationId)
      ? { accountId, applicationId }
      : { accountId }
  } catch {
    // The control plane being unreachable must not fail the submission: the
    // inquiry is still worth having, just without the association.
    return {}
  }
}

function bearerFrom(header: string | undefined): string | undefined {
  if (!header) return undefined
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1]
}

/**
 * POST /  — submit a sales or private-evaluation request.
 *
 * `optionalAuth` rather than `requireAuth`: a buyer evaluating the platform has
 * no reason to have an Oxy account yet, and a form that makes them create one
 * first is a form that loses them.
 */
router.post('/', submitLimiter, optionalAuth, async (req, res) => {
  const input: SalesInquiryInput = validate(salesInquirySchema, req.body)

  // The honeypot. A submission that filled the hidden field is answered 202 and
  // dropped: a 400 naming the field is a free lesson in how to pass next time.
  if (input.company_url && input.company_url.trim().length > 0) {
    return res.status(202).json({ status: 'received' })
  }

  const refs = await verifiedAccountRefs(
    bearerFrom(req.headers.authorization),
    input.accountId,
    input.applicationId,
  )

  const deleteAfter = new Date(Date.now() + INQUIRY_RETENTION_DAYS * 86_400_000)
  const idempotencyKey = idempotencyKeyFor(input)

  try {
    const [row] = await db
      .insert(salesInquiries)
      .values({
        interest: input.interest,
        name: input.name,
        email: input.email,
        company: input.company,
        role: input.role || null,
        country: input.country || null,
        companySize: input.companySize || null,
        website: input.website || null,
        useCase: input.useCase,
        monthlyVolume: input.monthlyVolume || null,
        budget: input.budget || null,
        modalities: input.modalities,
        preferredRegion: input.preferredRegion || null,
        privacyRequirements: input.privacyRequirements,
        deploymentPreference: input.deploymentPreference || null,
        launchTimeline: input.launchTimeline || null,
        message: input.message || null,
        marketingConsent: input.marketingConsent,
        oxyUserId: req.user?.id ?? null,
        accountId: refs.accountId ?? null,
        applicationId: refs.applicationId ?? null,
        idempotencyKey,
        deleteAfter,
      })
      .returning({ id: salesInquiries._id, createdAt: salesInquiries.createdAt })

    notifySales(input, row?.id).catch((error: unknown) => {
      // A notification that failed to send is an operational problem, not a
      // reason to tell the submitter their message was lost — it is stored.
      console.error('[sales] notification failed:', error)
    })

    return res.status(201).json({
      id: row?.id,
      status: 'new',
      submittedAt: row?.createdAt?.toISOString() ?? new Date().toISOString(),
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      // The same person sent the same request twice. That is one inquiry, and
      // the submitter should see the success state rather than an error for
      // something that worked.
      const [existing] = await db
        .select({ id: salesInquiries._id, createdAt: salesInquiries.createdAt })
        .from(salesInquiries)
        .where(eq(salesInquiries.idempotencyKey, idempotencyKey))
        .limit(1)
      return res.status(200).json({
        id: existing?.id,
        status: 'new',
        submittedAt: existing?.createdAt?.toISOString() ?? new Date().toISOString(),
        duplicate: true,
      })
    }
    throw error
  }
})

/**
 * Hand the inquiry to whoever answers it.
 *
 * An adapter rather than an integration: the site's job ends at "a human knows
 * this arrived". `SALES_INQUIRY_WEBHOOK_URL` is whatever the sales side points
 * at — a channel, a mailer, a CRM intake. Absent the variable, the record in
 * the database is the notification and the admin view is where it is read.
 */
async function notifySales(input: SalesInquiryInput, id: string | undefined): Promise<void> {
  const url = process.env.SALES_INQUIRY_WEBHOOK_URL
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id,
      interest: input.interest,
      company: input.company,
      name: input.name,
      email: input.email,
      monthlyVolume: input.monthlyVolume,
      deploymentPreference: input.deploymentPreference,
      launchTimeline: input.launchTimeline,
      // The message body is deliberately NOT forwarded: it can carry things the
      // submitter would not expect to appear in a chat channel, and the admin
      // view is where it is read, behind authentication.
      hasMessage: Boolean(input.message),
    }),
  })
}

/* ── Admin surface ───────────────────────────────────────────────────── */

const listQuerySchema = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

/**
 * GET /  — the inquiry list, for staff.
 *
 * Ordered on `created_at` and then on `_id`. Postgres returns heap order, so a
 * sort on a tied timestamp alone lets a row appear on two pages or on neither
 * once a row is rewritten; `_id` is unique and ascends with creation.
 */
router.get('/', requireAuth, adminOnly, async (req, res) => {
  const { status, page, limit } = validate(listQuerySchema, req.query)
  const offset = (page - 1) * limit

  const where = status ? eq(salesInquiries.status, status) : undefined
  const rows = await db
    .select()
    .from(salesInquiries)
    .where(where)
    .orderBy(desc(salesInquiries.createdAt), desc(salesInquiries._id))
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(salesInquiries)
    .where(where)

  res.json({ inquiries: rows, total: count, page, limit })
})

/** Route params come off Express as `string | string[]`; validate, never cast. */
const idParamsSchema = z.object({ id: z.string().min(1).max(64) })

const updateSchema = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  internalNote: z.string().max(4000).optional(),
})

/**
 * PATCH /:id  — move an inquiry along, with attribution.
 *
 * Who changed the status and when are stored on the row rather than inferred
 * from `updated_at`: "someone touched this record" and "someone decided this
 * lead was lost" are different facts, and only the second one needs a name
 * against it.
 */
router.patch('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const patch = validate(updateSchema, req.body)
  const changes: Record<string, unknown> = { updatedAt: new Date() }
  if (patch.status) {
    changes.status = patch.status satisfies InquiryStatus
    changes.statusChangedBy = req.user?.id ?? null
    changes.statusChangedAt = new Date()
  }
  if (patch.internalNote !== undefined) changes.internalNote = patch.internalNote

  const [row] = await db
    .update(salesInquiries)
    .set(changes)
    .where(eq(salesInquiries._id, id))
    .returning()

  if (!row) return res.status(404).json({ error: 'Inquiry not found' })
  res.json(row)
})

/**
 * DELETE /:id  — honour a deletion request before the retention window closes.
 */
router.delete('/:id', requireAuth, adminOnly, async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  const [row] = await db
    .delete(salesInquiries)
    .where(eq(salesInquiries._id, id))
    .returning({ id: salesInquiries._id })
  if (!row) return res.status(404).json({ error: 'Inquiry not found' })
  res.json({ deleted: row.id })
})

/**
 * Delete inquiries past their retention date.
 *
 * Retention that is written down but never executed is not a retention policy.
 * A `won` inquiry is kept: it is the start of a contract relationship rather
 * than an unanswered lead, and deleting it silently removes the record of how
 * that relationship began.
 */
export async function purgeExpiredInquiries(): Promise<number> {
  const rows = await db
    .delete(salesInquiries)
    .where(and(lt(salesInquiries.deleteAfter, new Date()), sql`${salesInquiries.status} <> 'won'`))
    .returning({ id: salesInquiries._id })
  if (rows.length > 0) console.log(`[sales] purged ${rows.length} expired inquiries`)
  return rows.length
}

export default router
