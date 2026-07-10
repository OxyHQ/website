/**
 * Non-destructive upsert: ensure Homiio product + Newsroom locales exist,
 * publish Homiio Tips with English as the canonical (default-locale) body,
 * and upsert es/ca Translation docs. Safe for production (no collection wipes).
 *
 * Usage: MONGO_URI=... bun server/seedHomiioTips.ts
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { config } from './config.js'
import { Product } from './models/Product.js'
import { NewsroomPost } from './models/NewsroomPost.js'
import { Media } from './models/Media.js'
import { Locale } from './models/Locale.js'
import { Translation } from './models/Translation.js'

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
      await Locale.updateMany({ code: { $ne: loc.code } }, { $set: { isDefault: false } })
    }
    await Locale.findOneAndUpdate(
      { code: loc.code },
      {
        $set: {
          code: loc.code,
          slug: loc.code,
          name: loc.name,
          nativeName: loc.nativeName,
          isDefault: loc.isDefault,
          enabled: loc.enabled,
          order: loc.order,
        },
      },
      { upsert: true, new: true },
    )
    console.log('Locale upserted:', loc.code, loc.isDefault ? '(default)' : '')
  }
}

async function ensureCoverMedia(
  url: string,
  filename: string,
  alt: string,
): Promise<mongoose.Types.ObjectId> {
  const existing = await Media.findOne({ url }).select('_id')
  if (existing) return existing._id

  const doc = await Media.create({
    url,
    filename,
    key: new URL(url).pathname.slice(1) || filename,
    mimeType: 'image/jpeg',
    size: 0,
    alt,
    tags: ['seed', 'homiio', 'tips'],
    folder: 'seed',
    thumbnails: { sm: '', md: '', lg: '' },
  })
  return doc._id
}

async function upsertTranslation(
  documentId: string,
  locale: string,
  fields: LocalizedFields,
): Promise<void> {
  await Translation.findOneAndUpdate(
    { locale, collectionName: 'newsroom', documentId },
    {
      locale,
      collectionName: 'newsroom',
      documentId,
      fields: {
        title: fields.title,
        resume: fields.resume,
        description: fields.description,
        content: fields.content,
        imageAlt: fields.imageAlt,
      },
    },
    { upsert: true, new: true },
  )
}

async function main() {
  const data = loadTipsData()
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

  await ensureLocales()

  let product = await Product.findOne({ productId: 'homiio' })
  if (!product) {
    product = await Product.create({
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
    })
    console.log('Created Homiio product')
  } else {
    console.log('Homiio product already exists:', product._id.toString())
  }

  for (const slug of data.deleteSlugs) {
    const deleted = await NewsroomPost.findOneAndDelete({ slug })
    if (deleted) {
      console.log('Deleted obsolete tip:', slug, deleted._id.toString())
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

    const post = await NewsroomPost.findOneAndUpdate(
      { slug: tip.slug },
      { $set: payload },
      { upsert: true, new: true },
    )

    const documentId = post._id.toString()
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

  const count = await NewsroomPost.countDocuments({
    categories: 'Tips',
    products: product._id,
    status: 'published',
  })
  console.log('Published Homiio Tips total:', count)

  await mongoose.disconnect()
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
