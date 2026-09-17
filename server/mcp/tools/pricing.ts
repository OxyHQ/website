import { and, asc, count, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db, runInUnitOfWork } from '../../db/postgres.js'
import { pricingPlans, testimonials, translations } from '../../db/schema/index.js'
import { overlayMany } from '../localized.js'
import type { ToolRegistrar } from '../registry.js'
import { invalid, ok } from '../results.js'
import { dryRunInput, expectedUpdatedAtInput, itemsOutput, objectIdInput, optionalLinkInput, readLocaleInput, recordOutput, text } from '../schemas.js'
import { auditLog, updateRecord } from '../writes.js'

/* Pricing plans and testimonials: small lists the admin edits as a whole. A
   whole-list replace is explicit, previewable, and keeps ids (and so the
   translations attached to them); a single change has its own tool. */

const pricingPlanFields = {
  name: text(120).min(1),
  price: z.object({ monthly: z.number().min(0).max(1_000_000), annual: z.number().min(0).max(10_000_000) }),
  description: text(2000).optional(),
  features: z.array(text(300)).max(50).optional(),
  cta: text(80).optional(),
  ctaHref: optionalLinkInput.optional().describe('Where the plan button goes: "/contact/sales" or "https://…"'),
  highlighted: z.boolean().optional(),
  order: z.number().int().optional(),
}

const pricingPlanSchema = z.object({
  _id: objectIdInput.optional().describe('An existing plan\'s _id (from get_pricing), so it and its translations are kept. Omit for a new plan.'),
  ...pricingPlanFields,
})

const testimonialSchema = z.object({
  _id: objectIdInput.optional().describe('An existing testimonial\'s _id, so it and its translations are kept'),
  quote: text(2000).min(1),
  author: text(120).min(1),
  role: text(120).optional(),
  company: text(120).optional(),
  avatar: z.union([z.literal(''), objectIdInput, optionalLinkInput]).optional(),
  order: z.number().int().optional(),
})

type Row = Record<string, unknown>

function translationsOf(collection: 'pricing' | 'testimonials', ids: unknown[]) {
  return and(eq(translations.collectionName, collection), inArray(translations.documentId, ids.map(String)))
}

/**
 * What a replacement would do, by _id: which rows are kept (and which of their
 * fields change), which are added, which are removed and how many translations
 * go with them.
 */
async function replacementPlan(collection: 'pricing' | 'testimonials', current: Row[], next: Row[], label: (row: Row) => unknown) {
  const byId = new Map(current.map((row) => [String(row._id), row]))
  const keptIds = new Set(next.map((row) => row._id).filter(Boolean).map(String))
  const unknown = [...keptIds].filter((id) => !byId.has(id))
  if (unknown.length > 0) throw invalid('These _ids are not in the current list; omit _id for new entries', { unknown })
  const removed = current.filter((row) => !keptIds.has(String(row._id)))
  const changed = next
    .filter((row) => row._id)
    .map((row) => {
      const before = byId.get(String(row._id)) as Row
      const fields = Object.keys(row).filter((key) => key !== '_id' && JSON.stringify(row[key]) !== JSON.stringify(before[key]))
      return { _id: row._id, label: label(before), fields }
    })
    .filter((entry) => entry.fields.length > 0)
  const [orphaned] = removed.length > 0
    ? await db.select({ value: count() }).from(translations).where(translationsOf(collection, removed.map((row) => row._id)))
    : [{ value: 0 }]
  return {
    added: next.filter((row) => !row._id).map(label),
    removed: removed.map((row) => ({ _id: row._id, label: label(row) })),
    changed,
    translationsRemoved: Number(orphaned?.value ?? 0),
    collection,
  }
}

