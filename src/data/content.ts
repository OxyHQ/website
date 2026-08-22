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
  /**
   * When `true`, the Navbar renders this link as an `<a target="_blank">`
   * regardless of the href scheme. Useful for cross-host links that still
   * start with `/` (e.g. a sub-brand linking to a tokenlist.json file).
   */
  external?: boolean
}

export interface NavDropdownItemImage {
  _id?: string
  url?: string
  thumbnails?: { sm?: string; md?: string; lg?: string }
}

export interface NavDropdownItem {
  title: string
  description: string
  href: string
  /** Opens outside the website, including links whose path happens to start with `/`. */
  external?: boolean
  icon?: string
  image?: string | NavDropdownItemImage | null
  logoColor?: string
  preserveImageColors?: boolean
}

export interface NavDropdownSection {
  heading: string
  items: NavDropdownItem[]
}

export interface NavSidePanel {
  heading?: string
  links: NavItem[]
}

/**
 * Promo card rendered as its own panel between the items grid and the side
 * panel. A single full-bleed image with a gradient-anchored title/description,
 * the whole card links to `href`.
 */
export interface NavDropdownCard {
  href: string
  image: string
  title: string
  description: string
  alt?: string
}

/**
 * A wide three-column dropdown: a column of `features` next to promo `cards`.
 * Features reuse `NavDropdownItem` so they render identically to the other
 * dropdowns. Distinct from the `sections`/`sidePanel` layout — a dropdown uses
 * one or the other.
 */
export interface NavFeatureGrid {
  features: NavDropdownItem[]
  cards: NavDropdownCard[]
}

export interface NavDropdown {
  label: string
  sections: NavDropdownSection[]
  card?: NavDropdownCard
  cards?: NavDropdownCard[]
  sidePanel?: NavSidePanel
  featureGrid?: NavFeatureGrid
}

/**
 * The `Product` dropdown: a feature column + two promo cards. Hardcoded for now;
 * move to the CMS navigation document when it needs to be editor-managed.
 */
export const productNavDropdown: NavDropdown = {
  // Not "Product": the apps live in the Technologies dropdown, which is
  // generated from the product records, so listing them here would be the same
  // menu twice. This one carries what Oxy stands for instead.
  label: 'About',
  sections: [],
  featureGrid: {
    features: [
      {
        href: '/company/manifesto',
        title: 'Manifesto',
        description: 'What we believe and what we refuse to trade away',
        image: '/images/apps/manifesto.svg',
      },
      {
        href: '/company/charter',
        title: 'Founding Charter',
        description: 'The commitments we intend to be held to as we grow',
        image: '/images/apps/founding-charter.svg',
      },
      {
        href: '/company/business',
        title: 'How our business works',
        description: 'Where the money comes from, and what we refuse to earn',
        image: '/images/apps/business.svg',
      },
      {
        href: '/company/transparency',
        title: 'Transparency Center',
        description: 'Decisions, data handling and how we stay accountable',
        image: '/images/apps/transparency.svg',
      },
      {
        href: '/initiative',
        title: 'The Initiative',
        description: 'The community work and projects we support',
        image: '/images/apps/initiative.svg',
      },
      {
        href: 'https://github.com/OxyHQ',
        title: 'Open source',
        description: 'Read, run and challenge the code behind the claims',
        icon: 'github',
      },
    ],
    cards: [
      {
        href: '/apps',
        image: '/ai/research/oxy-open-design.png',
        title: 'The whole ecosystem',
        description: 'Every app and service, and how they share one identity and one platform',
        alt: 'The Oxy ecosystem',
      },
      {
        href: '/company/careers',
        image: '/images/nav-build-with-us.jpg',
        title: 'Build it with us',
        description: 'Open roles across engineering, design and community',
        alt: 'Working at Oxy',
      },
    ],
  },
  sidePanel: {
    heading: 'Company',
    links: [
      { label: 'Changelog', href: '/changelog' },
      { label: 'Newsroom', href: '/newsroom' },
      { label: 'Engineering blog', href: '/company/news' },
      { label: 'Careers', href: '/company/careers' },
    ],
  },
}

