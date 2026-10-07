export interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
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
        href: '/transparency/manifesto',
        title: 'Manifesto',
        description: 'What we believe and what we refuse to trade away',
        image: '/images/apps/manifesto.svg',
      },
      {
        href: '/transparency/charter',
        title: 'Founding Charter',
        description: 'The commitments we intend to be held to as we grow',
        image: '/images/apps/founding-charter.svg',
      },
      {
        href: '/transparency/business',
        title: 'How our business works',
        description: 'Where the money comes from, and what we refuse to earn',
        image: '/images/apps/business.svg',
      },
      {
        href: '/transparency',
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
  { title: 'Inbox by Oxy', description: 'A calmer way to handle email', href: '/inbox', image: '/images/apps/inbox.png', logoColor: '#bf40ed', section: 'Tools' },
  { title: 'Noted', description: "Oxy's workspace for notes and ideas", href: 'https://noted.oxy.so', section: 'Tools' },
  { title: 'Nilo', description: 'Workspace for docs and databases', href: 'https://nilo.so', section: 'Tools' },
  { title: 'Alia', description: 'The Oxy assistant for people and teams', href: 'https://alia.onl/', image: '/images/apps/alia-dropdown.svg', logoColor: '#fab8ff', preserveImageColors: true, section: 'AI & Research' },
  { title: 'Clarity', description: 'AI-Powered search engine', href: '/clarity', image: '/images/apps/clarity.png', logoColor: '#664100', section: 'AI & Research' },
  { title: 'Astro Browser', description: 'A private browser for the open web', href: '/astro', image: '/images/apps/astro.svg', logoColor: '#009699', section: 'AI & Research' },
  { title: 'Kaana', description: 'Oxy\'s own inference provider', href: 'https://kaana.ai', image: '/images/apps/kaana.svg', preserveImageColors: true, section: 'AI & Research' },
  { title: 'Horizon', description: 'A clearer view of what matters', href: '/', section: 'Housing' },
  { title: 'FairCoin Explorer', description: 'Explore the FairCoin network', href: 'https://explorer.fairco.in', image: '/images/apps/faircoin-explorer.png', logoColor: '#185c00', section: 'Finance' },
  { title: 'Peable', description: 'Simple payments across Oxy', href: '/peable', section: 'Finance' },
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
  nilo: 'Tools',
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
  Nilo: 2,
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
    void _section;
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
 * The `AI` dropdown.
 *
 * A first-class top-level menu rather than one line inside `Platform`, because
 * Oxy AI is an umbrella over six things with six different states and one
 * `Oxy AI — Private models, API and SDKs` entry could describe none of them
 * correctly.
 *
 * Code-owned like the rest of the shell. The CMS `navigation` document can add
 * dropdowns of its own; this one is not among them, so a CMS edit cannot
 * produce a second AI menu beside it.
 */
export const aiNavDropdown: NavDropdown = {
  label: 'AI',
  sections: [
    {
      heading: 'Platform',
      items: [
        {
          title: 'Oxy Inference',
          description: 'One API for every model we are approved to serve',
          href: '/ai/inference',
        },
        {
          title: 'Models',
          description: 'The public catalogue, with policy and pricing per model',
          href: '/ai/models',
        },
        {
          title: 'Pricing',
          description: 'Per-model, per-unit inference pricing',
          href: '/ai/pricing',
        },
        {
          title: 'Documentation',
          description: 'Quickstarts, SDKs and the REST API',
          href: '/developers/docs',
        },
      ],
    },
    {
      heading: 'Infrastructure',
      items: [
        {
          title: 'Managed inference',
          description: 'Selected models served on infrastructure Oxy operates',
          href: '/ai/enterprise#managed',
        },
        {
          title: 'Dedicated inference',
          description: 'Private endpoints and reserved capacity',
          href: '/ai/enterprise#dedicated',
        },
        {
          title: 'Bring your own key',
          description: 'Keep your provider contract, use one integration',
          href: '/ai/enterprise#capabilities',
        },
        {
          title: 'Enterprise',
          description: 'Policy controls, invoicing and auditability',
          href: '/ai/enterprise',
        },
      ],
    },
    {
      heading: 'Products',
      items: [
        {
          title: 'Alia',
          description: 'The assistant for people and teams',
          href: 'https://alia.onl/',
        },
        {
          title: 'Codea',
          description: 'The coding and agent product',
          href: '/codea',
        },
        {
          title: 'Alia Models',
          description: 'In development — no release yet',
          href: '/ai#alia-models',
        },
      ],
    },
  ],
  sidePanel: {
    heading: 'Start here',
    links: [
      { label: 'Oxy AI overview', href: '/ai' },
      { label: 'Trust and data policy', href: '/ai/trust' },
      { label: 'Talk to sales', href: '/contact/sales' },
    ],
  },
}

/** Promo card injected into the `AI` dropdown. */
export const aiNavCard: NavDropdownCard = {
  href: '/ai/models',
  image: '/images/nav-ecosystem-card.webp',
  title: 'One API, every approved model',
  description: 'One credential and one bill for the whole catalogue',
  alt: 'The Oxy AI model catalogue',
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
        { title: 'Oxy AI', description: 'Models, inference and the products built on them', href: '/ai', image: '/images/apps/oxy-ai.svg' },
        {
          title: 'Bloom',
          description: 'The design system behind every app',
          href: '/bloom/',
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

export const resourcesNavCard: NavDropdownCard = {
  href: '/academy',
  image: '/images/nav-resources-card.jpg',
  title: 'Start with the Academy',
  description: 'Short courses on Oxy ID, building on the platform and running it yourself',
  alt: 'Oxy Academy',
}

export const resourcesBloomCard: NavDropdownCard = {
  href: '/bloom/',
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
      { label: 'Bloom UI', href: '/bloom/' },
      { label: 'All apps', href: '/apps' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'AI',
    links: [
      { label: 'Oxy AI', href: '/ai' },
      { label: 'Oxy Inference', href: '/ai/inference' },
      { label: 'Models', href: '/ai/models' },
      { label: 'Pricing', href: '/ai/pricing' },
      { label: 'For organizations', href: '/ai/enterprise' },
      { label: 'Trust and data policy', href: '/ai/trust' },
      { label: 'Alia', href: 'https://alia.onl/', isExternal: true },
      { label: 'Codea', href: '/codea' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '/company' },
      { label: 'For organizations', href: '/enterprise' },
      { label: 'How Our Business Works', href: '/transparency/business' },
      { label: 'Careers', href: '/company/careers' },
      { label: 'Transparency Center', href: '/transparency' },
      { label: 'Brand guidelines', href: '/brand' },
      { label: 'Manifesto', href: '/transparency/manifesto' },
      { label: 'Founding Charter', href: '/transparency/charter' },
      { label: 'Influence and Responsibility', href: '/transparency/influence/' },
      { label: 'The Initiative', href: '/initiative' },
      { label: 'Partner programs', href: '/partners' },
      { label: 'Startup program', href: '/partners#startup-program' },
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
      { label: 'Bloom components', href: '/developers/docs/bloom/components/' },
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
      { label: 'Kaana', href: 'https://kaana.ai', isExternal: true },
      { label: 'Astro', href: '/astro' },
      { label: 'Allo', href: 'https://allo.you/', isExternal: true },
      { label: 'FairCoin', href: 'https://fairco.in', isExternal: true },
      { label: 'FAIRWallet', href: 'https://fairco.in/wallet', isExternal: true },
      { label: 'Marketplace', href: '/mercaria' },
      { label: 'Wholesale by Mercaria', href: 'https://dashboard.mercaria.co', isExternal: true },
      { label: 'Homiio', href: '/homiio' },
      { label: 'TNP', href: '/tnp' },
      { label: 'Peable', href: '/peable' },
    ],
  },
]

export const simpleNavLinks: NavItem[] = [
  { label: 'Newsroom', href: '/newsroom' },
]

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
