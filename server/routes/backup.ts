import { Router } from 'express'
import type { PgTable } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { db } from '../db/postgres.js'
import {
  changelogEntries,
  footers,
  jobs,
  locales,
  navigationDropdowns,
  newsroomPosts,
  pages,
  pricingPlans,
  siteSettings,
  testimonials,
  trackedRepos,
  translations,
} from '../db/schema/index.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'

const router = Router()

/**
 * The tables a backup snapshots, under the same keys the exported files have
 * always used — an export taken before the Postgres migration still imports.
 */
const collections: Record<string, PgTable> = {
  navigation: navigationDropdowns,
  footer: footers,
  pricingPlans,
  testimonials,
  siteSettings,
  newsroomPosts,
  jobs,
  changelogEntries,
  pages,
  trackedRepos,
  locales,
  translations,
}

const importBodySchema = z.object({
  collections: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
}).passthrough()

router.get('/', requireAuth, adminOnly, async (_req, res) => {
  const data: Record<string, unknown[]> = {}

  for (const [key, table] of Object.entries(collections)) {
    data[key] = await db.select().from(table as never)
  }

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    collections: data,
  }

  const date = new Date().toISOString().split('T')[0]
  res.setHeader('Content-Disposition', `attachment; filename="oxy-backup-${date}.json"`)
  res.setHeader('Content-Type', 'application/json')
  res.json(backup)
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  const { collections: imported } = validate(importBodySchema, req.body)

  const counts: Record<string, number> = {}

  // The whole import is one transaction. Restoring a backup used to replace
  // each collection in turn, so a failure halfway left the site with some
  // tables from the backup and the rest from before it.
  await db.transaction(async (tx) => {
    for (const [key, table] of Object.entries(collections)) {
      // Header navigation and footer are code-owned now. Keep them in exports
      // for audit and recovery, but never let a CMS backup restore overwrite
      // their live rows.
      if (key === 'navigation' || key === 'footer') continue
      const docs = imported[key]
      if (!Array.isArray(docs)) continue

      await tx.delete(table as never)
      if (docs.length > 0) {
        await tx.insert(table as never).values(docs as never)
      }
      counts[key] = docs.length
    }
  })

  res.json({ success: true, imported: counts })
})

export default router
