import { sql } from 'drizzle-orm'
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { objectId, timestamps } from './columns.js'
import { media, products } from './content.js'

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
  /** `{ title, description, href, icon?, image?, section? }[]` */
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

export const incidents = pgTable(
  'incidents',
  {
    _id: objectId(),
    title: text().notNull(),
    /** 'minor' | 'major' | 'critical' */
    severity: text().notNull().default('minor'),
    // Denormalized copy of updates[updates.length - 1].status, so list/filter
    // reads (including the public banner's open-incident check) never need to
    // read jsonb just to know where an incident currently stands.
    /** 'investigating' | 'identified' | 'monitoring' | 'resolved' */
    status: text().notNull().default('investigating'),
    /** Affected product `_id`s. A plain array: [] means site-wide, and the join
     * table would only ever be read whole — same shape as newsroomPosts.products. */
    products: text().array().notNull().default([]),
    startedAt: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
    resolvedAt: timestamp({ withTimezone: true }),
    /** Chronological (oldest-first) append log. Each element:
     * `{ _id, status: 'investigating'|'identified'|'monitoring'|'resolved', body, createdAt }` */
    updates: jsonb().$type<Record<string, unknown>[]>().notNull().default([]),
    ...timestamps,
  },
  (table) => [
    index('incidents_started_at_id_idx').on(table.startedAt.desc(), table._id.asc()),
    index('incidents_status_idx').on(table.status),
  ],
)

export const serviceUptimeDaily = pgTable(
  'service_uptime_daily',
  {
    _id: objectId(),
    product: text()
      .notNull()
      .references(() => products._id, { onDelete: 'cascade' }),
    // 'YYYY-MM-DD', UTC day key. Plain text, not pg's `date` type: the key is
    // always computed in JS (UTC) before writing, so there is no
    // timezone-conversion benefit to a native date column here.
    date: text().notNull(),
    totalChecks: integer().notNull().default(0),
    operationalChecks: integer().notNull().default(0),
    degradedChecks: integer().notNull().default(0),
    downChecks: integer().notNull().default(0),
    unknownChecks: integer().notNull().default(0),
    avgLatencyMs: integer(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('service_uptime_daily_product_date_idx').on(table.product, table.date),
    index('service_uptime_daily_date_idx').on(table.date),
  ],
)

/**
 * Sales and private-evaluation requests submitted from `/contact/sales`.
 *
 * Deliberately a small, flat record: this repository is a marketing site, not a
 * CRM, and every field beyond "enough to reply, route and qualify" is a field
 * somebody has to keep accurate and delete on request.
 *
 * Three things are absent on purpose.
 *
 *  - **No IP address**, raw, hashed or turned into a location. The rest of the
 *    Oxy stack holds to that invariant and a lead form is not the place to
 *    break it; the abuse controls in `server/routes/sales.ts` are in-memory and
 *    per-instance instead.
 *  - **No secrets.** The form never asks for an API key, a credential, a
 *    provider key or a prompt, and there is no column one could be typed into.
 *  - **No account ownership taken on trust.** `accountId`/`applicationId` are
 *    written only after the server has verified the submitter can see them.
 */
export const salesInquiries = pgTable(
  'sales_inquiries',
  {
    _id: objectId(),
    /** One of `INQUIRY_INTERESTS` in `server/contracts/salesInquiry.ts`. */
    interest: text().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    company: text().notNull(),
    role: text(),
    country: text(),
    companySize: text(),
    website: text(),
    useCase: text().notNull(),
    monthlyVolume: text(),
    budget: text(),
    /** Modality keys the submitter ticked. */
    modalities: jsonb().$type<string[]>().notNull().default([]),
    preferredRegion: text(),
    privacyRequirements: jsonb().$type<string[]>().notNull().default([]),
    deploymentPreference: text(),
    launchTimeline: text(),
    message: text(),
    marketingConsent: boolean().notNull().default(false),
    /** Verified server-side before it is written. Never trusted from the client. */
    oxyUserId: text(),
    accountId: text(),
    applicationId: text(),
    /** One of `INQUIRY_STATUSES`. */
    status: text().notNull().default('new'),
    /** Who last changed the status, for the audit line in the admin view. */
    statusChangedBy: text(),
    statusChangedAt: timestamp({ withTimezone: true }),
    internalNote: text(),
    /**
     * Content-derived key that collapses a double click, a retry after a flaky
     * connection and a refresh-and-resubmit into one inquiry. Unique, so the
     * collapse is enforced by the database rather than by a read-then-write
     * race in the handler.
     */
    idempotencyKey: text().notNull().unique(),
    /** When the row becomes deletable absent a contract. */
    deleteAfter: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('sales_inquiries_idempotency_idx').on(table.idempotencyKey)],
)
