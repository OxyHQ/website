export type CardSize = '1x1' | '2x1' | '1x2' | '2x2' | '4x2'

export type HeroCarouselCard =
  | {
      type: 'newsroom'
      size: CardSize
      posts: { title: string; image: string; category: string }[]
    }
  | {
      type: 'careers'
      size: CardSize
      jobTitle: string
      department: string
    }
  | {
      type: 'brand'
      size: CardSize
      variant: 'oxy' | 'fair'
    }
  | {
      type: 'photo'
      size: CardSize
      image: string
      alt: string
    }
  | {
      type: 'faircoin'
      size: CardSize
    }
  | {
      type: 'values'
      size: CardSize
      items: { heading: string; body: string }[]
    }

export const heroCarouselCards: HeroCarouselCard[] = [
  // Row-spanning newsroom card (purple-tinted)
  {
    type: 'newsroom',
    size: '1x2',
    posts: [
      {
        title: 'Introducing Rooms: Live Audio on Mention',
        image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop',
        category: 'Product',
      },
      {
        title: 'Mention 4.0: A New Era of Social Networking',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
        category: 'Product',
      },
      {
        title: 'How AI is Reshaping Community Building',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop',
        category: 'Research',
      },
    ],
  },
  // Community photo
  {
    type: 'photo',
    size: '1x1',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop',
    alt: 'Community gathering',
  },
  // Careers card
  {
    type: 'careers',
    size: '1x1',
    jobTitle: 'Sales Manager',
    department: 'Careers',
  },
  // Large photo card
  {
    type: 'photo',
    size: '2x2',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=800&fit=crop',
    alt: 'Technology event',
  },
  // Oxy brand card
  {
    type: 'brand',
    size: '1x1',
    variant: 'oxy',
  },
  // Another newsroom card
  {
    type: 'newsroom',
    size: '1x1',
    posts: [
      {
        title: 'Horizon: Mapping the Future of Sustainability',
        image: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=400&h=400&fit=crop',
        category: 'Product',
      },
      {
        title: 'Open Source at Oxy: Our 2026 Roadmap',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop',
        category: 'Engineering',
      },
    ],
  },
  // FairCoin large dashboard card
  {
    type: 'faircoin',
    size: '4x2',
  },
  // Fair brand card
  {
    type: 'brand',
    size: '1x2',
    variant: 'fair',
  },
  // Photo card
  {
    type: 'photo',
    size: '1x1',
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=400&fit=crop',
    alt: 'People collaborating',
  },
  // Values rotating card
  {
    type: 'values',
    size: '2x1',
    items: [
      { heading: 'Human-first design', body: 'Tools that empower people, not manipulate them.' },
      { heading: 'Your data stays yours', body: 'No ads, no data brokers, no hidden monetization.' },
      { heading: 'Open by default', body: 'Every Oxy tool is open source. Transparency is not optional.' },
    ],
  },
  // Another photo
  {
    type: 'photo',
    size: '1x1',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop',
    alt: 'Team member',
  },
  // Another newsroom
  {
    type: 'newsroom',
    size: '2x1',
    posts: [
      {
        title: 'Empowering Local Stores with FairCoin: A Sustainable Solution',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
        category: 'Company',
      },
      {
        title: 'Homiio: Rethinking How We Find Home',
        image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop',
        category: 'Product',
      },
    ],
  },
]
