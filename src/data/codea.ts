export interface CodeaFeature {
  title: string
  description: string
  cta: string
  ctaHref: string
  /** 'left' = text on left, media on right (default). 'right' = text on right, media on left */
  layout?: 'left' | 'right'
}

export const heroTitle = 'The open-source AI code editor that runs anywhere — in your browser, on your machine, on your terms.'

export const logoCompanies: string[] = []

export const features: CodeaFeature[] = [
  {
    title: 'AI-powered editing, built in',
    description: 'Codea pairs you with an AI assistant that understands your project context, suggests completions, and helps you refactor — all without leaving the editor.',
    cta: 'See how AI editing works \u2192',
    ctaHref: '/developers/docs/codea',
    layout: 'left',
  },
  {
    title: 'Code from any browser',
    description: 'No downloads, no installs. Open Codea in your browser and start writing code instantly with a full-featured editing experience backed by the cloud.',
    cta: 'Try Codea in your browser \u2192',
    ctaHref: '/developers/docs/codea',
    layout: 'left',
  },
  {
    title: 'Open source, open development',
    description: 'Codea is fully open source. Inspect the code, contribute features, run it on your own infrastructure, or extend it with plugins — the editor is yours.',
    cta: 'View the source on GitHub \u2192',
    ctaHref: 'https://github.com/OxyHQ/Codea',
    layout: 'right',
  },
]

export interface Testimonial {
  quote: string
  author: string
  role: string
  hidden?: boolean // hidden on mobile, shown md+
}

export const testimonials: Testimonial[] = []

export interface FrontierCard {
  title: string
  description: string
  cta: string
  ctaHref: string
  external?: boolean
}

export const frontierCards: FrontierCard[] = [
  {
    title: 'Open source from day one',
    description: 'Codea is built in the open. Read every line of code, audit the AI integration, self-host on your own servers, and contribute back to the project.',
    cta: 'View on GitHub',
    ctaHref: 'https://github.com/OxyHQ/Codea',
    external: true,
  },
  {
    title: 'Browser-native development',
    description: 'Get a full development environment in any modern browser — with file management, terminal access, and real-time collaboration, no setup required.',
    cta: 'Learn more',
    ctaHref: '/developers/docs/codea',
  },
  {
    title: 'AI that fits your workflow',
    description: 'Inline completions, chat-driven refactors, and context-aware suggestions that adapt to your codebase. Use the AI when it helps, ignore it when it doesn\u2019t.',
    cta: 'Explore AI features',
    ctaHref: '/developers/docs/codea',
  },
]

export interface ChangelogEntry {
  date: string
  title: string
  href: string
}

export const changelogEntries: ChangelogEntry[] = []

export interface HighlightArticle {
  title: string
  description: string
  category: string
  date: string
  href: string
}

export const highlights: HighlightArticle[] = []

export const pressQuotes: { quote: string; source: string }[] = []

export interface FooterColumn {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Codea Editor', href: '/developers/docs/codea' },
      { label: 'Oxy Platform', href: '/developers/docs' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/developers/docs' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Help', href: '/help' },
      { label: 'GitHub', href: 'https://github.com/OxyHQ', external: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'GitHub', href: 'https://github.com/OxyHQ', external: true },
      { label: 'X', href: 'https://x.com/OxyHQ', external: true },
    ],
  },
]
