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
      ctaHref: '/feature-board',
      iconType: 'idea',
    },
    {
      title: 'Volunteer',
      description: 'Join hands with a global community of changemakers and make a direct impact.',
      ctaText: 'Volunteer',
      ctaHref: '/company/careers',
      iconType: 'volunteer',
    },
    {
      title: 'Donate',
      description: 'Every contribution counts. Support projects that are building a better world.',
      ctaText: 'Donate',
      ctaHref: '/initiative',
      iconType: 'donate',
    },
    {
      title: 'Join Our Community',
      description: 'Connect with like-minded individuals on Telegram and Reddit.',
      ctaText: 'Join community',
      ctaHref: 'https://github.com/OxyHQ',
      iconType: 'community',
    },
  ] as EngagementPathway[],
}

export const closingSection = {
  heading: 'Build by yourself, not for yourself.',
  body: 'The future is not built by one person alone. It is built by communities coming together, sharing resources, and working toward a common vision. At the Oxy Initiative, we believe that collective action and sustainability are the foundations of lasting change. Every contribution, no matter how small, creates a ripple that reaches further than we can imagine.',
}

// --- Hero Images ---
//
// NOTE: This array previously held 16 Unsplash stock-photo URLs cloned from
// the original ManifestoSection design. Since we don't own the imagery and
// the `ManifestoSection` was decorative, the list is now empty.
// `InitiativePage` gates the section behind `FEATURES.SHOW_INITIATIVE_MANIFESTO_IMAGES`
// — flip the flag once self-hosted imagery exists.

export const imagePaths: string[] = []
