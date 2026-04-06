// --- Types ---

export interface InitiativeNavLink {
  label: string
  href: string
}

export interface InitiativePillar {
  number: string
  label: string
  title: string
  description: string
  emoji: string
}

export interface EngagementPathway {
  title: string
  description: string
  ctaText: string
  ctaHref: string
  iconType: 'idea' | 'volunteer' | 'donate' | 'community'
}

// --- Section Data ---

export const introSection = {
  tagline: 'Dream it, build it.',
  description:
    'Oxy Initiative is dedicated to turning visionary ideas into reality. We believe that the best innovations come from a community of passionate individuals who share a common goal: to build a better future for everyone.',
  navLinks: [
    { label: 'Who we are', href: '#who-we-are' },
    { label: 'Our Technologies', href: '#technologies' },
    { label: 'Our Company', href: '/company' },
    { label: 'Get involved', href: '#get-involved' },
    { label: 'Explore', href: '#explore' },
  ] as InitiativeNavLink[],
}

export const pillarsSection = {
  heading: 'Powerful and empowering.',
  subtitle:
    'A movement leveraging technology for community and sustainability projects that create lasting, positive change around the world.',
  pillars: [
    {
      number: '01',
      label: 'Community',
      title: 'Community Support and Development',
      description:
        'Resources for education, healthcare, disaster relief, and community development programs that create lasting impact.',
      emoji: '\u{1F91D}',
    },
    {
      number: '02',
      label: 'Agriculture',
      title: 'Supporting Organic Farming',
      description:
        'Seed provision and sustainable agriculture initiatives that empower local farmers and promote food security.',
      emoji: '\u{1F331}',
    },
    {
      number: '03',
      label: 'Water',
      title: 'Building Waterholes',
      description:
        'Access to clean drinking water initiatives that transform communities and improve health outcomes.',
      emoji: '\u{1F4A7}',
    },
    {
      number: '04',
      label: 'Environment',
      title: 'Cleaning Beaches',
      description:
        'Marine ecosystem preservation through community cleanups that protect our oceans and coastlines.',
      emoji: '\u{1F30A}',
    },
  ] as InitiativePillar[],
}

export const engagementSection = {
  heading: 'One ecosystem, a universe of possibilities.',
  pathways: [
    {
      title: 'Submit Your Idea',
      description: 'Have a vision for positive change? Share your idea and we\u2019ll help bring it to life.',
      ctaText: 'Submit idea',
      ctaHref: '#submit-idea',
      iconType: 'idea',
    },
    {
      title: 'Volunteer',
      description: 'Join hands with a global community of changemakers and make a direct impact.',
      ctaText: 'Volunteer',
      ctaHref: '#volunteer',
      iconType: 'volunteer',
    },
    {
      title: 'Donate',
      description: 'Every contribution counts. Support projects that are building a better world.',
      ctaText: 'Donate',
      ctaHref: '#donate',
      iconType: 'donate',
    },
    {
      title: 'Join Our Community',
      description: 'Connect with like-minded individuals on Telegram and Reddit.',
      ctaText: 'Join community',
      ctaHref: '#community',
      iconType: 'community',
    },
  ] as EngagementPathway[],
}

export const closingSection = {
  heading: 'Build by yourself, not for yourself.',
  body: 'The future is not built by one person alone. It is built by communities coming together, sharing resources, and working toward a common vision. At the Oxy Initiative, we believe that collective action and sustainability are the foundations of lasting change. Every contribution, no matter how small, creates a ripple that reaches further than we can imagine.',
}

// --- Hero Images ---

export const imagePaths = [
  // People helping & volunteering
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80', // volunteers hands together
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&q=80', // community volunteering
  'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&q=80', // charity donation boxes
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&q=80', // helping children
  // People happy & together
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80', // group of friends laughing
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&q=80', // diverse team celebrating
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&q=80', // people holding hands
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&q=80', // happy family outdoors
  // Construction & building
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80', // construction workers building
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80', // construction site crane
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80', // architectural blueprint hands
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80', // modern building looking up
  // Education & learning
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80', // books and apple
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80', // children in classroom
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80', // teacher with students
  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&q=80', // graduates throwing caps
];
