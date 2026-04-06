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
        image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop',
        category: 'Product',
        slug: 'introducing-rooms-live-audio-on-mention',
      },
      {
        type: 'newsroom',
        title: 'Mention 4.0: A New Era of Social Networking',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
        category: 'Product',
        slug: 'mention-4-0-a-new-era-of-social-networking',
      },
      {
        type: 'newsroom',
        title: 'How AI is Reshaping Community Building',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop',
        category: 'Research',
        slug: 'how-ai-is-reshaping-community-building',
      },
      {
        type: 'newsroom',
        title: 'Privacy-First Design: Our Approach to User Data',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=400&fit=crop',
        category: 'Engineering',
        slug: 'privacy-first-design-our-approach-to-user-data',
      },
      {
        type: 'newsroom',
        title: 'Building for Billions: Oxy Infrastructure Update',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop',
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
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop',
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
        image: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=400&h=400&fit=crop',
        category: 'Product',
        slug: 'horizon-mapping-the-future-of-sustainability',
      },
      {
        type: 'newsroom',
        title: 'Open Source at Oxy: Our 2026 Roadmap',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop',
        category: 'Engineering',
        slug: 'open-source-at-oxy-our-2026-roadmap',
      },
      {
        type: 'newsroom',
        title: 'Oxy Ask: AI-Powered Search for Everyone',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop',
        category: 'Product',
        slug: 'oxy-ask-ai-powered-search-for-everyone',
      },
      {
        type: 'newsroom',
        title: 'The Ethics of Recommendation Algorithms',
        image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=400&fit=crop',
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
        image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=400&fit=crop',
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
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=400&fit=crop',
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
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
        category: 'Company',
        slug: 'empowering-local-stores-with-faircoin',
      },
      {
        type: 'newsroom',
        title: 'Homiio: Rethinking How We Find Home',
        image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop',
        category: 'Product',
        slug: 'homiio-rethinking-how-we-find-home',
      },
      {
        type: 'newsroom',
        title: 'Carbon Neutral by 2027: Our Sustainability Pledge',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop',
        category: 'Company',
        slug: 'carbon-neutral-by-2027-our-sustainability-pledge',
      },
      {
        type: 'newsroom',
        title: 'Oxy Partners with UN Digital Cooperation',
        image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop',
        category: 'Company',
        slug: 'oxy-partners-with-un-digital-cooperation',
      },
      {
        type: 'newsroom',
        title: 'Introducing Codea: AI-Powered Development',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
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
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
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
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
        alt: 'Team working',
      },
    ],
  },
]
