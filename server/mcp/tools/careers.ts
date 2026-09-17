import { asc, count, eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { db, runInUnitOfWork } from '../../db/postgres.js'
import { populate, populateOne } from '../../db/refs.js'
import { jobs, media, teamMembers, translations } from '../../db/schema/index.js'
import { insertWithSlug, slugBase } from '../../services/slugs.js'
import { overlayMany, overlayOne } from '../localized.js'
import type { ToolRegistrar } from '../registry.js'
import { notFound, ok } from '../results.js'
import {
  dateInput, deletedOutput, dryRunInput, expectedUpdatedAtInput, itemsOutput, objectIdInput, optionalLinkInput, readLocaleInput,
  recordOutput, slugInput, slugLookup, text, title,
} from '../schemas.js'
import { auditLog, deleteRecord, updateRecord } from '../writes.js'

/* Job listings and team members. Both lists show only active rows to readers,
   which is all the public site serves; `active: false` is an admin filter. */

const descriptionBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: text(5000) }),
  z.object({ type: z.literal('heading'), text: text(300) }),
  z.object({ type: z.literal('list'), items: z.array(text(1000)).max(50) }),
])

const addressSchema = z.object({
  streetAddress: text(200).optional(),
  addressLocality: text(120).optional(),
  addressRegion: text(120).optional(),
  postalCode: text(20).optional(),
  addressCountry: z.string().length(2).regex(/^[A-Z]{2}$/, 'ISO 3166-1 alpha-2, upper case (e.g. "ES")').optional(),
})

const jobFields = {
  subtitle: text(300).optional().describe('Short tagline for the role'),
  location: text(120).optional().describe('e.g. "Remote", "Barcelona"'),
  type: text(60).optional().describe('e.g. "Full-time", "Contract"'),
  compensation: text(200).optional().describe('e.g. "$80K – $120K · Offers Equity"'),
  validThrough: z.union([z.literal(''), dateInput]).optional().describe('Application deadline as an ISO date; empty string for an evergreen role'),
  address: addressSchema.optional().describe('Physical address for JobPosting metadata'),
  description: z.array(descriptionBlockSchema).max(100).optional().describe('Content blocks: paragraph, heading or list'),
  active: z.boolean().optional().describe('Shown on the careers page. Defaults to true.'),
  order: z.number().int().optional().describe('Display order (lower first)'),
}

const socialsSchema = z.object({
  linkedin: optionalLinkInput.optional(),
  twitter: optionalLinkInput.optional(),
  github: optionalLinkInput.optional(),
  website: optionalLinkInput.optional(),
})

const memberFields = {
  department: text(120).optional(),
  bio: text(5000).optional(),
  avatar: z.union([z.literal(''), objectIdInput]).optional().describe('Media _id; empty string clears it'),
  order: z.number().int().optional(),
  active: z.boolean().optional().describe('Shown on the site. Defaults to true.'),
  socials: socialsSchema.optional().describe('Links; replaces the whole set when given'),
}

function translationsOf(collection: 'jobs' | 'team', id: unknown) {
  return and(eq(translations.collectionName, collection), eq(translations.documentId, String(id)))
}

async function translationCount(collection: 'jobs' | 'team', id: unknown): Promise<number> {
  const [n] = await db.select({ value: count() }).from(translations).where(translationsOf(collection, id))
  return Number(n?.value ?? 0)
}

