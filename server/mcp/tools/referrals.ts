import { and, asc, desc, eq, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/postgres.js'
import { isUniqueViolation } from '../../db/pgErrors.js'
import { referrals } from '../../db/schema/index.js'
import type { ToolRegistrar } from '../registry.js'
import { conflict, notFound, ok } from '../results.js'
import { deletedOutput, dryRunInput, expectedUpdatedAtInput, itemsOutput, optionalLinkInput, recordOutput, text } from '../schemas.js'
import { auditLog, deleteRecord, updateRecord } from '../writes.js'

/* Referral codes. Admin-only throughout: rows carry contact emails and notes. */

const TYPE = z.enum(['paid', 'ambassador', 'user'])
const STATUS = z.enum(['active', 'paused', 'revoked'])
const codeInput = z.string().min(2).max(60).regex(/^[A-Za-z0-9_-]+$/, 'Letters, digits, dash and underscore only')

const referralFields = {
  email: z.union([z.literal(''), z.string().email().max(254)]).optional().describe('Contact email; never shown publicly'),
  type: TYPE.optional().describe('"paid" (commission), "ambassador" (tracked, unpaid) or "user" (share link)'),
  status: STATUS.optional().describe('Only active codes resolve publicly'),
  oxyUserId: text(64).optional().describe('Linked Oxy account id'),
  commissionPercent: z.number().int().min(0).max(100).optional().describe('Whole percent, 0–100, for type "paid"'),
  customLandingUrl: optionalLinkInput.optional().describe('Destination override; empty string clears it'),
  notes: text(5000).optional().describe('Admin-only notes'),
}

function normalize(fields: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...fields }
  for (const key of ['email', 'oxyUserId', 'customLandingUrl'] as const) {
    if (fields[key] !== undefined) next[key] = fields[key] || null
  }
  return next
}

export function registerReferralTools(server: ToolRegistrar): void {
  server.tool('list_referrals', 'List referral codes, filtered by program type or status.', {
    type: TYPE.optional(),
    status: STATUS.optional(),
  }, async ({ type, status }) => {
    const filters: SQL[] = []
    if (type) filters.push(eq(referrals.type, type))
    if (status) filters.push(eq(referrals.status, status))
    return ok(await db.select().from(referrals).where(filters.length > 0 ? and(...filters) : undefined).orderBy(asc(referrals.type), desc(referrals.createdAt), asc(referrals._id)))
  }, { output: 'items', outputSchema: itemsOutput })

  server.tool('get_referral', 'Get a referral by code.', {
    code: text(60).min(1),
  }, async ({ code }) => {
    const [row] = await db.select().from(referrals).where(eq(referrals.code, code)).limit(1)
    if (!row) throw notFound('Referral')
    return ok(row)
  }, { outputSchema: recordOutput })

  server.tool('create_referral', 'Create a referral code. Defaults to type "user" and status "active".', {
    code: codeInput.describe('Unique code, e.g. "ALEX-2026"'),
    name: text(120).min(1).describe('Referrer name shown on /referrals?ref=CODE'),
    ...referralFields,
  }, async (input, context) => {
    try {
      const [row] = await db.insert(referrals).values(normalize(input) as never).returning()
      auditLog(context, 'create_referral', { id: row._id, code: row.code })
      return ok(row)
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict(`Referral "${input.code}" already exists`)
      throw error
    }
  }, { outputSchema: recordOutput })

  server.tool('update_referral', 'Update a referral by code. Only the fields you pass change.', {
    code: text(60).min(1),
    name: text(120).min(1).optional(),
    ...referralFields,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ code, expectedUpdatedAt, ...fields }, context) => {
    const row = await updateRecord({ table: referrals, where: eq(referrals.code, code), label: 'Referral', patch: normalize(fields), expectedUpdatedAt })
    auditLog(context, 'update_referral', { id: row._id, code })
    return ok(row)
  }, { outputSchema: recordOutput })

  server.tool('delete_referral', 'Permanently delete a referral code and its click/signup counts. To stop a code working, set status "revoked" instead. dryRun: true shows it without deleting.', {
    code: text(60).min(1),
    dryRun: dryRunInput,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ code, dryRun, expectedUpdatedAt }, context) => {
    const result = await deleteRecord({
      table: referrals,
      where: eq(referrals.code, code),
      label: 'Referral',
      dryRun,
      expectedUpdatedAt,
      describe: (row) => ({ _id: row._id, code: row.code, name: row.name, clicks: row.clicks, signups: row.signups }),
    })
    if (result.deleted) auditLog(context, 'delete_referral', { id: result.target._id, code })
    return ok(result.deleted ? { deleted: true, code, referral: result.target } : result)
  }, { outputSchema: deletedOutput })
}