/** Resources navigation is part of the site shell, so it is intentionally code-owned. */
export const resourcesNavDropdown: NavDropdown = {
  label: 'Resources',
  sections: [
    {
      heading: 'Support',
      items: [
        { title: 'Help center', description: "Learn more about Oxy's features", href: '/help', image: '/images/apps/help-center.svg' },
        { title: 'Academy', description: 'Essential Oxy features explained', href: '/academy', image: '/images/apps/academy.svg' },
      ],
    },
    {
      heading: 'Developers',
      items: [{ title: 'Developer docs', description: 'Start building Oxy apps', href: '/developers/docs', icon: 'developers' }],
    },
    {
      heading: 'Partners',
      items: [{ title: 'Partner programs', description: 'Developers, creators, consultants', href: '/partners', image: '/images/apps/partner-programs.svg' }],
    },
    {
      heading: 'Build',
      items: [
        { title: 'Developer platform', description: 'Build on Oxy', href: '/developers/docs', image: '/images/apps/developer-platform.svg' },
        {
          title: 'API reference',
          description: 'Every endpoint, versioned',
          href: '/developers/docs/api',
          image: '/images/apps/api-reference.svg',
        },
        { title: 'Status', description: 'Live health of every service', href: '/status', image: '/images/apps/status.svg' },
        {
          title: 'Open source',
          description: 'Read and run what we ship',
          href: 'https://github.com/OxyHQ',
          icon: 'github',
        },
      ],
    },
  ],
  sidePanel: {
    heading: 'Discover',
    links: [
      { label: 'All products', href: '/products' },
      { label: 'Open source', href: 'https://github.com/OxyHQ' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Newsroom', href: '/newsroom' },
    ],
  },
};

/**
 * Fallback for the product-backed Technologies menu while the product query is
 * loading or when the local API is unavailable. The live menu replaces these
 * items with the current products marked `showInNav`.
 */
export const technologiesNavFallbackItems: Array<NavDropdownItem & { section: string }> = [
  { title: 'Mention', description: 'Decentralized social media', href: '/mention', image: '/images/apps/mention.png', logoColor: '#40c2ed', section: 'Social & Communication' },
  { title: 'Inbox by Oxy', description: 'A calmer way to handle email', href: '/inbox', image: '/images/apps/inbox.svg', logoColor: '#bf40ed', section: 'Tools' },
  { title: 'Noted', description: "Oxy's workspace for notes and ideas", href: 'https://noted.oxy.so', section: 'Tools' },
  { title: 'Alia', description: 'AI-Powered assistant', href: '/ai', image: '/images/apps/alia-dropdown.svg', logoColor: '#fab8ff', preserveImageColors: true, section: 'AI & Research' },
  { title: 'Clarity', description: 'AI-Powered search engine', href: '/clarity', image: '/images/apps/clarity.png', logoColor: '#664100', section: 'AI & Research' },
  { title: 'Astro Browser', description: 'A private browser for the open web', href: '/astro', image: '/images/apps/astro.svg', logoColor: '#009699', section: 'AI & Research' },
  { title: 'Kaana', description: 'An AI agent for everyday life', href: '/', section: 'AI & Research' },
  { title: 'Horizon', description: 'A clearer view of what matters', href: '/', section: 'Housing' },
  { title: 'FairCoin Explorer', description: 'Explore the FairCoin network', href: 'https://explorer.fairco.in', image: '/images/apps/faircoin-explorer.png', logoColor: '#185c00', section: 'Finance' },
  { title: 'Pay', description: 'Simple payments across Oxy', href: '/pay', section: 'Finance' },
  { title: 'FairCoin', description: 'Ethical Digital Currency', href: 'https://fairco.in', image: '/images/apps/faircoin.svg', logoColor: '#204700', preserveImageColors: true, section: 'Finance' },
  { title: 'FAIRWallet', description: 'Manage your FairCoin', href: 'https://fairco.in/wallet', image: '/images/apps/faircoin-wallet.svg', logoColor: '#0c6600', preserveImageColors: true, section: 'Finance' },
  { title: 'Mercaria', description: 'An open marketplace for people and goods', href: '/mercaria', image: '/images/apps/mercaria.svg', logoColor: '#ed4040', section: 'Commerce' },
  { title: 'Wholesale by Mercaria', description: 'Manage products, suppliers and wholesale sales', href: 'https://dashboard.mercaria.co', image: '/images/apps/wholesale.svg', preserveImageColors: true, section: 'Commerce' },
  { title: 'Homiio', description: 'Rental made easy', href: '/homiio', section: 'Housing' },
  { title: 'Moovo', description: 'Mobility and urban transport', href: '/moovo', section: 'Mobility' },
  { title: 'TNP', description: 'The network protocol', href: '/tnp', image: '/images/apps/tnp.png', logoColor: '#2f9e00', section: 'Infrastructure' },
];

export const technologiesNavSidePanel: NavSidePanel = {
  heading: 'Explore',
  links: [
    { label: 'All products', href: '/products' },
    { label: 'Open source', href: 'https://github.com/OxyHQ' },
    { label: 'Developer platform', href: '/developers/program' },
    { label: 'Status page', href: '/status' },
  ],
};

export const technologiesNavSectionOrder = [
  'Social & Communication',
  'Tools',
  'AI & Research',
  'Finance',
  'Commerce',
  'Housing',
  'Mobility',
  'Infrastructure',
  'Developers',
] as const;

const technologySectionLabels: Record<string, string> = {
  apps: 'Other',
  'social-communication': 'Social & Communication',
  'finance-commerce': 'Finance',
  infrastructure: 'Infrastructure',
  infraestructure: 'Infrastructure',
  developer: 'Developers',
};

const technologyNavProductSections: Record<string, string> = {
  alia: 'AI & Research',
  c: 'AI & Research',
  clarity: 'AI & Research',
  i: 'Tools',
  inbox: 'Tools',
  noted: 'Tools',
  faircoin: 'Finance',
  faircoinexplorer: 'Finance',
  fairwallet: 'Finance',
  pay: 'Finance',
  marketplace: 'Commerce',
  mercaria: 'Commerce',
  wholesale: 'Commerce',
  homiio: 'Housing',
  horizon: 'Housing',
  m: 'Mobility',
  moovo: 'Mobility',
  kaana: 'AI & Research',
  astro: 'AI & Research',
};

const technologyNavProductOrder: Record<string, number> = {
  Alia: 0,
  'Alia AI': 0,
  Mention: 0,
  'Inbox by Oxy': 1,
  'Oxy Inbox': 1,
  Noted: 1,
  Clarity: 2,
  'Astro Browser': 3,
  Kaana: 99,
  Mercaria: 0,
  'Wholesale by Mercaria': 1,
  Homiio: 0,
  Horizon: 1,
  Moovo: 0,
};

export function technologyNavSection(productId: string, section?: string): string {
  return technologyNavProductSections[productId.toLowerCase()]
    ?? technologySectionLabels[section?.toLowerCase() ?? '']
    ?? section
    ?? 'Other';
}

export function makeTechnologiesNavDropdown(items: readonly (NavDropdownItem & { section?: string })[]): NavDropdown {
  const grouped = new Map<string, NavDropdownItem[]>();
  for (const item of items) {
    const section = technologySectionLabels[item.section ?? ''] ?? item.section ?? 'Other';
    const { section: _section, ...navItem } = item;
    const current = grouped.get(section) ?? [];
    current.push(navItem);
    grouped.set(section, current);
  }

  for (const items of grouped.values()) {
    items.sort((a, b) => (technologyNavProductOrder[a.title] ?? 50) - (technologyNavProductOrder[b.title] ?? 50));
  }

  const sections = [
    ...technologiesNavSectionOrder,
    ...[...grouped.keys()].filter((heading) => !technologiesNavSectionOrder.includes(heading as typeof technologiesNavSectionOrder[number])),
  ]
    .filter((heading) => grouped.has(heading))
    .map((heading) => ({ heading, items: grouped.get(heading)! }));

  return { label: 'Technologies', sections, sidePanel: technologiesNavSidePanel };
}

/**
 * The Platform dropdown, in the repo.
 *
 * The platform menu is part of the site shell and is deliberately code-owned.
 */
export const platformNavDropdown: NavDropdown = {
  label: 'Platform',
  sections: [
    {
      heading: 'Platform',
      items: [
        {
          title: 'Commons',
          description: 'The identity layer every app signs in with',
          href: '/commons',
          image: '/images/apps/commons-app.png',
        },
        { title: 'Oxy AI', description: 'Private models, API and SDKs', href: '/ai', image: '/images/apps/oxy-ai.svg' },
        {
          title: 'Bloom',
          description: 'The design system behind every app',
          href: '/developers/docs/bloom/playground',
          image: '/images/apps/bloom.png',
        },
      ],
    },
  ],
  sidePanel: {
    heading: 'Get started',
    links: [
      { label: 'Academy', href: '/academy' },
      { label: 'Help center', href: '/help' },
      { label: 'Partner programs', href: '/partners' },
    ],
  },
}

/** Promo card injected into the `Platform` dropdown. */
export const platformNavCard: NavDropdownCard = {
  href: '/apps',
  image: '/images/nav-ecosystem-card.webp',
  title: 'One account, every app',
  description: 'Sign in once and carry the same identity across everything Oxy builds',
  alt: 'The Oxy ecosystem',
}

export const resourcesNavCard: NavDropdownCard = {
  href: '/academy',
  image: '/images/nav-resources-card.jpg',
  title: 'Start with the Academy',
  description: 'Short courses on Oxy ID, building on the platform and running it yourself',
  alt: 'Oxy Academy',
}

export const resourcesBloomCard: NavDropdownCard = {
  href: '/developers/docs/bloom/playground',
  image: '/images/nav-bloom-ui.webp',
  title: 'Bloom UI',
  description: 'The open design system behind the Oxy ecosystem',
  alt: 'Bloom UI design system',
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

/**
 * The public footer is part of the website shell, so its structure is owned
 * by the source code rather than by the CMS. Keep the legacy-compatible shape
 * so product-specific footer variants can still override these columns.
 */
export const defaultFooterColumns: FooterColumn[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Commons', href: '/commons' },
      { label: 'Oxy AI', href: '/ai' },
      { label: 'Bloom UI', href: '/developers/docs/bloom/playground' },
      { label: 'All apps', href: '/apps' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '/company' },
      { label: 'How Our Business Works', href: '/company/business' },
      { label: 'Careers', href: '/company/careers' },
      { label: 'Transparency Center', href: '/company/transparency' },
      { label: 'Manifesto', href: '/company/manifesto' },
      { label: 'Founding Charter', href: '/company/charter' },
      { label: 'The Initiative', href: '/initiative' },
      { label: 'Partner programs', href: '/partners' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Newsroom', href: '/newsroom' },
      { label: 'Engineering blog', href: '/company/news' },
      { label: 'Feature board', href: '/features' },
      { label: 'Help center', href: '/help' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation', href: '/developers/docs' },
      { label: 'API reference', href: '/developers/docs/api' },
      { label: 'Academy', href: '/academy' },
      { label: 'Bloom playground', href: '/developers/docs/bloom/playground' },
      { label: 'Open source', href: 'https://github.com/OxyHQ', isExternal: true },
    ],
  },
  {
    title: 'Apps',
    links: [
      { label: 'OxyOS', href: '/os' },
      { label: 'Mention', href: '/mention' },
      { label: 'Inbox', href: '/inbox' },
      { label: 'Noted', href: 'https://noted.oxy.so', isExternal: true },
      { label: 'Alia', href: 'https://alia.onl/', isExternal: true },
      { label: 'Astro', href: '/astro' },
      { label: 'Allo', href: 'https://allo.oxy.so/', isExternal: true },
      { label: 'FairCoin', href: 'https://fairco.in', isExternal: true },
      { label: 'FAIRWallet', href: 'https://fairco.in/wallet', isExternal: true },
      { label: 'Marketplace', href: '/mercaria' },
      { label: 'Wholesale by Mercaria', href: 'https://dashboard.mercaria.co', isExternal: true },
      { label: 'Homiio', href: '/homiio' },
      { label: 'TNP', href: '/tnp' },
      { label: 'Oxy Pay', href: '/pay' },
    ],
  },
]

export const simpleNavLinks: NavItem[] = [
  { label: 'Newsroom', href: '/newsroom' },
]

// Hero
export const hero = {
  title: 'Discover Oxy.',
  subtitle: 'Open-source tools for a better future.',
  description:
    'Oxy is an ethical technology ecosystem built on open-source principles. From social connection to AI assistance, Oxy provides privacy-first tools that respect your data, empower communities, and put people before profit.',
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
    label: 'Open source partners',
    title: 'Open source partners.',
    description:
      'Build and maintain open-source projects that extend the Oxy ecosystem — from SDKs and integrations to forks and self-hosted deployments.',
    ctaText: 'Become an open source partner',
    ctaHref: '#become-a-partner',
  },
  {
    number: '02',
    label: 'Community partners',
    title: 'Community partners.',
    description:
      'Grow vibrant communities on top of the Oxy stack and help us champion ethical, privacy-first technology around the world.',
    ctaText: 'Become a community partner',
    ctaHref: '#become-a-partner',
  },
  {
    number: '03',
    label: 'Education partners',
    title: 'Education partners.',
    description:
      'Bring open-source tools, digital literacy, and the Oxy ecosystem into classrooms, workshops, and university programs.',
    ctaText: 'Become an education partner',
    ctaHref: '#become-a-partner',
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