export function registerPricingTools(server: ToolRegistrar): void {
  server.tool('get_pricing', 'Get all pricing plans in display order, optionally in another locale.', {
    locale: readLocaleInput,
  }, async ({ locale }) => {
    const plans = await db.select().from(pricingPlans).orderBy(asc(pricingPlans.order), asc(pricingPlans._id))
    return ok(await overlayMany('pricing', plans, locale))
  }, { output: 'items', outputSchema: itemsOutput, localized: true })

  server.tool('replace_pricing', 'Replace ALL pricing plans with this list, in one transaction. Pass each plan you keep with its _id and every field you want to keep (read get_pricing first): an omitted field takes its default. Plans left out are deleted with their translations. dryRun: true returns what would be added, removed and changed. An empty list needs confirmEmpty: true. To change one plan, use update_pricing_plan.', {
    plans: z.array(pricingPlanSchema).max(20),
    confirmEmpty: z.boolean().optional().describe('Required, and must be true, to delete every plan'),
    dryRun: dryRunInput,
  }, async ({ plans, confirmEmpty, dryRun }, context) => {
    if (plans.length === 0 && confirmEmpty !== true && !dryRun) {
      throw invalid('An empty list would delete every pricing plan; pass confirmEmpty: true if that is intended')
    }
    const ids = plans.map((plan) => plan._id).filter(Boolean)
    if (new Set(ids).size !== ids.length) throw invalid('The same _id appears more than once')
    return runInUnitOfWork(async () => {
      const current = await db.select().from(pricingPlans).orderBy(asc(pricingPlans.order), asc(pricingPlans._id)).for('update')
      const plan = await replacementPlan('pricing', current, plans, (row) => row.name)
      if (dryRun) return ok({ dryRun: true, ...plan })
      if (plan.removed.length > 0) await db.delete(translations).where(translationsOf('pricing', plan.removed.map((row) => row._id)))
      await db.delete(pricingPlans)
      const result = plans.length === 0 ? [] : await db.insert(pricingPlans).values(plans as never).returning()
      auditLog(context, 'replace_pricing', { count: result.length, removed: plan.removed.length })
      return ok({ plans: result, ...plan })
    })
  })

  server.tool('update_pricing_plan', 'Change fields of one pricing plan by _id. Only the fields you pass change; everything else, including ctaHref, is kept.', {
    id: objectIdInput.describe('The plan _id from get_pricing'),
    name: pricingPlanFields.name.optional(),
    price: pricingPlanFields.price.optional(),
    description: pricingPlanFields.description,
    features: pricingPlanFields.features,
    cta: pricingPlanFields.cta,
    ctaHref: pricingPlanFields.ctaHref,
    highlighted: pricingPlanFields.highlighted,
    order: pricingPlanFields.order,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ id, expectedUpdatedAt, ...patch }, context) => {
    const plan = await updateRecord({ table: pricingPlans, where: eq(pricingPlans._id, id), label: 'Pricing plan', patch, expectedUpdatedAt })
    auditLog(context, 'update_pricing_plan', { id })
    return ok(plan)
  }, { outputSchema: recordOutput })

  server.tool('get_testimonials', 'Get all testimonials in display order, optionally in another locale.', {
    locale: readLocaleInput,
  }, async ({ locale }) => {
    const rows = await db.select().from(testimonials).orderBy(asc(testimonials.order), asc(testimonials._id))
    return ok(await overlayMany('testimonials', rows, locale))
  }, { output: 'items', outputSchema: itemsOutput, localized: true })

  server.tool('replace_testimonials', 'Replace ALL testimonials with this list, in one transaction. Pass the ones you keep with their _id; the rest are deleted with their translations. dryRun: true returns what would change. An empty list needs confirmEmpty: true.', {
    testimonials: z.array(testimonialSchema).max(100),
    confirmEmpty: z.boolean().optional().describe('Required, and must be true, to delete every testimonial'),
    dryRun: dryRunInput,
  }, async ({ testimonials: next, confirmEmpty, dryRun }, context) => {
    if (next.length === 0 && confirmEmpty !== true && !dryRun) {
      throw invalid('An empty list would delete every testimonial; pass confirmEmpty: true if that is intended')
    }
    const ids = next.map((row) => row._id).filter(Boolean)
    if (new Set(ids).size !== ids.length) throw invalid('The same _id appears more than once')
    return runInUnitOfWork(async () => {
      const current = await db.select().from(testimonials).orderBy(asc(testimonials.order), asc(testimonials._id)).for('update')
      const plan = await replacementPlan('testimonials', current, next, (row) => row.author)
      if (dryRun) return ok({ dryRun: true, ...plan })
      if (plan.removed.length > 0) await db.delete(translations).where(translationsOf('testimonials', plan.removed.map((row) => row._id)))
      await db.delete(testimonials)
      const rows = next.map((row) => ({ ...row, avatar: row.avatar || null }))
      const result = rows.length === 0 ? [] : await db.insert(testimonials).values(rows as never).returning()
      auditLog(context, 'replace_testimonials', { count: result.length, removed: plan.removed.length })
      return ok({ testimonials: result, ...plan })
    })
  })
}
