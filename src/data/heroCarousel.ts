/**
 * Hero carousel — types + static fallback content.
 *
 * The live homepage hero pulls slot data from the CMS first; this static
 * list is only used when the CMS document hasn't been populated yet.
 *
 * The fabricated "newsroom" headlines and job postings that used to live
 * here (including a fake "Oxy Partners with UN Digital Cooperation"
 * announcement) have been removed. What remains is brand/photo/values
 * scaffolding only — the rotating newsroom and careers faces are
 * intentionally absent until they can be sourced from CMS data
 * (`useNewsroomPosts()` / `useJobs()`).
 */

export type CardSize = '1x1' | '2x1' | '1x2' | '2x2' | '4x2' | '5x2'

export type HeroCard =
  | {
      type: 'newsroom'
      title: string
      image: string
      category: string
      slug: string
    }
  | {
      type: 'careers'
      jobTitle: string
      department: string
      slug?: string
    }
  | {
      type: 'brand'
      variant: 'oxy' | 'fair'
    }
  | {
      type: 'photo'
      image: string
      alt: string
    }
  | {
      type: 'faircoin'
    }
  | {
      type: 'values'
      heading: string
      body: string
    }
  | {
      type: 'video'
      src: string
    }

/** A slot in the carousel grid. Has a size and one or more card faces that rotate. */
export interface CarouselSlot {
  size: CardSize
  faces: HeroCard[]
  /** Rotation interval in ms (only matters if faces.length > 1) */
  rotateInterval?: number
  /** If true, renders the card as a full pill/circle */
  rounded?: boolean
  /** If true, only the left side is fully rounded */
  roundedLeft?: boolean
}

export const heroCarouselSlots: CarouselSlot[] = [
  // Brand pill
  {
    size: '1x1',
    rounded: true,
    faces: [{ type: 'brand', variant: 'oxy' }],
  },
  // Community photo
  {
    size: '1x1',
    faces: [
      {
        type: 'photo',
        image: '/images/hero/hero-6.avif',
        alt: 'Community gathering',
      },
    ],
  },
  // Large hero video
  {
    size: '2x2',
    faces: [
      {
        type: 'video',
        src: '/images/landing/hero-video.mp4',
      },
    ],
  },
  // FairCoin dashboard
  {
    size: '4x2',
    roundedLeft: true,
    faces: [{ type: 'faircoin' }],
  },
  // Photo
  {
    size: '1x1',
    faces: [
      {
        type: 'photo',
        image: '/images/hero/hero-5.jpg',
        alt: 'People collaborating',
      },
    ],
  },
  // Values — rotating
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
  // Photo
  {
    size: '1x1',
    faces: [
      {
        type: 'photo',
        image: '/images/hero/hero-1.webp',
        alt: 'Workshop',
      },
    ],
  },
  // Photo
  {
    size: '1x1',
    faces: [
      {
        type: 'photo',
        image: '/images/hero/hero-2.jpg',
        alt: 'Team meeting',
      },
    ],
  },
]
