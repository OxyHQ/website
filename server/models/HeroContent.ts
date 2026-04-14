import mongoose, { Schema, Types, type Document } from 'mongoose'

/**
 * Card sizes used in the hero carousel grid.
 * Mirrors the union in `src/data/heroCarousel.ts`.
 */
export type CardSize = '1x1' | '2x1' | '1x2' | '2x2' | '4x2' | '5x2'

export type HeroCard =
  | { type: 'newsroom'; title: string; image: string; category: string; slug: string }
  | { type: 'careers'; jobTitle: string; department: string; slug?: string }
  | { type: 'brand'; variant: 'oxy' | 'fair' }
  | { type: 'photo'; image: string; alt: string }
  | { type: 'faircoin' }
  | { type: 'values'; heading: string; body: string }
  | { type: 'video'; src: string }

export interface ICarouselSlot {
  size: CardSize
  faces: HeroCard[]
  rotateInterval?: number
  rounded?: boolean
  roundedLeft?: boolean
}

/**
 * Background media fields can store either a Media document reference
 * (preferred — uploaded through the CMS, gets thumbnails/CDN) or a plain
 * URL string for static assets that ship with the bundle. Routes that read
 * the model populate the Media refs and normalize them to URLs on the way
 * out.
 */
export type MediaRef = Types.ObjectId | string | null

