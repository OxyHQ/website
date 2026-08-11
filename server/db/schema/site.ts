import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { objectId, timestamps } from './columns.js'
import { media } from './content.js'

/* ──────────────────────────────────────────────
 * Site chrome, community records and operational tables.
 * ──────────────────────────────────────────── */

export const siteSettings = pgTable('site_settings', {
  _id: objectId(),
  siteTitle: text().notNull().default('Oxy'),
  siteDescription: text().notNull().default(''),
  ogImage: text().references(() => media._id, { onDelete: 'set null' }),
  /** `{ text, href, visible }` */
  banner: jsonb().$type<{ text: string; href: string; visible: boolean } | null>(),
  ...timestamps,
})

export const navigationDropdowns = pgTable('navigation_dropdowns', {
  _id: objectId(),
  label: text().notNull(),
  /** 'manual' | 'apps' */
  kind: text().notNull().default('manual'),
  /** `{ title, description, href, icon?, image?, section?, showGrid }[]` */
  items: jsonb().$type<Record<string, unknown>[]>().notNull().default([]),
  /** `{ heading?, links: { label, href }[] }` */
  sidePanel: jsonb().$type<Record<string, unknown> | null>(),
  order: integer().notNull().default(0),
  ...timestamps,
})

export const footers = pgTable('footers', {
  _id: objectId(),
  /** `{ title, links: { label, href, isNewBadge?, isExternal? }[] }[]` */
  columns: jsonb().$type<Record<string, unknown>[]>().notNull().default([]),
  /** `{ label, icon, href }[]` */
  socialLinks: jsonb().$type<Record<string, unknown>[]>().notNull().default([]),
  copyright: text().notNull().default(''),
  ...timestamps,
})

export const heroContents = pgTable('hero_contents', {
  _id: objectId(),
  title: text().notNull().default(''),
  /** Media refs, kept loose: legacy rows store a URL string rather than an id. */
  backgroundVideoWebm: jsonb().$type<unknown>(),
  backgroundVideoMp4: jsonb().$type<unknown>(),
  backgroundPoster: jsonb().$type<unknown>(),
  /** `{ size, faces, rotateInterval?, rounded?, roundedLeft? }[]` */
  carouselSlots: jsonb().$type<Record<string, unknown>[]>().notNull().default([]),
  ...timestamps,
})

export const trackedRepos = pgTable(
  'tracked_repos',
  {
    _id: objectId(),
    owner: text().notNull(),
    repo: text().notNull(),
    displayName: text().notNull(),
    /** `{ label, color }[]` */
    defaultTags: jsonb().$type<Record<string, unknown>[]>().notNull().default([]),
    lastSyncAt: timestamp({ withTimezone: true }),
    lastSyncError: text(),
    active: boolean().notNull().default(true),
    // Both default to false so a repo added for changelog sync never joins the
    // public board, or starts accepting public issues, by accident.
    featureBoard: boolean().notNull().default(false),
    acceptsProposals: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex('tracked_repos_owner_repo_idx').on(table.owner, table.repo)],
)

export const comments = pgTable('comments', {
  _id: objectId(),
  /** 'newsroom' | 'changelog' | 'feature_request' */
  targetType: text().notNull(),
  targetId: text().notNull(),
  parentId: text(),
  userId: text().notNull(),
  username: text().notNull(),
  body: text().notNull(),
  /** 'visible' | 'hidden' | 'deleted' */
  status: text().notNull().default('visible'),
  editedAt: timestamp({ withTimezone: true }),
  ...timestamps,
})

export const likes = pgTable(
  'likes',
  {
    _id: objectId(),
    /** 'newsroom' | 'changelog' */
    targetType: text().notNull(),
    targetId: text().notNull(),
    userId: text().notNull(),
    username: text().notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [uniqueIndex('likes_target_user_idx').on(table.targetType, table.targetId, table.userId)],
)

export const votes = pgTable(
  'votes',
  {
    _id: objectId(),
    featureRequestId: text().notNull(),
    userId: text().notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [uniqueIndex('votes_feature_user_idx').on(table.featureRequestId, table.userId)],
)

export const featureProposals = pgTable('feature_proposals', {
  _id: objectId(),
  userId: text().notNull(),
  username: text().notNull(),
  owner: text().notNull(),
  repo: text().notNull(),
  issueNumber: integer().notNull(),
  issueUrl: text().notNull(),
  title: text().notNull(),
  createdAt: timestamps.createdAt,
})

export const userBadges = pgTable(
  'user_badges',
  {
    _id: objectId(),
    userId: text().notNull(),
    username: text().notNull(),
    badgeId: text().notNull(),
    awardedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    awardedBy: text(),
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [uniqueIndex('user_badges_user_badge_idx').on(table.userId, table.badgeId)],
)

export const userProfileExtras = pgTable('user_profile_extras', {
  _id: objectId(),
  userId: text().notNull().unique(),
  username: text().notNull().unique(),
  bio: text().notNull().default(''),
  showActivity: boolean().notNull().default(true),
  updatedAt: timestamps.updatedAt,
})

export const referrals = pgTable('referrals', {
  _id: objectId(),
  code: text().notNull().unique(),
  name: text().notNull(),
  email: text(),
  /** 'paid' | 'ambassador' | 'user' */
  type: text().notNull().default('user'),
  /** 'active' | 'paused' | 'revoked' */
  status: text().notNull().default('active'),
  oxyUserId: text(),
  commissionPercent: integer(),
  customLandingUrl: text(),
  notes: text(),
  clicks: integer().notNull().default(0),
  signups: integer().notNull().default(0),
  ...timestamps,
})

export const mcpTokens = pgTable('mcp_tokens', {
  _id: objectId(),
  name: text().notNull(),
  tokenHash: text().notNull().unique(),
  createdBy: text().notNull(),
  lastUsedAt: timestamp({ withTimezone: true }),
  expiresAt: timestamp({ withTimezone: true }),
  revoked: boolean().notNull().default(false),
  ...timestamps,
})
