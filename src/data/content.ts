export interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
}

export interface Capability {
  title: string
  description: string
  features: string[]
}

export interface UseCase {
  role: string
  items: string[]
}

export interface Prompt {
  text: string
}

export interface PricingTier {
  name: string
  credits: string
  creditLabel: string
  highlighted?: boolean
}

export interface PrivacyPoint {
  text: string
}

export interface NavItem {
  label: string
  href: string
}

export interface NavDropdownItem {
  title: string
  description: string
  href: string
  icon?: string
  showGrid?: boolean
}

export interface NavDropdownSection {
  heading: string
  items: NavDropdownItem[]
}

export interface NavSidePanel {
  heading?: string
  links: NavItem[]
}

export interface NavDropdown {
  label: string
  sections: NavDropdownSection[]
  sidePanel?: NavSidePanel
}

export interface FooterLink {
  label: string
  href: string
  isExternal?: boolean
  isNewBadge?: boolean
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export const simpleNavLinks: NavItem[] = [
  { label: 'Products', href: '/products' },
  { label: 'Pricing', href: '/pricing' },
]

// Hero
export const hero = {
  title: 'Discover Oxy.',
  subtitle: 'Open-source tools for a better future.',
  description:
    'Oxy is an ethical technology ecosystem built on open-source principles. From social connection to AI assistance, Oxy provides privacy-first tools that respect your data, empower communities, and put people before profit.',
}

// Universal Context
export const universalContext = {
  title: 'Connected Ecosystem',
  trademark: false,
  subtitle: 'A Unified Approach to Ethical Technology',
  points: [
    'Privacy-first architecture ensures your data stays yours — no surveillance, no selling',
    'Fully open-source so anyone can inspect, contribute, and build with confidence',
    'Seamless interoperability across Oxy products — social, AI, and developer tools work as one',
    'Community-driven development shaped by the people who use it, not corporate interests',
    'Built on open standards to connect with the broader ecosystem, not lock you in',
  ],
}

// Capabilities
export const capabilities: Capability[] = [
  {
    title: 'Social Connection',
    description:
      'Stay connected with the people and communities that matter through Mention, Oxy\'s open social platform.',
    features: [
      'Share thoughts, media, and conversations in a space free from algorithmic manipulation',
      'Build and join communities around shared interests with full moderation control',
      'Follow topics and people across the fediverse with ActivityPub interoperability',
      'Own your social graph — export your data and connections at any time',
      'Chronological, transparent feeds with no hidden ranking or promoted content',
    ],
  },
  {
    title: 'AI Assistance',
    description:
      'Oxy AI puts powerful, privacy-respecting artificial intelligence at your fingertips.',
    features: [
      'Get intelligent answers, summaries, and creative help without sacrificing your privacy',
      'Run AI models locally or through Oxy\'s privacy-first cloud infrastructure',
      'Open-source models you can inspect, fine-tune, and self-host',
      'Context-aware assistance that works across the Oxy ecosystem',
      'No data harvesting — your conversations are never used to train models',
    ],
  },
  {
    title: 'Privacy & Security',
    description:
      'Security and transparency are built into every layer of the Oxy ecosystem.',
    features: [
      'End-to-end encryption for private messages and sensitive data',
      'Zero-knowledge architecture — Oxy cannot access your personal content',
      'Regular third-party security audits with publicly available reports',
      'Granular privacy controls so you decide exactly what to share and with whom',
    ],
  },
  {
    title: 'Developer Tools',
    description:
      'Build on top of Oxy with open APIs, SDKs, and a thriving developer community.',
    features: [
      'Well-documented REST and GraphQL APIs for every Oxy product',
      'Open-source SDKs for popular languages and frameworks',
      'Plugin and extension system to customize and extend Oxy products',
      'Self-hosting support with Docker, Kubernetes, and bare-metal guides',
    ],
  },
]

// Use Cases
export const useCases: UseCase[] = [
  {
    role: 'Developers',
    items: [
      'Build and ship apps on top of Oxy\'s open APIs and SDKs',
      'Contribute to the open-source codebase and shape the roadmap',
      'Self-host Oxy products with full control over your infrastructure',
      'Create plugins, integrations, and extensions for the ecosystem',
    ],
  },
  {
    role: 'Communities',
    items: [
      'Create safe, moderated spaces for discussion and collaboration',
      'Connect members across platforms through open federation standards',
      'Organize events, share resources, and grow together without ads or algorithmic interference',
      'Maintain full ownership and portability of community data',
    ],
  },
  {
    role: 'Organizations',
    items: [
      'Deploy privacy-respecting tools across your team with centralized administration',
      'Replace surveillance-based software with ethical, transparent alternatives',
      'Meet compliance and data-residency requirements with self-hosted deployments',
    ],
  },
]

// Prompt Library
export const prompts: Prompt[] = [
  { text: 'Summarize the latest discussions in my community feed' },
  { text: 'Draft a post announcing our new open-source project' },
  { text: 'Help me write a privacy policy for my Oxy-powered app' },
  { text: 'Generate API documentation for my plugin endpoints' },
  { text: 'Explain the differences between self-hosted and cloud deployment' },
  { text: 'Create a contributor guide for our open-source repository' },
]

// Privacy
export const privacyPoints: PrivacyPoint[] = [
  { text: 'Your data is stored securely and never sold to third parties or advertisers' },
  { text: 'You control your own privacy settings — choose exactly what is visible and to whom' },
  { text: 'You are always in command and empowered to export, modify, or delete your data at any time' },
  { text: 'Personal data is never used to train AI models without your explicit consent' },
  { text: 'All Oxy products are open-source, so privacy claims are independently verifiable' },
]

// Pricing
export const pricingTiers: PricingTier[] = [
  {
    name: 'Community',
    credits: '500',
    creditLabel: 'credits / month',
  },
  {
    name: 'Contributor',
    credits: '1,000',
    creditLabel: 'credits / month',
    highlighted: true,
  },
  {
    name: 'Organization',
    credits: '2,500',
    creditLabel: 'credits / month',
  },
]

// Partner Programs
export interface PartnerProgram {
  number: string
  label: string
  title: string
  description: string
  ctaText: string
  ctaHref: string
}

export const partnerPrograms: PartnerProgram[] = [
  {
    number: '01',
    label: 'Open Source Partners',
    title: 'Open Source Partners.',
    description: 'Build and maintain open-source projects that extend the Oxy ecosystem.',
    ctaText: 'Become an Open Source Partner',
    ctaHref: '#',
  },
  {
    number: '02',
    label: 'Community Partners',
    title: 'Community Partners.',
    description: 'Grow vibrant communities and champion ethical technology.',
    ctaText: 'Become a Community Partner',
    ctaHref: '#',
  },
  {
    number: '03',
    label: 'Education Partners',
    title: 'Education Partners.',
    description: 'Bring open-source tools and digital literacy into classrooms and workshops.',
    ctaText: 'Become an Education Partner',
    ctaHref: '#',
  },
]

// Partner Testimonials
export interface PartnerTestimonial {
  name: string
  role: string
  partnerType: string
  quote: string
  image: string
  favoriteFeatures?: string[]
}

export const partnerTestimonials: PartnerTestimonial[] = []

// Keep Up To Date Cards
export interface KeepUpToDateCard {
  title: string
  description: string
  href: string
  iconType: 'linkedin' | 'x' | 'blog' | 'changelog'
}

export const keepUpToDateCards: KeepUpToDateCard[] = [
  {
    title: 'LinkedIn',
    description: 'Keep up to date with what the team is building.',
    href: 'https://www.linkedin.com/company/oxyhq/',
    iconType: 'linkedin',
  },
  {
    title: 'X',
    description: 'Stay in the loop with what we\'re working on.',
    href: 'https://x.com/oxyhqinc',
    iconType: 'x',
  },
  {
    title: 'Blog',
    description: 'Be the first to get new Oxy updates.',
    href: '/company/news',
    iconType: 'blog',
  },
  {
    title: 'Changelog',
    description: 'Stay on top of all releases and new features.',
    href: '/changelog',
    iconType: 'changelog',
  },
]

// Capability Tabs
export interface CapabilityTab {
  role: string
  panels: {
    title: string
    description: string
    mockupType: 'chat' | 'meeting' | 'call' | 'pipeline'
  }[]
}

export const capabilityTabs: CapabilityTab[] = [
  {
    role: 'Developers',
    panels: [
      { title: 'Ship faster with open APIs and SDKs.', description: 'Build integrations, plugins, and apps on a well-documented platform.', mockupType: 'chat' },
      { title: 'Self-host with confidence.', description: 'Deploy on your own infrastructure with Docker, Kubernetes, or bare-metal guides.', mockupType: 'pipeline' },
    ],
  },
  {
    role: 'Creators',
    panels: [
      { title: 'Own your audience, not the algorithm.', description: 'Publish and share content without ads, tracking, or algorithmic suppression.', mockupType: 'meeting' },
      { title: 'AI-powered creative tools.', description: 'Draft, edit, and brainstorm with Oxy AI — your data stays private.', mockupType: 'call' },
    ],
  },
  {
    role: 'Communities',
    panels: [
      { title: 'Build spaces people actually trust.', description: 'Create moderated, ad-free communities with full data portability.', mockupType: 'chat' },
    ],
  },
  {
    role: 'Organizations',
    panels: [
      { title: 'Ethical tools for modern teams.', description: 'Replace surveillance-based software with transparent, privacy-first alternatives.', mockupType: 'pipeline' },
    ],
  },
]

// Universal Context Cards
export interface ContextCard {
  title: string
  subtitle: string
  iconType: 'database' | 'brain' | 'search' | 'globe' | 'shield'
}

export const contextCards: ContextCard[] = [
  { title: 'Grounded in privacy', subtitle: 'your data is encrypted and never sold.', iconType: 'shield' },
  { title: 'Open-source transparency', subtitle: 'every line of code is publicly auditable.', iconType: 'database' },
  { title: 'Intelligent assistance', subtitle: 'AI that helps without harvesting your data.', iconType: 'brain' },
  { title: 'Federated by design', subtitle: 'connect across platforms with open standards.', iconType: 'globe' },
  { title: 'Ecosystem search', subtitle: 'find what you need across all Oxy products.', iconType: 'search' },
]

// Prompt Library Cards
export interface PromptLibraryCard {
  title: string
  description: string
  iconType: 'calendar' | 'briefcase' | 'phone' | 'mail' | 'chart' | 'sparkle' | 'search' | 'users'
}

export const promptLibraryCards: PromptLibraryCard[] = [
  { title: 'Community digest', description: 'Get a summary of recent discussions and trending topics.', iconType: 'calendar' },
  { title: 'Project overview', description: 'Generate a status report for your open-source project.', iconType: 'briefcase' },
  { title: 'Content creation', description: 'Draft posts, articles, and announcements with AI assistance.', iconType: 'sparkle' },
  { title: 'Draft outreach', description: 'Write a message to engage contributors or community members.', iconType: 'mail' },
  { title: 'Usage analytics', description: 'Understand how your community or app is growing.', iconType: 'chart' },
  { title: 'Plugin ideas', description: 'Brainstorm extensions and integrations for the Oxy ecosystem.', iconType: 'sparkle' },
  { title: 'Documentation', description: 'Generate API docs, guides, and contributor instructions.', iconType: 'search' },
  { title: 'Onboarding guide', description: 'Create a welcome flow for new community members.', iconType: 'users' },
  { title: 'Privacy review', description: 'Audit your app or community settings for best practices.', iconType: 'briefcase' },
  { title: 'Migration plan', description: 'Plan a move from a proprietary platform to Oxy.', iconType: 'chart' },
  { title: 'Release notes', description: 'Draft changelog entries for your latest updates.', iconType: 'calendar' },
  { title: 'Contributor guide', description: 'Create contribution guidelines for your open-source repo.', iconType: 'users' },
]
