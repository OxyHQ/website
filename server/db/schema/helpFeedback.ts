import { boolean, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { objectId, timestamps } from './columns.js'

// Per-article random token: no account, IP address or cross-article identifier.
// Slugs cover both static MDX articles and CMS documents, so there is no CMS FK.
export const helpFeedback = pgTable('help_feedback', {
  _id: objectId(),
  slug: text().notNull(),
  locale: text().notNull(),
  token: text().notNull(),
  helpful: boolean().notNull(),
  ...timestamps,
}, table => [uniqueIndex('help_feedback_article_token_idx').on(table.slug, table.locale, table.token)])
