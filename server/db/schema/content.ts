import { boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { objectId, timestamps } from './columns.js'

/* ──────────────────────────────────────────────
 * The editorial tables: what the CMS writes and the site reads.
 *
 * Sub-documents (a page's sections, a job's description blocks, a hero's
 * carousel slots) are `jsonb`. They are read and written as a unit by
 * both the admin and the site, never queried field by field, so splitting them
 * into child tables would buy joins nobody asked for.
 * ──────────────────────────────────────────── */

export const categories = pgTable('categories', {
  _id: objectId(),
  slug: text().notNull().unique(),
  label: text().notNull(),
  description: text().notNull().default(''),
  /** 'apps' | 'nav' | 'generic' */
  scope: text().notNull().default('generic'),
  order: integer().notNull().default(0),
  ...timestamps,
})

export const media = pgTable('media', {
  _id: objectId(),
  url: text().notNull(),
  /** `{ sm, md, lg }` — always present, empty strings when a size is missing. */
  thumbnails: jsonb().$type<{ sm: string; md: string; lg: string }>().notNull().default({ sm: '', md: '', lg: '' }),
  filename: text().notNull(),
  key: text().notNull(),
  mimeType: text().notNull(),
  size: integer().notNull().default(0),
  width: integer(),
  height: integer(),
  alt: text().notNull().default(''),
  tags: text().array().notNull().default([]),
  folder: text().notNull().default('images'),
  uploadedBy: text().notNull().default(''),
  ...timestamps,
})

export const products = pgTable(
  'products',
  {
    _id: objectId(),
    productId: text().notNull().unique(),
    name: text().notNull(),
    tagline: text().notNull().default(''),
    description: text().notNull().default(''),
    href: text().notNull(),
    landingUrl: text(),
    healthUrl: text(),
    external: boolean().notNull().default(false),
    cta: text().notNull().default('Learn more'),
    brand: text().notNull(),
    brandForeground: text(),
    mark: text().notNull(),
    logo: text().references(() => media._id, { onDelete: 'set null' }),
    category: text().references(() => categories._id, { onDelete: 'set null' }),
    section: text().notNull().default('apps'),
    /** 'live' | 'in-development' */
    lifecycle: text().notNull().default('live'),
    showOnProducts: boolean().notNull().default(true),
    showOnStatus: boolean().notNull().default(true),
    showInNav: boolean().notNull().default(true),
    navOpensApp: boolean().notNull().default(false),
    order: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index('products_lifecycle_section_order_idx').on(table.lifecycle, table.section, table.order),
    index('products_show_on_status_idx').on(table.showOnStatus),
    index('products_show_in_nav_idx').on(table.showInNav),
  ],
)

export const pages = pgTable('pages', {
  _id: objectId(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  description: text().notNull().default(''),
  /** `{ type, heading?, subheading?, content?, items?, order }[]` */
  sections: jsonb().$type<Record<string, unknown>[]>().notNull().default([]),
  promptPhrases: text().array().notNull().default([]),
  ...timestamps,
})

export const newsroomPosts = pgTable(
  'newsroom_posts',
  {
    _id: objectId(),
    title: text().notNull(),
    slug: text().notNull().unique(),
    resume: text().notNull().default(''),
    description: text().notNull().default(''),
    content: text().notNull().default(''),
    // Nullable, like every other cover on this file: five of the 47 posts
    // imported from the old Framer site hold an absolute framerusercontent URL
    // here rather than a media id, and the site has always served those as
    // `null`. A `not null` column would reject data that has been live for
    // years.
    coverImage: text().references(() => media._id, { onDelete: 'set null' }),
    imageAlt: text(),
    oxyUserId: text(),
    authorUsername: text(),
    tags: text().array().notNull().default([]),
    categories: text().array().notNull().default([]),
    /** Product `_id`s. A plain array: the join table would only ever be read whole. */
    products: text().array().notNull().default([]),
    featured: boolean().notNull().default(false),
    colorPrimary: text(),
    colorSecondary: text(),
    /** Bloom recipe used by the newsroom article and its cards. */
    themePreset: text().notNull().default('oxy'),
    dark: boolean().notNull().default(false),
    /** 'draft' | 'published' */
    status: text().notNull().default('published'),
    metaTitle: text(),
    ogImage: text().references(() => media._id, { onDelete: 'set null' }),
    publishedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [index('newsroom_posts_status_idx').on(table.status)],
)

export const jobs = pgTable('jobs', {
  _id: objectId(),
  title: text().notNull(),
  slug: text().notNull().unique(),
  subtitle: text().notNull().default(''),
  department: text().notNull(),
  location: text().notNull().default('Remote'),
  type: text().notNull().default('Full-time'),
  compensation: text().notNull().default(''),
  /** `{ type: 'paragraph'|'heading'|'list', text?, items? }[]` */
  description: jsonb().$type<Record<string, unknown>[]>().notNull().default([]),
  active: boolean().notNull().default(true),
  order: integer().notNull().default(0),
  ...timestamps,
})

export const courses = pgTable(
  'courses',
  {
    _id: objectId(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text().notNull().default(''),
    description: text().notNull().default(''),
    coverImage: text().references(() => media._id, { onDelete: 'set null' }),
    category: text().references(() => categories._id, { onDelete: 'set null' }),
    /** 'beginner' | 'intermediate' | 'advanced' */
    level: text().notNull().default('beginner'),
    durationMinutes: integer(),
    /** `{ title, slug, content, order, videoUrl?, durationMinutes? }[]` */
    lessons: jsonb().$type<Record<string, unknown>[]>().notNull().default([]),
    tags: text().array().notNull().default([]),
    featured: boolean().notNull().default(false),
    /** 'draft' | 'published' */
    status: text().notNull().default('published'),
    publishedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    order: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index('courses_level_idx').on(table.level),
    index('courses_status_idx').on(table.status),
    index('courses_featured_idx').on(table.featured),
  ],
)

export const helpArticles = pgTable(
  'help_articles',
  {
    _id: objectId(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text().notNull().default(''),
    content: text().notNull().default(''),
    category: text().references(() => categories._id, { onDelete: 'set null' }),
    icon: text().notNull().default(''),
    coverImage: text().references(() => media._id, { onDelete: 'set null' }),
    tags: text().array().notNull().default([]),
    featured: boolean().notNull().default(false),
    /** 'draft' | 'published' */
    status: text().notNull().default('published'),
    publishedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    order: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index('help_articles_status_idx').on(table.status),
    index('help_articles_featured_idx').on(table.featured),
    index('help_articles_order_idx').on(table.order),
  ],
)

export const resources = pgTable(
  'resources',
  {
    _id: objectId(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text().notNull().default(''),
    /** 'guide' | 'paper' | 'video' | 'tool' | 'template' | 'link' */
    type: text().notNull().default('guide'),
    coverImage: text().references(() => media._id, { onDelete: 'set null' }),
    category: text().references(() => categories._id, { onDelete: 'set null' }),
    href: text().notNull(),
    external: boolean().notNull().default(false),
    tags: text().array().notNull().default([]),
    featured: boolean().notNull().default(false),
    /** 'draft' | 'published' */
    status: text().notNull().default('published'),
    publishedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    order: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index('resources_type_idx').on(table.type),
    index('resources_status_idx').on(table.status),
    index('resources_featured_idx').on(table.featured),
  ],
)

export const changelogEntries = pgTable('changelog_entries', {
  _id: objectId(),
  title: text().notNull(),
  content: text().notNull().default(''),
  tags: text().array().notNull().default([]),
  date: timestamp({ withTimezone: true }).notNull(),
  items: text().array().notNull().default([]),
  media: text().references(() => media._id, { onDelete: 'set null' }),
  /** Unique when present: the release this entry was synced from. */
  githubReleaseId: doublePrecision().unique(),
  repoOwner: text(),
  repoName: text(),
  repoDisplayName: text(),
  htmlUrl: text(),
  tagName: text(),
  ...timestamps,
})

export const teamMembers = pgTable('team_members', {
  _id: objectId(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  role: text().notNull(),
  department: text().notNull().default(''),
  bio: text().notNull().default(''),
  avatar: text().references(() => media._id, { onDelete: 'set null' }),
  order: integer().notNull().default(0),
  active: boolean().notNull().default(true),
  /** `{ linkedin, twitter, github, website }` */
  socials: jsonb()
    .$type<{ linkedin: string; twitter: string; github: string; website: string }>()
    .notNull()
    .default({ linkedin: '', twitter: '', github: '', website: '' }),
  ...timestamps,
})

export const testimonials = pgTable('testimonials', {
  _id: objectId(),
  quote: text().notNull(),
  author: text().notNull(),
  role: text().notNull().default(''),
  company: text().notNull().default(''),
  avatar: text(),
  order: integer().notNull().default(0),
  ...timestamps,
})

export const pricingPlans = pgTable('pricing_plans', {
  _id: objectId(),
  name: text().notNull(),
  /** `{ monthly, annual }` */
  price: jsonb().$type<{ monthly: number; annual: number }>().notNull(),
  description: text().notNull().default(''),
  features: text().array().notNull().default([]),
  cta: text().notNull().default('Get started'),
  /**
   * Where the plan's button goes. It went undeclared for a long time, so the
   * table rendered a button with an undefined href; the seed has always sent a
   * value.
   */
  ctaHref: text().notNull().default(''),
  highlighted: boolean().notNull().default(false),
  order: integer().notNull().default(0),
  ...timestamps,
})

export const seoEntries = pgTable(
  'seo_entries',
  {
    _id: objectId(),
    /** 'oxy' | 'faircoin' */
    brand: text().notNull(),
    path: text().notNull(),
    title: text().notNull().default(''),
    description: text().notNull().default(''),
    ogImage: text().notNull().default(''),
    ...timestamps,
  },
  (table) => [uniqueIndex('seo_entries_brand_path_idx').on(table.brand, table.path)],
)

export const translations = pgTable(
  'translations',
  {
    _id: objectId(),
    locale: text().notNull(),
    collectionName: text().notNull(),
    documentId: text().notNull(),
    /** The translated fields, shape decided by the collection. */
    fields: jsonb().$type<Record<string, unknown>>().notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('translations_locale_collection_doc_idx').on(table.locale, table.collectionName, table.documentId)],
)

export const locales = pgTable('locales', {
  _id: objectId(),
  code: text().notNull().unique(),
  slug: text().unique(),
  name: text().notNull(),
  nativeName: text().notNull(),
  isDefault: boolean().notNull().default(false),
  enabled: boolean().notNull().default(true),
  order: integer().notNull().default(0),
  ...timestamps,
})
