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
}

export interface NavDropdownSection {
  heading: string
  items: NavDropdownItem[]
}

export interface NavSidePanel {
  heading: string
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
  isNew?: boolean
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

// Navigation — Dropdowns
export const platformDropdown: NavDropdown = {
  label: 'Platform',
  sections: [
    {
      heading: 'CRM Platform',
      items: [
        { title: 'Ask Oxy', description: 'Search and create with AI', href: '#' },
        { title: 'AI', description: 'Native to your CRM', href: '#' },
        { title: 'Data model', description: 'Sync and enrich your data', href: '#' },
        { title: 'Productivity & collaboration', description: 'Context for your team operations', href: '#' },
      ],
    },
    {
      heading: 'Automations',
      items: [
        { title: 'Workflows', description: 'Automate any process', href: '#' },
        { title: 'Sequences', description: 'Personalized outreach', href: '#' },
      ],
    },
    {
      heading: 'Insights',
      items: [
        { title: 'Call Intelligence', description: 'Record and analyze meetings', href: '#' },
        { title: 'Reporting', description: 'Insights in real time', href: '#' },
      ],
    },
    {
      heading: 'Ecosystem',
      items: [
        { title: 'Developer Platform', description: 'Build on Oxy', href: '#' },
        { title: 'Apps', description: 'Extend with integrations', href: '#' },
      ],
    },
  ],
  sidePanel: {
    heading: 'Get started',
    links: [
      { label: 'Oxy 101', href: '#' },
      { label: 'Hire an expert', href: '#' },
      { label: 'Startup program', href: '#' },
      { label: 'Talk to sales', href: '#' },
    ],
  },
}

export const resourcesDropdown: NavDropdown = {
  label: 'Resources',
  sections: [
    {
      heading: 'Support',
      items: [
        { title: 'Help center', description: "Learn more about Oxy's features", href: '#' },
        { title: 'Academy', description: 'Essential Oxy features explained', href: '#' },
      ],
    },
    {
      heading: 'Developers',
      items: [
        { title: 'Developer docs', description: 'Start building Oxy apps', href: '#' },
      ],
    },
    {
      heading: 'Partners',
      items: [
        { title: 'Partner programs', description: 'Developers, creators, consultants', href: '#' },
      ],
    },
  ],
  sidePanel: {
    heading: 'Company',
    links: [
      { label: 'Changelog', href: '#' },
      { label: 'Announcements', href: '#' },
      { label: 'Engineering blog', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
}

export const simpleNavLinks: NavItem[] = [
  { label: 'Customers', href: '#' },
  { label: 'Pricing', href: '#pricing' },
]

// Hero
export const hero = {
  title: 'Ask Oxy.',
  subtitle: 'Search, update, and create with AI.',
  description:
    'Search, update, and create across your entire CRM just by asking. Powered by Universal Context — a unified intelligence layer native to Oxy — Ask Oxy deeply understands your business and gives you what you need the moment you ask.',
}

// Testimonials
export const testimonials: Testimonial[] = [
  {
    quote:
      'Before every meeting, Ask Oxy centralizes, summarizes, and surfaces everything I need to know to give a great first impression or close the deal.',
    name: 'Sarah Chen',
    role: 'VP of Sales',
    company: 'Runway',
  },
  {
    quote:
      'Oxy is the first CRM that feels truly modern. It\'s powerful, flexible, and fast to build with. There\'s nothing like it on the market.',
    name: 'Marcus Rodriguez',
    role: 'Head of Revenue',
    company: 'Vercel',
  },
  {
    quote:
      'Oxy is now a permanent part of my Go-To-Market playbook. It\'s like Notion for Sales.',
    name: 'Emily Park',
    role: 'CEO',
    company: 'Beam',
  },
  {
    quote:
      'Ask Oxy has become an indispensable tool for our sales leadership team, giving us incredible execution power and speed to insight.',
    name: 'David Kim',
    role: 'CRO',
    company: 'Scale',
  },
  {
    quote:
      'As a fast growing startup, our GTM motion is constantly evolving. Ask Oxy has enabled us to answer important questions, fast.',
    name: 'Priya Sharma',
    role: 'Head of Ops',
    company: 'Ramp',
  },
]

// Universal Context
export const universalContext = {
  title: 'Universal Context',
  trademark: true,
  subtitle: 'The Intelligence Layer Behind Ask Oxy',
  points: [
    'Semantically indexes everything in your CRM as one interconnected whole',
    'Unifies records, emails, calls, notes, product data, warehouse syncs, connected tools, and web search',
    'Understands each customer relationship as a whole — not as separate data sources',
    'Enables multi-language querying: ask in one language, get answers from content in another',
    'Powers every Ask Oxy response with genuine, deep business context',
  ],
}

// Capabilities
export const capabilities: Capability[] = [
  {
    title: 'Search, Update & Create',
    description:
      'Ask natural language questions and get instant, accurate answers from your CRM.',
    features: [
      'Ask natural language questions and get instant, accurate answers from your CRM',
      'Create and update records, tasks, and deals through conversation',
      'Draft emails and follow-ups on demand',
      'Run deep web research on any company to capture key information',
      'Surface pain points, requested features, and emerging patterns from thousands of interactions in seconds',
    ],
  },
  {
    title: 'Meeting Intelligence',
    description:
      'Get a daily briefing of your meetings and what you need to know.',
    features: [
      'Get a daily briefing of your meetings and what you need to know',
      'Prepare comprehensive account briefs before any call: full account research, conversation history, recent touchpoints, and suggested talking points',
      'Cut meeting prep to seconds — no more hunting through emails or notes',
      'Arrive at every meeting with full context and suggested talking points',
    ],
  },
  {
    title: 'Call Intelligence',
    description:
      'Every call is automatically recorded, transcribed, and synced to your CRM in real time.',
    features: [
      'Every call is automatically recorded, transcribed, and synced to your CRM in real time',
      'AI picks up buying signals, blockers, and feature requests during the call — not days later',
      'Instantly summarize calls and extract key moments',
      'Surface insights from thousands of recorded conversations in seconds',
    ],
  },
  {
    title: 'Post-Call Automation',
    description:
      'Draft personalized follow-up emails immediately after a call ends.',
    features: [
      'Draft personalized follow-up emails immediately after a call ends',
      'Update deal records and pipeline stages automatically based on call content',
      'Create next steps and tasks without manual data entry',
      'Build transition briefs for handoffs between AEs and CSMs',
    ],
  },
]

// Use Cases
export const useCases: UseCase[] = [
  {
    role: 'Sales',
    items: [
      'Prepare for every call with a full account brief in under 30 seconds',
      'Surface objections and prepare targeted responses before a meeting',
      'Automatically update deal records based on recorded calls',
      'Find customers who requested a specific feature and draft individualized outreach',
    ],
  },
  {
    role: 'Customer Success',
    items: [
      'Arrive at onboarding and QBRs with full context on account health and history',
      'Identify early signs of expansion opportunity or churn risk',
      'Create transition briefs from prior conversations, sales context, and product usage',
      'Summarize product engagement and usage trends for any account',
    ],
  },
  {
    role: 'Revenue Operations',
    items: [
      'Surface pipeline insights and emerging patterns across your entire customer base',
      'Extract product feedback from call recordings at scale',
      'Get instant answers across your full CRM data without writing queries',
    ],
  },
]

// Prompt Library
export const prompts: Prompt[] = [
  { text: 'Extract product feedback from a call recording' },
  { text: 'Prepare targeted responses to anticipated objections before your next call' },
  { text: 'Draft a follow-up email to keep the conversation rolling after a meeting' },
  { text: 'Find customers who requested a specific feature and draft individualized emails' },
  { text: 'Automatically update a deal record based on a recorded call' },
  { text: 'Summarize product engagement and usage trends for a workspace' },
]

// Privacy
export const privacyPoints: PrivacyPoint[] = [
  { text: 'Every answer is sourced from your actual CRM records and customer knowledge' },
  { text: 'Ask Oxy respects your existing workspace permissions — everyone sees only what they\'re supposed to' },
  { text: 'You are always in command and empowered to approve, modify, or reject any suggestion' },
  { text: 'Customer data is never used to train any AI models' },
  { text: 'Ask Oxy conversations are private to you and not visible to other workspace members' },
]

// Pricing
export const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    credits: '500',
    creditLabel: 'credits per seat / month',
  },
  {
    name: 'Pro',
    credits: '1,000',
    creditLabel: 'credits per seat / month',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    credits: '2,500',
    creditLabel: 'credits per seat / month',
  },
]

// Footer
export const footerColumns: FooterColumn[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Refer a team', href: '#', isNew: true },
      { label: 'Changelog', href: '#' },
      { label: 'Gmail extension', href: '#', isExternal: true },
      { label: 'iOS app', href: '#', isExternal: true },
      { label: 'Android app', href: '#', isExternal: true },
      { label: 'Security', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Customers', href: '#' },
      { label: 'Announcements', href: '#' },
      { label: 'Engineering blog', href: '#', isNew: true },
      { label: 'Careers', href: '#' },
      { label: 'Manifesto', href: '#' },
      { label: 'Become a partner', href: '#' },
    ],
  },
  {
    title: 'Import from',
    links: [
      { label: 'Salesforce', href: '#' },
      { label: 'Hubspot', href: '#' },
      { label: 'Pipedrive', href: '#' },
      { label: 'Zoho', href: '#' },
      { label: 'Excel', href: '#' },
      { label: 'CSV', href: '#' },
    ],
  },
  {
    title: 'Oxy for',
    links: [
      { label: 'Startups', href: '#' },
      { label: 'Deal flow', href: '#' },
    ],
  },
  {
    title: 'Apps',
    links: [
      { label: 'Gmail', href: '#' },
      { label: 'Outlook', href: '#' },
      { label: 'Segment', href: '#' },
      { label: 'Mailchimp', href: '#' },
      { label: 'Slack', href: '#' },
      { label: 'Outreach', href: '#' },
      { label: 'Mixmax', href: '#' },
      { label: 'Typeform', href: '#' },
      { label: 'Zapier', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Startup program', href: '#' },
      { label: 'Help center', href: '#' },
      { label: 'Automation templates', href: '#' },
      { label: 'Developers', href: '#', isExternal: true },
      { label: 'System status', href: '#', isExternal: true },
      { label: 'Hire an expert', href: '#' },
      { label: 'Downloads', href: '#' },
    ],
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
    label: 'App partners',
    title: 'App partners.',
    description: 'Build apps that power the next era of CRM.',
    ctaText: 'Become an App Partner',
    ctaHref: '#',
  },
  {
    number: '02',
    label: 'Creator partners',
    title: 'Creator partners.',
    description: 'Build your brand, grow your audience.',
    ctaText: 'Become a Creator Partner',
    ctaHref: '#',
  },
  {
    number: '03',
    label: 'Expert partners',
    title: 'Expert partners.',
    description: 'Help GTM teams build, scale and grow.',
    ctaText: 'Become an Expert Partner',
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

export const partnerTestimonials: PartnerTestimonial[] = [
  {
    name: 'Alejandra Ruiz',
    role: 'Co-founder & CEO, Sequence',
    partnerType: 'App Partners',
    image: '/partners/alejandra.avif',
    quote:
      'The developer platform makes it incredibly easy to build integrations that our customers love. The API is well-designed and the docs are excellent.',
    favoriteFeatures: ['Developer Platform', 'REST API', 'Webhooks'],
  },
  {
    name: 'Desiree Chen',
    role: 'Founder, 80x',
    partnerType: 'Creator Partners',
    image: '/partners/desiree.avif',
    quote:
      'Creating content around Oxy has been a natural fit. The product is so well-built that the stories practically write themselves.',
    favoriteFeatures: ['Reporting', 'Workflows', 'Data model'],
  },
  {
    name: 'Ton Caranese',
    role: 'Co-founder, novlini',
    partnerType: 'Expert Partners',
    image: '/partners/ton.avif',
    quote:
      'Oxy connects me with teams that value speed, structure, and scale. Building flexible, high-impact systems on such a powerful product is a pleasure.',
    favoriteFeatures: ['Email & calendar sync', 'API', 'Mobile app'],
  },
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
    href: '#',
    iconType: 'linkedin',
  },
  {
    title: 'X',
    description: 'Stay in the loop with what we\'re working on.',
    href: '#',
    iconType: 'x',
  },
  {
    title: 'Blog',
    description: 'Be the first to get new Oxy updates.',
    href: '#',
    iconType: 'blog',
  },
  {
    title: 'Changelog',
    description: 'Stay on top of all releases and new features.',
    href: '#',
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
    role: 'Sales',
    panels: [
      { title: 'Win faster when every call is perfectly prepped.', description: 'Prepare for meetings, update deals, and review pipeline.', mockupType: 'chat' },
      { title: 'Close deals with AI-powered follow-ups.', description: 'Draft emails, update records, and create tasks automatically.', mockupType: 'pipeline' },
    ],
  },
  {
    role: 'Customer Success',
    panels: [
      { title: 'Know every account inside and out.', description: 'Full context on health, history, and expansion signals.', mockupType: 'meeting' },
      { title: 'Spot churn risk before it happens.', description: 'Surface patterns across engagement and usage data.', mockupType: 'call' },
    ],
  },
  {
    role: 'Marketing',
    panels: [
      { title: 'Turn signals into pipeline.', description: 'Identify and act on buying intent across your CRM.', mockupType: 'chat' },
    ],
  },
  {
    role: 'Founders',
    panels: [
      { title: 'Your CRM, your way.', description: 'Build workflows that match how you actually sell.', mockupType: 'pipeline' },
    ],
  },
  {
    role: 'Revenue Operations',
    panels: [
      { title: 'Pipeline intelligence at scale.', description: 'Surface insights and patterns across your entire customer base.', mockupType: 'meeting' },
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
  { title: 'Grounded in your context', subtitle: 'like emails, calls, and product usage.', iconType: 'database' },
  { title: 'Understand patterns', subtitle: 'across customer signals, not just individual flares.', iconType: 'brain' },
  { title: 'Semantic search', subtitle: 'that understands intent, not just keywords.', iconType: 'search' },
  { title: 'Multi-language support', subtitle: 'ask in one language, get answers from another.', iconType: 'globe' },
  { title: 'Respects permissions', subtitle: 'everyone sees only what they should.', iconType: 'shield' },
]

// Prompt Library Cards
export interface PromptLibraryCard {
  title: string
  description: string
  iconType: 'calendar' | 'briefcase' | 'phone' | 'mail' | 'chart' | 'sparkle' | 'search' | 'users'
}

export const promptLibraryCards: PromptLibraryCard[] = [
  { title: 'Daily brief', description: 'Prepare for your day with a daily briefing of your meetings.', iconType: 'calendar' },
  { title: 'Account brief', description: 'Get a full account brief before any call.', iconType: 'briefcase' },
  { title: 'Call Intelligence', description: 'Summarize calls and extract key moments.', iconType: 'phone' },
  { title: 'Draft follow-up', description: 'Draft a follow-up email after a meeting.', iconType: 'mail' },
  { title: 'Pipeline review', description: 'Surface pipeline insights and emerging patterns.', iconType: 'chart' },
  { title: 'Feature requests', description: 'Find customers who requested a specific feature.', iconType: 'sparkle' },
  { title: 'Web research', description: 'Run deep web research on any company.', iconType: 'search' },
  { title: 'Transition brief', description: 'Build transition briefs for handoffs between teams.', iconType: 'users' },
  { title: 'Objection prep', description: 'Prepare targeted responses to anticipated objections.', iconType: 'sparkle' },
  { title: 'Update deal', description: 'Update deal records based on recorded calls.', iconType: 'briefcase' },
  { title: 'Engagement trends', description: 'Summarize product engagement and usage trends.', iconType: 'chart' },
  { title: 'Churn signals', description: 'Identify early signs of expansion or churn risk.', iconType: 'search' },
]
