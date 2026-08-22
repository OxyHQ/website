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
  tagline: 'Dream it. Build it. Share it.',
  description:
    'The Oxy Initiative turns community ideas into practical projects. We support people building open, useful and sustainable alternatives, then give those ideas room to grow.',
  navLinks: [
    { label: 'Who we are', href: '#who-we-are' },
    { label: 'Our ecosystem', href: '/apps' },
    { label: 'Our company', href: '/company' },
    { label: 'Get involved', href: '#get-involved' },
    { label: 'Explore', href: '#explore' },
  ] as InitiativeNavLink[],
}

export const pillarsSection = {
  heading: 'Ideas that become infrastructure.',
  subtitle:
    'We back the people doing the patient work: strengthening communities, protecting shared resources and making useful technology available to more people.',
  pillars: [
    {
      number: '01',
      label: 'Community',
      title: 'Strengthening local communities',
      description:
        'Support for education, healthcare, disaster relief and local projects that give people more room to thrive.',
      emoji: '\u{1F91D}',
    },
    {
      number: '02',
      label: 'Agriculture',
      title: 'Growing food with care',
      description:
        'Sustainable agriculture initiatives that help local growers build healthier soil, stronger livelihoods and food security.',
      emoji: '\u{1F331}',
    },
    {
      number: '03',
      label: 'Water',
      title: 'Protecting access to water',
      description:
        'Clean water projects that improve everyday health and give communities a stronger foundation for the future.',
      emoji: '\u{1F4A7}',
    },
    {
      number: '04',
      label: 'Environment',
      title: 'Restoring shared environments',
      description:
        'Community-led action to protect beaches, marine ecosystems and the places people rely on every day.',
      emoji: '\u{1F30A}',
    },
  ] as InitiativePillar[],
}

export const engagementSection = {
  heading: 'There is more than one way to move an idea forward.',
  pathways: [
    {
      title: 'Submit Your Idea',
      description: 'Have a concrete proposal for a better product, community or public good? Put it in front of the people who can help shape it.',
      ctaText: 'Open feature board',
      ctaHref: '/features',
      iconType: 'idea',
    },
    {
      title: 'Contribute your skills',
      description: 'Code, design, write, research or help a partner project turn a good idea into something people can use.',
      ctaText: 'Explore partnerships',
      ctaHref: '/partners',
      iconType: 'volunteer',
    },
    {
      title: 'Donate',
      description: 'Help keep Oxy independent and make room for projects that put people, privacy and long-term impact first.',
      ctaText: 'Support the work',
      ctaHref: 'https://opencollective.com/oxy',
      iconType: 'donate',
    },
    {
      title: 'Join Our Community',
      description: 'Follow the work, open an issue, share feedback and help shape what Oxy builds next in the open.',
      ctaText: 'Open GitHub',
      ctaHref: 'https://github.com/OxyHQ',
      iconType: 'community',
    },
  ] as EngagementPathway[],
}

export const closingSection = {
  heading: 'Build with others, for everyone.',
  body: 'The best future is built in public: people bringing different skills, experiences and perspectives to the same table. The Oxy Initiative creates space for that work, from the first proposal to the projects that make a lasting difference. Your contribution can be the next useful connection in the chain.',
}
