export interface CodeaFeature {
  title: string
  description: string
  cta: string
  ctaHref: string
  /** 'left' = text on left, media on right (default). 'right' = text on right, media on left */
  layout?: 'left' | 'right'
}

export const heroTitle = 'Built to make you extraordinarily productive, Codea is the best way to code with AI.'

export const logoCompanies = [
  'Stripe', 'OpenAI', 'Linear', 'Datadog', 'Nvidia', 'Figma', 'Ramp', 'Adobe'
]

export const features: CodeaFeature[] = [
  {
    title: 'Agents turn ideas into code',
    description: 'Accelerate development by handing off tasks to Codea, while you focus on making decisions.',
    cta: 'Learn about agentic development \u2192',
    ctaHref: '#',
    layout: 'left',
  },
  {
    title: 'In every tool, at every step',
    description: 'Codea reviews your PRs in GitHub, collaborates in Slack, and runs in your terminal.',
    cta: 'Learn about Codea\u2019s surfaces \u2192',
    ctaHref: '#',
    layout: 'left',
  },
  {
    title: 'Magically accurate autocomplete',
    description: 'Our specialized Tab model predicts your next action with striking speed and precision.',
    cta: 'Learn about Tab \u2192',
    ctaHref: '#',
    layout: 'right',
  },
]

export interface Testimonial {
  quote: string
  author: string
  role: string
  hidden?: boolean // hidden on mobile, shown md+
}

export const testimonials: Testimonial[] = [
  {
    quote: '"It was night and day from one batch to another, adoption went from single digits to over 80%. It just spread like wildfire, all the best builders were using Codea."',
    author: 'Diana Hu',
    role: 'General Partner, Y Combinator',
  },
  {
    quote: '"My favorite enterprise AI service is Codea. Every one of our engineers, some 40,000, are now assisted by AI and our productivity has gone up incredibly."',
    author: 'Jensen Huang',
    role: 'President & CEO, NVIDIA',
  },
  {
    quote: '"The best LLM applications have an autonomy slider: you control how much independence to give the AI. In Codea, you can do Tab completion, Cmd+K for targeted edits, or you can let it rip with the full autonomy agentic version."',
    author: 'Andrej Karpathy',
    role: 'CEO, Eureka Labs',
  },
  {
    quote: '"Codea quickly grew from hundreds to thousands of extremely enthusiastic engineers. We spend more on R&D and software creation than any other undertaking, and there\'s significant economic outcomes when making that process more efficient."',
    author: 'Patrick Collison',
    role: 'Co-Founder & CEO, Stripe',
    hidden: true,
  },
  {
    quote: '"The most useful AI tool that I currently pay for, hands down, is Codea. It\'s fast, autocompletes when and where you need it to, handles brackets properly, sensible keyboard shortcuts... everything is well put together."',
    author: 'shadcn',
    role: 'Creator of shadcn/ui',
    hidden: true,
  },
  {
    quote: '"It\'s definitely becoming more fun to be a programmer. We are at the 1% of what\'s possible, and it\'s in interactive experiences like Codea where frontier models shine brightest."',
    author: 'Greg Brockman',
    role: 'President, OpenAI',
    hidden: true,
  },
]

export interface FrontierCard {
  title: string
  description: string
  cta: string
  ctaHref: string
  external?: boolean
}

export const frontierCards: FrontierCard[] = [
  {
    title: 'Use the best model for every task',
    description: 'Choose between every cutting-edge model from OpenAI, Anthropic, Gemini, xAI, and Codea.',
    cta: 'Explore models',
    ctaHref: '#',
    external: true,
  },
  {
    title: 'Complete codebase understanding',
    description: 'Codea learns how your codebase works, no matter the scale or complexity.',
    cta: 'Learn about codebase indexing',
    ctaHref: '#',
    external: true,
  },
  {
    title: 'Develop enduring software',
    description: 'Trusted by over half of the Fortune 500 to accelerate development, securely and at scale.',
    cta: 'Explore enterprise',
    ctaHref: '#',
  },
]

export interface ChangelogEntry {
  date: string
  title: string
  href: string
}

export const changelogEntries: ChangelogEntry[] = [
  { date: 'Mar 19, 2026', title: 'Composer 2', href: '#' },
  { date: 'Mar 11, 2026', title: 'New Plugins on the Codea Marketplace', href: '#' },
  { date: 'Mar 5, 2026', title: 'Automations', href: '#' },
  { date: 'Mar 4, 2026', title: 'Codea in JetBrains IDEs', href: '#' },
]

export interface HighlightArticle {
  title: string
  description: string
  category: string
  date: string
  href: string
}

export const highlights: HighlightArticle[] = [
  {
    title: 'Towards self-driving codebases',
    description: 'We\u2019re making a part of our multi-agent research harness available to try today in preview.',
    category: 'Research',
    date: 'Feb 5, 2026',
    href: '#',
  },
  {
    title: 'Salesforce ships higher-quality code across 20,000 developers with Codea',
    description: 'Over 90% of developers at Salesforce now use Codea, driving double-digit improvements in cycle time, PR velocity, and code quality.',
    category: 'Customers',
    date: 'Jan 21, 2026',
    href: '#',
  },
  {
    title: 'Best practices for coding with agents',
    description: 'A comprehensive guide to working with coding agents, from starting with plans to managing context, customizing workflows, and reviewing code.',
    category: 'Product',
    date: 'Jan 9, 2026',
    href: '#',
  },
]

export const pressQuotes = [
  { quote: 'Codea is the future of programming.', source: 'TechCrunch' },
  { quote: 'The AI code editor everyone is talking about.', source: 'The Verge' },
  { quote: 'A leap forward in developer productivity.', source: 'Wired' },
]

export interface FooterColumn {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Agents', href: '#' },
      { label: 'Enterprise', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Code Review', href: '#' },
      { label: 'Tab', href: '#' },
      { label: 'CLI', href: '#' },
      { label: 'Cloud Agents', href: '#' },
      { label: 'Marketplace', href: '#', external: true },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Download', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Docs', href: '#' },
      { label: 'Learn', href: '#', external: true },
      { label: 'Forum', href: '#', external: true },
      { label: 'Help', href: '#', external: true },
      { label: 'Workshops', href: '#' },
      { label: 'Status', href: '#', external: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Students', href: '#' },
      { label: 'Brand', href: '#' },
      { label: 'Future', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Data Use', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'X', href: '#', external: true },
      { label: 'LinkedIn', href: '#', external: true },
      { label: 'YouTube', href: '#', external: true },
    ],
  },
]