export function registerCareersTools(server: ToolRegistrar): void {
  server.tool('list_jobs', 'List job listings in display order. Active listings by default; active: false lists every listing, active or not (admins only).', {
    active: z.boolean().optional().describe('Omit or true: active listings only. false: all listings, including inactive (admins only).'),
    locale: readLocaleInput,
  }, async ({ active, locale }) => {
    const rows = await db.select().from(jobs).where(active === false ? undefined : eq(jobs.active, true)).orderBy(asc(jobs.order), asc(jobs.department), asc(jobs._id))
    return ok(await overlayMany('jobs', rows, locale))
  }, { output: 'items', outputSchema: itemsOutput, localized: true })

  server.tool('get_job', 'Get a job listing by slug. Readers only see active listings.', {
    slug: slugLookup,
    locale: readLocaleInput,
  }, async ({ slug, locale }) => {
    const [job] = await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1)
    if (!job) throw notFound('Job')
    return ok(await overlayOne('jobs', job, locale))
  }, { outputSchema: recordOutput, localized: true })

  server.tool('create_job', 'Create a job listing. If slug is omitted it is generated from title + location (a numeric suffix is added if taken); an explicit slug that is taken is refused.', {
    title: title.describe('e.g. "Senior Frontend Engineer"'),
    department: text(120).min(1).describe('e.g. "Engineering"'),
    slug: slugInput.optional().describe('URL slug. Generated from title + location if omitted.'),
    ...jobFields,
  }, async (params, context) => {
    const base = slugBase([params.title, params.location].filter(Boolean).join(' '), 'job')
    const job = await insertWithSlug({ explicit: params.slug, base }, async (slug) => (await db.insert(jobs).values({ ...params, slug } as never).returning())[0])
    auditLog(context, 'create_job', { id: job._id, slug: job.slug })
    return ok(job)
  }, { outputSchema: recordOutput })

  server.tool('update_job', 'Update a job listing by slug. Only the fields you pass change.', {
    slug: slugLookup.describe('Current slug of the job'),
    newSlug: slugInput.optional().describe('New slug; must be unused'),
    title: title.optional(),
    department: text(120).min(1).optional(),
    ...jobFields,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ slug, newSlug, expectedUpdatedAt, ...fields }, context) => {
    const job = await updateRecord({ table: jobs, where: eq(jobs.slug, slug), label: 'Job', patch: { ...fields, slug: newSlug }, expectedUpdatedAt })
    auditLog(context, 'update_job', { id: job._id, slug: job.slug })
    return ok(job)
  }, { outputSchema: recordOutput })

  server.tool('delete_job', 'Permanently delete a job listing and its translations. dryRun: true shows what would go. To hide a listing without losing it, set active: false instead.', {
    slug: slugLookup,
    dryRun: dryRunInput,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ slug, dryRun, expectedUpdatedAt }, context) => {
    const outcome = await runInUnitOfWork(async () => {
      const result = await deleteRecord({
        table: jobs,
        where: eq(jobs.slug, slug),
        label: 'Job',
        dryRun,
        expectedUpdatedAt,
        describe: (row) => ({ _id: row._id, slug: row.slug, title: row.title, active: row.active }),
        impact: async (row) => ({ translations: await translationCount('jobs', row._id) }),
      })
      if (!result.deleted) return result
      const removed = await db.delete(translations).where(translationsOf('jobs', result.target._id)).returning({ id: translations._id })
      return { deleted: true as const, slug, job: result.target, translationsRemoved: removed.length }
    })
    if (outcome.deleted) auditLog(context, 'delete_job', { slug })
    return ok(outcome)
  }, { outputSchema: deletedOutput })

  server.tool('list_team_members', 'List team members in display order, avatars resolved. Active members by default; active: false lists everyone (admins only).', {
    active: z.boolean().optional().describe('Omit or true: active members only. false: everyone, including inactive (admins only).'),
    locale: readLocaleInput,
  }, async ({ active, locale }) => {
    const rows = await db.select().from(teamMembers).where(active === false ? undefined : eq(teamMembers.active, true)).orderBy(asc(teamMembers.order), asc(teamMembers.name), asc(teamMembers._id))
    return ok(await overlayMany('team', await populate(rows, { avatar: media }), locale))
  }, { output: 'items', outputSchema: itemsOutput, localized: true })

  server.tool('get_team_member', 'Get a team member by slug, avatar resolved.', {
    slug: slugLookup,
    locale: readLocaleInput,
  }, async ({ slug, locale }) => {
    const [row] = await db.select().from(teamMembers).where(eq(teamMembers.slug, slug)).limit(1)
    if (!row) throw notFound('Team member')
    return ok(await overlayOne('team', (await populateOne(row, { avatar: media })) as Record<string, unknown>, locale))
  }, { outputSchema: recordOutput, localized: true })

  server.tool('create_team_member', 'Create a team member. If slug is omitted it is generated from the name (a numeric suffix is added if taken); an explicit slug that is taken is refused.', {
    name: text(120).min(1).describe('Full name'),
    role: text(120).min(1).describe('Job title'),
    slug: slugInput.optional().describe('URL slug. Generated from the name if omitted.'),
    ...memberFields,
  }, async (params, context) => {
    const values = { ...params, avatar: params.avatar || null }
    const member = await insertWithSlug({ explicit: params.slug, base: slugBase(params.name, 'member') }, async (slug) => (await db.insert(teamMembers).values({ ...values, slug } as never).returning())[0])
    auditLog(context, 'create_team_member', { id: member._id, slug: member.slug })
    return ok(await populateOne(member, { avatar: media }))
  }, { outputSchema: recordOutput })

  server.tool('update_team_member', 'Update a team member by slug. Only the fields you pass change.', {
    slug: slugLookup.describe('Current slug of the member'),
    newSlug: slugInput.optional().describe('New slug; must be unused'),
    name: text(120).min(1).optional(),
    role: text(120).min(1).optional(),
    ...memberFields,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ slug, newSlug, expectedUpdatedAt, ...fields }, context) => {
    const patch: Record<string, unknown> = { ...fields, slug: newSlug }
    if (fields.avatar !== undefined) patch.avatar = fields.avatar || null
    const member = await updateRecord({ table: teamMembers, where: eq(teamMembers.slug, slug), label: 'Team member', patch, expectedUpdatedAt })
    auditLog(context, 'update_team_member', { id: member._id, slug: member.slug })
    return ok(await populateOne(member, { avatar: media }))
  }, { outputSchema: recordOutput })

  server.tool('delete_team_member', 'Permanently delete a team member and their translations. dryRun: true shows what would go. To hide someone, set active: false instead.', {
    slug: slugLookup,
    dryRun: dryRunInput,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ slug, dryRun, expectedUpdatedAt }, context) => {
    const outcome = await runInUnitOfWork(async () => {
      const result = await deleteRecord({
        table: teamMembers,
        where: eq(teamMembers.slug, slug),
        label: 'Team member',
        dryRun,
        expectedUpdatedAt,
        describe: (row) => ({ _id: row._id, slug: row.slug, name: row.name, active: row.active }),
        impact: async (row) => ({ translations: await translationCount('team', row._id) }),
      })
      if (!result.deleted) return result
      const removed = await db.delete(translations).where(translationsOf('team', result.target._id)).returning({ id: translations._id })
      return { deleted: true as const, slug, member: result.target, translationsRemoved: removed.length }
    })
    if (outcome.deleted) auditLog(context, 'delete_team_member', { slug })
    return ok(outcome)
  }, { outputSchema: deletedOutput })
}
