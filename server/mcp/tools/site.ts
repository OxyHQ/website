import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/postgres.js'
import { populateOne } from '../../db/refs.js'
import { upsertSingleton } from '../../db/singleton.js'
import { footers, heroContents, media, navigationDropdowns, pages, siteSettings } from '../../db/schema/index.js'
import { HERO_MEDIA_FIELDS, readHero, withHeroMedia } from '../../services/hero.js'
import { heroUpdateSchema } from '../../validation/hero.js'
import { overlayMany, overlayOne } from '../localized.js'
import type { ToolRegistrar } from '../registry.js'
import { notFound, ok } from '../results.js'
import { expectedUpdatedAtInput, itemsOutput, optionalLinkInput, objectIdInput, readLocaleInput, recordOutput, slugInput, slugLookup, text, title } from '../schemas.js'
import { auditLog, definedFields, updateRecord } from '../writes.js'

/* Pages, navigation, the legacy footer snapshot, the hero and site settings. */

const sectionSchema = z.object({
  type: z.string().min(1).max(60),
  heading: text(500).optional(),
  subheading: text(1000).optional(),
  content: text(50_000).optional(),
  items: z.array(z.union([text(5000), z.record(z.string(), z.unknown())])).max(200).optional(),
  order: z.number().int().optional(),
})

export function registerSiteTools(server: ToolRegistrar): void {
  server.tool('list_pages', 'List the CMS pages: _id, slug and title.', {}, async () => {
    const rows = await db.select({ _id: pages._id, slug: pages.slug, title: pages.title, updatedAt: pages.updatedAt }).from(pages).orderBy(asc(pages.slug), asc(pages._id))
    return ok(rows)
  }, { output: 'items', outputSchema: itemsOutput })

  server.tool('get_page', 'Get a CMS page by slug, optionally in another locale.', {
    slug: slugLookup,
    locale: readLocaleInput,
  }, async ({ slug, locale }) => {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1)
    if (!page) throw notFound('Page')
    return ok(await overlayOne('pages', page, locale))
  }, { outputSchema: recordOutput, localized: true })

  server.tool('upsert_page', 'Create a page, or update the page with this slug. Only the fields you pass are written on an update. Pass expectedUpdatedAt when editing an existing page to refuse the write if it changed since you read it.', {
    slug: slugInput,
    title,
    description: text(2000).optional(),
    sections: z.array(sectionSchema).max(100).optional().describe('Replaces the whole section list when given'),
    promptPhrases: z.array(text(300)).max(50).optional(),
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ expectedUpdatedAt, ...params }, context) => {
    const [existing] = await db.select({ id: pages._id }).from(pages).where(eq(pages.slug, params.slug)).limit(1)
    const page = existing
      ? await updateRecord({ table: pages, where: eq(pages._id, existing.id), label: 'Page', patch: params, expectedUpdatedAt })
      : (await db.insert(pages).values(definedFields(params) as never).returning())[0]
    auditLog(context, 'upsert_page', { id: page._id, slug: params.slug, created: !existing })
    return ok(page)
  }, { outputSchema: recordOutput })

  server.tool('get_navigation', 'Get the navigation dropdowns, in display order, optionally in another locale.', {
    locale: readLocaleInput,
  }, async ({ locale }) => {
    const rows = await db.select().from(navigationDropdowns).orderBy(asc(navigationDropdowns.order), asc(navigationDropdowns._id))
    return ok(await overlayMany('navigation', rows, locale))
  }, { output: 'items', outputSchema: itemsOutput, localized: true })

  server.tool('get_footer', 'Get the legacy footer snapshot. The live footer is code, not CMS content, so there is intentionally no tool to edit it.', {}, async () => {
    const [footer] = await db.select().from(footers).limit(1)
    return ok(footer ?? { _id: null, columns: [], socialLinks: [], copyright: '' })
  }, { outputSchema: recordOutput })

  server.tool('get_hero', 'Get the homepage hero: title and background video/poster (media fields resolved). Before the hero has ever been edited this returns the shipped defaults with `_id: null`; reading never creates the row.', {
    locale: readLocaleInput,
  }, async ({ locale }) => {
    const hero = await withHeroMedia(await readHero())
    return ok(hero._id ? await overlayOne('hero', hero, locale) : hero)
  }, { outputSchema: recordOutput, localized: true })

  server.tool('update_hero', 'Update the homepage hero. Pass any subset of: title (supports newlines) and the background video/poster fields (a Media _id, or a static path such as "/images/landing/hero-panel.webm"; an empty string clears it). Only provided fields change.', {
    title: text(500).optional(),
    backgroundVideoWebm: z.union([z.literal(''), objectIdInput, optionalLinkInput]).optional(),
    backgroundVideoMp4: z.union([z.literal(''), objectIdInput, optionalLinkInput]).optional(),
    backgroundPoster: z.union([z.literal(''), objectIdInput, optionalLinkInput]).optional(),
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ expectedUpdatedAt, ...params }, context) => {
    // The same schema the REST route validates with, so both surfaces agree.
    const body = heroUpdateSchema.parse(params)
    const update: Record<string, unknown> = {}
    if (body.title !== undefined) update.title = body.title
    for (const field of HERO_MEDIA_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field] || null
    }
    const [current] = await db.select({ id: heroContents._id }).from(heroContents).limit(1)
    const hero = current
      ? await updateRecord({ table: heroContents, where: eq(heroContents._id, current.id), label: 'Hero', patch: update, expectedUpdatedAt })
      : ((await upsertSingleton(heroContents, update)) as Record<string, unknown>)
    auditLog(context, 'update_hero', { id: hero._id, fields: Object.keys(update) })
    return ok(await withHeroMedia(hero))
  }, { outputSchema: recordOutput })

  server.tool('get_settings', 'Get the site settings (title, description, OG image resolved, banner), optionally in another locale.', {
    locale: readLocaleInput,
  }, async ({ locale }) => {
    const [row] = await db.select().from(siteSettings).limit(1)
    const settings = await populateOne(row, { ogImage: media })
    if (!settings) return ok({ _id: null, siteTitle: 'Oxy', siteDescription: '', ogImage: '', banner: null })
    return ok(await overlayOne('settings', settings, locale))
  }, { outputSchema: recordOutput, localized: true })

  server.tool('update_settings', 'Update site settings. Only the fields you pass change; `banner` is replaced as a whole.', {
    siteTitle: text(120).min(1).optional(),
    siteDescription: text(500).optional(),
    ogImage: z.union([z.literal(''), objectIdInput]).optional().describe('Media _id for the default Open Graph image; empty string clears it'),
    banner: z.object({
      text: text(300),
      href: optionalLinkInput.optional(),
      visible: z.boolean().optional(),
    }).nullable().optional().describe('The site-wide banner; null removes it'),
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ expectedUpdatedAt, ...params }, context) => {
    const patch: Record<string, unknown> = { ...params }
    if (params.ogImage !== undefined) patch.ogImage = params.ogImage || null
    const [current] = await db.select({ id: siteSettings._id }).from(siteSettings).limit(1)
    const settings = current
      ? await updateRecord({ table: siteSettings, where: eq(siteSettings._id, current.id), label: 'Settings', patch, expectedUpdatedAt })
      : ((await upsertSingleton(siteSettings, definedFields(patch))) as Record<string, unknown>)
    auditLog(context, 'update_settings', { id: settings._id, fields: Object.keys(definedFields(params)) })
    return ok(settings)
  }, { outputSchema: recordOutput })
}
