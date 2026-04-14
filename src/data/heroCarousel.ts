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
  // Newsroom — 5 posts
  {
    size: '1x2',
    rotateInterval: 4000,
    faces: [
      {
        type: 'newsroom',
        title: 'Introducing Rooms: Live Audio on Mention',
        image: '/images/hero/hero-1.webp',
        category: 'Product',
        slug: 'introducing-rooms-live-audio-on-mention',
      },
      {
        type: 'newsroom',
        title: 'Mention 4.0: A New Era of Social Networking',
        image: '/images/hero/hero-2.jpg',
        category: 'Product',
        slug: 'mention-4-0-a-new-era-of-social-networking',
      },
      {
        type: 'newsroom',
        title: 'How AI is Reshaping Community Building',
        image: '/images/hero/hero-3.webp',
        category: 'Research',
        slug: 'how-ai-is-reshaping-community-building',
      },
      {
        type: 'newsroom',
        title: 'Privacy-First Design: Our Approach to User Data',
        image: '/images/hero/hero-4.webp',
        category: 'Engineering',
        slug: 'privacy-first-design-our-approach-to-user-data',
      },
      {
        type: 'newsroom',
        title: 'Building for Billions: Oxy Infrastructure Update',
        image: '/images/hero/hero-5.jpg',
        category: 'Engineering',
        slug: 'building-for-billions-oxy-infrastructure-update',
      },
    ],
  },
  // Community photo — static
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
  // Careers — 6 positions
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
  // Large video
  {
    size: '2x2',
    faces: [
      {
        type: 'video',
        src: '/images/landing/hero-video.mp4',
      },
    ],
  },
  // Oxy brand — static
  {
    size: '1x1',
    rounded: true,
    faces: [{ type: 'brand', variant: 'oxy' }],
  },
  // Newsroom — 4 posts
  {
    size: '1x1',
    rotateInterval: 4500,
    faces: [
      {
        type: 'newsroom',
        title: 'Horizon: Mapping the Future of Sustainability',
        image: '/images/hero/hero-1.webp',
        category: 'Product',
        slug: 'horizon-mapping-the-future-of-sustainability',
      },
      {
        type: 'newsroom',
        title: 'Open Source at Oxy: Our 2026 Roadmap',
        image: '/images/hero/hero-2.jpg',
        category: 'Engineering',
        slug: 'open-source-at-oxy-our-2026-roadmap',
      },
      {
        type: 'newsroom',
        title: 'Oxy Ask: AI-Powered Search for Everyone',
        image: '/images/hero/hero-3.webp',
        category: 'Product',
        slug: 'oxy-ask-ai-powered-search-for-everyone',
      },
      {
        type: 'newsroom',
        title: 'The Ethics of Recommendation Algorithms',
        image: '/images/hero/hero-4.webp',
        category: 'Research',
        slug: 'the-ethics-of-recommendation-algorithms',
      },
    ],
  },
  // FairCoin dashboard — static large
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
  // Values — 5 values
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
  // Fill below values (2x1 leaves 2 cells in row 2)
  {
    size: '1x1',
    rounded: true,
    faces: [
      {
        type: 'photo',
        image: '/images/landing/4lffisf9oaY443RqgB8sCKLHJc.avif',
        alt: 'Team member',
      },
    ],
  },
  {
    size: '1x1',
    faces: [
      {
        type: 'photo',
        image: '/images/hero/hero-6.avif',
        alt: 'Workshop',
      },
    ],
  },
  // Newsroom
  {
    size: '2x1',
    rotateInterval: 5000,
    faces: [
      {
        type: 'newsroom',
        title: 'Empowering Local Stores with FairCoin',
        image: '/images/hero/hero-1.webp',
        category: 'Company',
        slug: 'empowering-local-stores-with-faircoin',
      },
      {
        type: 'newsroom',
        title: 'Homiio: Rethinking How We Find Home',
        image: '/images/hero/hero-2.jpg',
        category: 'Product',
        slug: 'homiio-rethinking-how-we-find-home',
      },
      {
        type: 'newsroom',
        title: 'Carbon Neutral by 2027: Our Sustainability Pledge',
        image: '/images/hero/hero-3.webp',
        category: 'Company',
        slug: 'carbon-neutral-by-2027-our-sustainability-pledge',
      },
      {
        type: 'newsroom',
        title: 'Oxy Partners with UN Digital Cooperation',
        image: '/images/hero/hero-4.webp',
        category: 'Company',
        slug: 'oxy-partners-with-un-digital-cooperation',
      },
      {
        type: 'newsroom',
        title: 'Introducing Codea: AI-Powered Development',
        image: '/images/hero/hero-5.jpg',
        category: 'Product',
        slug: 'introducing-codea-ai-powered-development',
      },
    ],
  },
  // Fill below newsroom (2x1 leaves 2 cells in row 2)
  {
    size: '1x1',
    faces: [
      {
        type: 'photo',
        image: '/images/hero/hero-6.avif',
        alt: 'Team meeting',
      },
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
  // Extra slot to fill the grid evenly (2 rows must be fully occupied)
  {
    size: '1x1',
    faces: [
      {
        type: 'photo',
        image: '/images/hero/hero-1.webp',
        alt: 'Team working',
      },
    ],
  },
]