export interface IHeroContent extends Document {
  title: string
  eyebrow: string
  backgroundVideoWebm: MediaRef
  backgroundVideoMp4: MediaRef
  backgroundPoster: MediaRef
  carouselSlots: ICarouselSlot[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Mixed-type schema for the carousel slots: mongoose can't validate the
 * discriminated union directly, but the REST/MCP layers run zod against
 * `carouselSlotSchema` from `server/validation/hero.ts` before any write,
 * which gives the same guarantees with a more expressive vocabulary.
 *
 * The `faces` field uses a single Mixed schemaType (not an array of
 * schemaTypes) so mongoose accepts arbitrary HeroCard variants while keeping
 * the surrounding TS type strict.
 */
const CarouselSlotSchema = new Schema<ICarouselSlot>({
  size: { type: String, required: true },
  faces: { type: Schema.Types.Mixed, required: true, default: [] },
  rotateInterval: { type: Number },
  rounded: { type: Boolean },
  roundedLeft: { type: Boolean },
}, { _id: false })

const HeroContentSchema = new Schema<IHeroContent>({
  title: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  backgroundVideoWebm: { type: Schema.Types.Mixed, ref: 'Media', default: null },
  backgroundVideoMp4: { type: Schema.Types.Mixed, ref: 'Media', default: null },
  backgroundPoster: { type: Schema.Types.Mixed, ref: 'Media', default: null },
  carouselSlots: { type: [CarouselSlotSchema], default: [] },
}, { timestamps: true })

export const HeroContent = mongoose.model<IHeroContent>('HeroContent', HeroContentSchema)

/**
 * Defaults that match the original hardcoded hero in `src/pages/HomePage.tsx`
 * and `src/data/heroCarousel.ts`. Used to seed-on-first-read so the site
 * renders identically before an admin has touched the CMS.
 */
export const DEFAULT_HERO_TITLE = 'Creating a future where technology empowers individuals\nto live connected, fulfilling, and sustainable lives.'
export const DEFAULT_HERO_EYEBROW = 'Built by people who believe in change. Ethical, open, and deeply human.'
export const DEFAULT_HERO_BG_WEBM = '/images/landing/hero-background.webm'
export const DEFAULT_HERO_BG_MP4 = '/images/landing/hero-background.mp4'
export const DEFAULT_HERO_POSTER = '/images/landing/hero-bg.avif'

export const DEFAULT_CAROUSEL_SLOTS: ICarouselSlot[] = [
  {
    size: '1x2',
    rotateInterval: 4000,
    faces: [
      { type: 'newsroom', title: 'Introducing Rooms: Live Audio on Mention', image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop', category: 'Product', slug: 'introducing-rooms-live-audio-on-mention' },
      { type: 'newsroom', title: 'Mention 4.0: A New Era of Social Networking', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop', category: 'Product', slug: 'mention-4-0-a-new-era-of-social-networking' },
      { type: 'newsroom', title: 'How AI is Reshaping Community Building', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop', category: 'Research', slug: 'how-ai-is-reshaping-community-building' },
      { type: 'newsroom', title: 'Privacy-First Design: Our Approach to User Data', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=400&fit=crop', category: 'Engineering', slug: 'privacy-first-design-our-approach-to-user-data' },
      { type: 'newsroom', title: 'Building for Billions: Oxy Infrastructure Update', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop', category: 'Engineering', slug: 'building-for-billions-oxy-infrastructure-update' },
    ],
  },
  {
    size: '1x1',
    faces: [
      { type: 'photo', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop', alt: 'Community gathering' },
    ],
  },
  {
    size: '1x1',
    rotateInterval: 3500,
    faces: [
      { type: 'careers', jobTitle: 'Sales Manager', department: 'Careers' },
      { type: 'careers', jobTitle: 'Frontend Engineer', department: 'Careers' },
      { type: 'careers', jobTitle: 'Product Designer', department: 'Careers' },
      { type: 'careers', jobTitle: 'Data Scientist', department: 'Careers' },
      { type: 'careers', jobTitle: 'DevOps Engineer', department: 'Careers' },
      { type: 'careers', jobTitle: 'Marketing Lead', department: 'Careers' },
    ],
  },
  {
    size: '2x2',
    faces: [
      { type: 'video', src: '/images/landing/hero-video.mp4' },
    ],
  },
  {
    size: '1x1',
    rounded: true,
    faces: [{ type: 'brand', variant: 'oxy' }],
  },
  {
    size: '1x1',
    rotateInterval: 4500,
    faces: [
      { type: 'newsroom', title: 'Horizon: Mapping the Future of Sustainability', image: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=400&h=400&fit=crop', category: 'Product', slug: 'horizon-mapping-the-future-of-sustainability' },
      { type: 'newsroom', title: 'Open Source at Oxy: Our 2026 Roadmap', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop', category: 'Engineering', slug: 'open-source-at-oxy-our-2026-roadmap' },
      { type: 'newsroom', title: 'Oxy Ask: AI-Powered Search for Everyone', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop', category: 'Product', slug: 'oxy-ask-ai-powered-search-for-everyone' },
      { type: 'newsroom', title: 'The Ethics of Recommendation Algorithms', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=400&fit=crop', category: 'Research', slug: 'the-ethics-of-recommendation-algorithms' },
    ],
  },
  {
    size: '4x2',
    roundedLeft: true,
    faces: [{ type: 'faircoin' }],
  },
  {
    size: '1x1',
    faces: [
      { type: 'photo', image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=400&fit=crop', alt: 'People collaborating' },
    ],
  },
  {
    size: '2x1',
    rotateInterval: 3500,
    faces: [
      { type: 'values', heading: 'Human-first design', body: 'Tools that empower people, not manipulate them.' },
      { type: 'values', heading: 'Your data stays yours', body: 'No ads, no data brokers, no hidden monetization.' },
      { type: 'values', heading: 'Open by default', body: 'Every Oxy tool is open source. Transparency is not optional.' },
      { type: 'values', heading: 'AI with a purpose', body: 'Every product we ship advances justice, inclusion, or sustainability.' },
      { type: 'values', heading: 'Built for everyone', body: 'Technology should be accessible, inclusive, and equitable.' },
    ],
  },
  {
    size: '1x1',
    rounded: true,
    faces: [
      { type: 'photo', image: '/images/landing/4lffisf9oaY443RqgB8sCKLHJc.avif', alt: 'Team member' },
    ],
  },
  {
    size: '1x1',
    faces: [
      { type: 'photo', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=400&fit=crop', alt: 'Workshop' },
    ],
  },
  {
    size: '2x1',
    rotateInterval: 5000,
    faces: [
      { type: 'newsroom', title: 'Empowering Local Stores with FairCoin', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop', category: 'Company', slug: 'empowering-local-stores-with-faircoin' },
      { type: 'newsroom', title: 'Homiio: Rethinking How We Find Home', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop', category: 'Product', slug: 'homiio-rethinking-how-we-find-home' },
      { type: 'newsroom', title: 'Carbon Neutral by 2027: Our Sustainability Pledge', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop', category: 'Company', slug: 'carbon-neutral-by-2027-our-sustainability-pledge' },
      { type: 'newsroom', title: 'Oxy Partners with UN Digital Cooperation', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop', category: 'Company', slug: 'oxy-partners-with-un-digital-cooperation' },
      { type: 'newsroom', title: 'Introducing Codea: AI-Powered Development', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop', category: 'Product', slug: 'introducing-codea-ai-powered-development' },
    ],
  },
  {
    size: '1x1',
    faces: [
      { type: 'photo', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop', alt: 'Team meeting' },
    ],
  },
  {
    size: '1x1',
    rotateInterval: 4000,
    faces: [
      { type: 'careers', jobTitle: 'Community Manager', department: 'Careers' },
      { type: 'careers', jobTitle: 'Backend Engineer', department: 'Careers' },
    ],
  },
  {
    size: '1x1',
    faces: [
      { type: 'photo', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop', alt: 'Team working' },
    ],
  },
]

/**
 * Load the singleton hero document, creating it with sensible defaults
 * (drawn from the original hardcoded values) on first call. Optionally
 * populates Media references so callers can hand the result straight to
 * the frontend without an extra round-trip.
 */
export async function getOrCreateHero({ populate = true } = {}): Promise<IHeroContent> {
  const query = HeroContent.findOne()
  if (populate) query.populate('backgroundVideoWebm backgroundVideoMp4 backgroundPoster')
  const existing = await query
  if (existing) return existing

  const created = await HeroContent.create({
    title: DEFAULT_HERO_TITLE,
    eyebrow: DEFAULT_HERO_EYEBROW,
    backgroundVideoWebm: DEFAULT_HERO_BG_WEBM,
    backgroundVideoMp4: DEFAULT_HERO_BG_MP4,
    backgroundPoster: DEFAULT_HERO_POSTER,
    carouselSlots: DEFAULT_CAROUSEL_SLOTS,
  })
  if (!populate) return created
  const populated = await HeroContent.findById(created._id).populate('backgroundVideoWebm backgroundVideoMp4 backgroundPoster')
  return populated ?? created
}
