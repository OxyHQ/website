export type CardSize = '1x1' | '2x1' | '1x2' | '2x2' | '4x2'

export type HeroCard =
  | {
      type: 'newsroom'
      title: string
      image: string
      category: string
    }
  | {
      type: 'careers'
      jobTitle: string
      department: string
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

/** A slot in the carousel grid. Has a size and one or more card faces that rotate. */
export interface CarouselSlot {
  size: CardSize
  faces: HeroCard[]
  /** Rotation interval in ms (only matters if faces.length > 1) */
  rotateInterval?: number
}

export const heroCarouselSlots: CarouselSlot[] = [
  // Newsroom card rotating through posts
  {
    size: '1x2',
    rotateInterval: 4000,
    faces: [
      {
        type: 'newsroom',
        title: 'Introducing Rooms: Live Audio on Mention',
        image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop',
        category: 'Product',
      },
      {
        type: 'newsroom',
        title: 'Mention 4.0: A New Era of Social Networking',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
        category: 'Product',
      },
      {
        type: 'newsroom',
        title: 'How AI is Reshaping Community Building',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop',
        category: 'Research',
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
  // Careers card rotating through jobs
  {
    size: '1x1',
    rotateInterval: 5000,
    faces: [
      { type: 'careers', jobTitle: 'Sales Manager', department: 'Careers' },
      { type: 'careers', jobTitle: 'Frontend Engineer', department: 'Careers' },
      { type: 'careers', jobTitle: 'Product Designer', department: 'Careers' },
    ],
  },
  // Large photo
  {
    size: '2x2',
    faces: [
      {
        type: 'photo',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=800&fit=crop',
        alt: 'Technology event',
      },
    ],
  },
  // Oxy brand
  {
    size: '1x1',
    faces: [{ type: 'brand', variant: 'oxy' }],
  },
  // Newsroom rotating
  {
    size: '1x1',
    rotateInterval: 3500,
    faces: [
      {
        type: 'newsroom',
        title: 'Horizon: Mapping the Future of Sustainability',
        image: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=400&h=400&fit=crop',
        category: 'Product',
      },
      {
        type: 'newsroom',
        title: 'Open Source at Oxy: Our 2026 Roadmap',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop',
        category: 'Engineering',
      },
    ],
  },
  // FairCoin dashboard — static large
  {
    size: '4x2',
    faces: [{ type: 'faircoin' }],
  },
  // Fair brand — static
  {
    size: '1x2',
    faces: [{ type: 'brand', variant: 'fair' }],
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
  // Values rotating
  {
    size: '2x1',
    rotateInterval: 3500,
    faces: [
      { type: 'values', heading: 'Human-first design', body: 'Tools that empower people, not manipulate them.' },
      { type: 'values', heading: 'Your data stays yours', body: 'No ads, no data brokers, no hidden monetization.' },
      { type: 'values', heading: 'Open by default', body: 'Every Oxy tool is open source. Transparency is not optional.' },
    ],
  },
  // Photo
  {
    size: '1x1',
    faces: [
      {
        type: 'photo',
        image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop',
        alt: 'Team member',
      },
    ],
  },
  // Newsroom rotating
  {
    size: '2x1',
    rotateInterval: 4500,
    faces: [
      {
        type: 'newsroom',
        title: 'Empowering Local Stores with FairCoin: A Sustainable Solution',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
        category: 'Company',
      },
      {
        type: 'newsroom',
        title: 'Homiio: Rethinking How We Find Home',
        image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop',
        category: 'Product',
      },
    ],
  },
]
