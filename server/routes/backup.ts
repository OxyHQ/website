import { Router } from 'express'
import type { Model } from 'mongoose'
import { z } from 'zod'
import { Navigation } from '../models/Navigation.js'
import { Footer } from '../models/Footer.js'
import { PricingPlan } from '../models/PricingPlan.js'
import { Testimonial } from '../models/Testimonial.js'
import { SiteSettings } from '../models/SiteSettings.js'
import { NewsroomPost } from '../models/NewsroomPost.js'
import { Job } from '../models/Job.js'
import { ChangelogEntry } from '../models/ChangelogEntry.js'
import { Page } from '../models/Page.js'
import TrackedRepo from '../models/TrackedRepo.js'
import { Locale } from '../models/Locale.js'
import { Translation } from '../models/Translation.js'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { validate } from '../utils/validate.js'

const router = Router()

// Heterogeneous collection of mongoose models we snapshot during backup.
// Typed as Record<string, Model<unknown>> so TypeScript accepts calling
// .find() / .deleteMany() / .insertMany() on an iterator value without
// widening to an unresolvable union of the individual model types.
const collections: Record<string, Model<unknown>> = {
  navigation: Navigation as unknown as Model<unknown>,
  footer: Footer as unknown as Model<unknown>,
  pricingPlans: PricingPlan as unknown as Model<unknown>,
  testimonials: Testimonial as unknown as Model<unknown>,
  siteSettings: SiteSettings as unknown as Model<unknown>,
  newsroomPosts: NewsroomPost as unknown as Model<unknown>,
  jobs: Job as unknown as Model<unknown>,
  changelogEntries: ChangelogEntry as unknown as Model<unknown>,
  pages: Page as unknown as Model<unknown>,
  trackedRepos: TrackedRepo as unknown as Model<unknown>,
  locales: Locale as unknown as Model<unknown>,
  translations: Translation as unknown as Model<unknown>,
}

const importBodySchema = z.object({
  collections: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
}).passthrough()

router.get('/', requireAuth, adminOnly, async (_req, res) => {
  const data: Record<string, unknown[]> = {}

  for (const [key, ModelCls] of Object.entries(collections)) {
    data[key] = await ModelCls.find().lean()
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

  for (const [key, ModelCls] of Object.entries(collections)) {
    const docs = imported[key]
    if (!Array.isArray(docs)) continue

    await ModelCls.deleteMany({})
    if (docs.length > 0) {
      await ModelCls.insertMany(docs)
    }
    counts[key] = docs.length
  }

  res.json({ success: true, imported: counts })
})

export default router
