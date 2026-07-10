/**
 * Non-destructive upsert: ensure Homiio product exists and publish the
 * Homiio Tips newsroom post. Safe for production (no collection wipes).
 *
 * Usage: MONGO_URI=... bun server/seedHomiioTips.ts
 */
import mongoose from 'mongoose'
import { config } from './config.js'
import { Product } from './models/Product.js'
import { NewsroomPost } from './models/NewsroomPost.js'
import { Media } from './models/Media.js'

const SLUG = 'how-to-read-a-rental-listing-like-a-pro'
const COVER_URL = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=630&fit=crop'

async function ensureCoverMedia(): Promise<mongoose.Types.ObjectId> {
  const existing = await Media.findOne({ url: COVER_URL }).select('_id')
  if (existing) return existing._id

  const doc = await Media.create({
    url: COVER_URL,
    filename: 'homiio-rental-tips-cover.jpg',
    key: new URL(COVER_URL).pathname.slice(1) || 'homiio-rental-tips-cover.jpg',
    mimeType: 'image/jpeg',
    size: 0,
    alt: 'Bright modern apartment living room',
    tags: ['seed', 'homiio', 'tips'],
    folder: 'seed',
    thumbnails: { sm: '', md: '', lg: '' },
  })
  return doc._id
}

async function main() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

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

  const coverImage = await ensureCoverMedia()

  const payload = {
    title: 'How to Read a Rental Listing Like a Pro',
    slug: SLUG,
    resume: 'Spot red flags, decode fees, and compare listings so you rent with confidence on Homiio.',
    description: 'A practical Homiio tip on evaluating rental listings before you apply or book a viewing.',
    content:
      '## Start with the essentials\n\nBefore you fall for the photos, check **rent**, **deposit**, **availability**, and **what is included**. A listing that hides fees until the last step is a warning sign.\n\n## Decode the fine print\n\n- Utilities: which ones are included?\n- Lease length and renewal terms\n- Pet policy and any extra deposits\n- Who pays for repairs and maintenance\n\n## Use Homiio signals\n\nOn Homiio, prefer listings with clear source info, verified details, and transparent apply/viewing paths. If something feels off, ask Sindi or skip the listing.\n\n## Next steps\n\nSave favorites, compare a shortlist, then book a viewing only when the numbers and terms make sense.',
    coverImage,
    imageAlt: 'Bright modern apartment living room',
    tags: ['renting', 'listings', 'beginners'],
    categories: ['Tips'],
    products: [product._id],
    featured: true,
    status: 'published' as const,
    publishedAt: new Date('2026-07-01'),
  }

  const post = await NewsroomPost.findOneAndUpdate(
    { slug: SLUG },
    { $set: payload },
    { upsert: true, new: true },
  )

  console.log('Upserted Tips post:', post.slug, post._id.toString(), 'status=', post.status)
  await mongoose.disconnect()
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
