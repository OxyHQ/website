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

export interface FooterColumn {
  title: string
  links: NavItem[]
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
      { label: 'Ask Oxy', href: '#' },
      { label: 'AI Features', href: '#' },
      { label: 'Data & Syncing', href: '#' },
      { label: 'Automations', href: '#' },
      { label: 'Reporting', href: '#' },
      { label: 'Collaboration', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Press', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Academy', href: '#' },
      { label: 'Developer Docs', href: '#' },
      { label: 'Partners', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'GDPR', href: '#' },
    ],
  },
]
