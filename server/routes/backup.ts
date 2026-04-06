import { Router } from 'express'
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

const router = Router()

const collections = {
  navigation: Navigation,
  footer: Footer,
  pricingPlans: PricingPlan,
  testimonials: Testimonial,
  siteSettings: SiteSettings,
  newsroomPosts: NewsroomPost,
  jobs: Job,
  changelogEntries: ChangelogEntry,
  pages: Page,
  trackedRepos: TrackedRepo,
  locales: Locale,
  translations: Translation,
} as const

router.get('/', requireAuth, adminOnly, async (_req, res) => {
  const data: Record<string, unknown[]> = {}

  for (const [key, Model] of Object.entries(collections)) {
    data[key] = await Model.find().lean()
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
  const { collections: imported } = req.body

  if (!imported || typeof imported !== 'object') {
    return res.status(400).json({ error: 'Invalid backup format: missing collections object' })
  }

  const counts: Record<string, number> = {}

  for (const [key, Model] of Object.entries(collections)) {
    const docs = imported[key]
    if (!Array.isArray(docs)) continue

    await Model.deleteMany({})
    if (docs.length > 0) {
      await Model.insertMany(docs)
    }
    counts[key] = docs.length
  }

  res.json({ success: true, imported: counts })
})

export default router
