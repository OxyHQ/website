/**
 * Non-destructive upsert: ensure Homiio product + Newsroom locales exist,
 * publish Homiio Tips with English as the canonical (default-locale) body,
 * and upsert es/ca translation rows. Safe for production (nothing is wiped).
 *
 * Usage: DATABASE_URL=... bun server/seedHomiioTips.ts
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { and, count, eq, ne, sql } from 'drizzle-orm'
import { config } from './config.js'
import { closeDatabase, db } from './db/postgres.js'
import { locales, media, newsroomPosts, products, translations } from './db/schema/index.js'

type LocalizedFields = {
  title: string
  resume: string
  description: string
  content: string
  imageAlt: string
}

type TipSeed = {
  slug: string
  tags: string[]
  featured: boolean
  publishedAt: string
  coverUrl: string
  coverFilename: string
  authorUsername: string
  en: LocalizedFields
  es: LocalizedFields
  ca: LocalizedFields
}

type TipsDataFile = {
  deleteSlugs: string[]
  tips: TipSeed[]
}

const TRANSLATION_LOCALES = ['es', 'ca'] as const

const DESIRED_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English', isDefault: true, enabled: true, order: 0 },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isDefault: false, enabled: true, order: 1 },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', isDefault: false, enabled: true, order: 2 },
] as const

function loadTipsData(): TipsDataFile {
  const here = dirname(fileURLToPath(import.meta.url))
  const path = join(here, 'data', 'homiioTips.json')
  return JSON.parse(readFileSync(path, 'utf8')) as TipsDataFile
}

async function ensureLocales(): Promise<void> {
  for (const loc of DESIRED_LOCALES) {
    if (loc.isDefault) {
      await db.update(locales).set({ isDefault: false }).where(ne(locales.code, loc.code))
    }
    const values = {
      code: loc.code,
      slug: loc.code,
      name: loc.name,
      nativeName: loc.nativeName,
      isDefault: loc.isDefault,
      enabled: loc.enabled,
      order: loc.order,
    }
    await db
      .insert(locales)
      .values(values)
      .onConflictDoUpdate({ target: locales.code, set: { ...values, updatedAt: new Date() } })
    console.log('Locale upserted:', loc.code, loc.isDefault ? '(default)' : '')
  }
}

async function ensureCoverMedia(
  url: string,
  filename: string,
  alt: string,
): Promise<string> {
  const [existing] = await db.select({ id: media._id }).from(media).where(eq(media.url, url)).limit(1)
  if (existing) return existing.id

  const [row] = await db.insert(media).values({
    url,
    filename,
    key: new URL(url).pathname.slice(1) || filename,
    mimeType: 'image/jpeg',
    size: 0,
    alt,
    tags: ['seed', 'homiio', 'tips'],
    folder: 'seed',
    thumbnails: { sm: '', md: '', lg: '' },
  }).returning({ id: media._id })
  return row.id
}

async function upsertTranslation(
  documentId: string,
  locale: string,
  fields: LocalizedFields,
): Promise<void> {
  const fieldValues = {
        title: fields.title,
        resume: fields.resume,
        description: fields.description,
    content: fields.content,
    imageAlt: fields.imageAlt,
  }
  await db
    .insert(translations)
    .values({ locale, collectionName: 'newsroom', documentId, fields: fieldValues })
    .onConflictDoUpdate({
      target: [translations.locale, translations.collectionName, translations.documentId],
      set: { fields: fieldValues, updatedAt: new Date() },
    })
}

async function main() {
  const data = loadTipsData()
  await ensureLocales()

  let [product] = await db.select().from(products).where(eq(products.productId, 'homiio')).limit(1)
  if (!product) {
    ;[product] = await db.insert(products).values({
      productId: 'homiio',
      name: 'Homiio',
      tagline: 'Rental made easy',
      description:
        'Renting made fair: transparent listings, values-based roommate matching, an Oxy-powered trust score and Sindi, your AI tenant-rights assistant.',
      href: 'https://homiio.com/',
      landingUrl: '/homiio',
      external: false,
      cta: 'Explore Homiio',
      brand: '#e11d48',
      mark: 'H',
      section: 'apps',
      lifecycle: 'live',
      showOnProducts: true,
      showOnStatus: true,
      showInNav: true,
      order: 0,
    }).returning()
    console.log('Created Homiio product')
  } else {
    console.log('Homiio product already exists:', product._id)
  }

  for (const slug of data.deleteSlugs) {
    const [deleted] = await db.delete(newsroomPosts).where(eq(newsroomPosts.slug, slug)).returning({ id: newsroomPosts._id })
    if (deleted) {
      console.log('Deleted obsolete tip:', slug, deleted.id)
    } else {
      console.log('Obsolete tip already absent:', slug)
    }
  }

  for (const tip of data.tips) {
    const coverImage = await ensureCoverMedia(tip.coverUrl, tip.coverFilename, tip.en.imageAlt)
    const payload = {
      title: tip.en.title,
      slug: tip.slug,
      resume: tip.en.resume,
      description: tip.en.description,
      content: tip.en.content,
      coverImage,
      imageAlt: tip.en.imageAlt,
      authorUsername: tip.authorUsername,
      tags: tip.tags,
      categories: ['Tips'],
      products: [product._id],
      featured: tip.featured,
      status: 'published' as const,
      publishedAt: new Date(tip.publishedAt),
    }

    const [post] = await db
      .insert(newsroomPosts)
      .values(payload)
      .onConflictDoUpdate({ target: newsroomPosts.slug, set: { ...payload, updatedAt: new Date() } })
      .returning()

    const documentId = post._id
    for (const locale of TRANSLATION_LOCALES) {
      await upsertTranslation(documentId, locale, tip[locale])
    }

    console.log(
      'Upserted:',
      post.slug,
      '| featured=',
      post.featured,
      '| publishedAt=',
      post.publishedAt.toISOString(),
      '| translations=es,ca',
    )
  }

  const [totals] = await db
    .select({ value: count() })
    .from(newsroomPosts)
    .where(
      and(
        sql`${newsroomPosts.categories} @> ARRAY['Tips']::text[]`,
        sql`${newsroomPosts.products} @> ARRAY[${product._id}]::text[]`,
        eq(newsroomPosts.status, 'published'),
      ),
    )
  console.log('Published Homiio Tips total:', Number(totals?.value ?? 0))

  await closeDatabase()
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
