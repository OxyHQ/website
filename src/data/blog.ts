export interface BlogArticle {
  slug: string
  title: string
  excerpt: string
  category: string // 'Product' | 'Company' | 'Guides' | 'Inside Oxy' | 'Perspectives'
  date: string // e.g. "Feb '26"
  author: string
  authorRole: string
  readTime?: string
  featured?: boolean
}

export const featuredArticle: BlogArticle = {
  slug: 'introducing-ask-oxy',
  title: 'Introducing Ask Oxy',
  excerpt: 'Ask Oxy is a new way to work with your CRM. Powered by Universal Context, it deeply understands your business.',
  category: 'Product',
  date: "Feb '26",
  author: 'Jeremy Lee',
  authorRole: 'Product Marketing',
  readTime: '4 min read',
  featured: true,
}

export const gridArticles: BlogArticle[] = [
  {
    slug: 'permissions-in-oxy',
    title: 'Permissions in Oxy',
    excerpt: 'Introducing a new permissions system in Oxy, with object controls, team-based access, and cascading overrides.',
    category: 'Product',
    date: "Feb '26",
    author: 'Abby Uy',
    authorRole: 'Product Marketing',
  },
  {
    slug: 'meet-the-oxy-developer-platform',
    title: 'Meet the Oxy Developer Platform',
    excerpt: 'Oxy is now the first AI-native CRM with a platform anyone can build on.',
    category: 'Product',
    date: "Nov '25",
    author: 'Alexander Christie',
    authorRole: 'CTO & Co-founder',
  },
  {
    slug: 'oxy-raises-52m-series-b',
    title: 'Oxy raises $52m Series B',
    excerpt: "We're building the new foundation of CRM that lets every team build on their own terms.",
    category: 'Company',
    date: "Aug '25",
    author: 'Nicolas Sharp',
    authorRole: 'CEO & Co-founder',
  },
]

export interface BlogCategory {
  label: string
  count: number
}

export const blogCategories: BlogCategory[] = [
  { label: 'All articles', count: 31 },
  { label: 'Company', count: 4 },
  { label: 'Guides', count: 9 },
  { label: 'Inside Oxy', count: 2 },
  { label: 'Perspectives', count: 3 },
  { label: 'Product', count: 13 },
]

// All articles for the list view
export const allArticles: BlogArticle[] = [
  { slug: 'permissions-in-oxy', title: 'Permissions in Oxy', excerpt: 'Introducing a new permissions system with object controls, team-based access, and cascading overrides.', category: 'Product', date: "Feb '26", author: 'Abby Uy', authorRole: 'Product Marketing' },
  { slug: 'introducing-ask-oxy', title: 'Introducing Ask Oxy', excerpt: 'Ask Oxy is a new way to work with your CRM. Powered by Universal Context.', category: 'Product', date: "Feb '26", author: 'Jeremy Lee', authorRole: 'Product Marketing' },
  { slug: 'meet-the-oxy-developer-platform', title: 'Meet the Oxy Developer Platform', excerpt: 'The first AI-native CRM with a platform anyone can build on.', category: 'Product', date: "Nov '25", author: 'Alexander Christie', authorRole: 'CTO & Co-founder' },
  { slug: 'automations-deep-dive', title: 'Automations deep dive', excerpt: 'Build complex workflows that automate your entire GTM process.', category: 'Product', date: "Oct '25", author: 'Sarah Kim', authorRole: 'Product' },
  { slug: 'we-held-our-first-hackathon', title: 'We held our first hackathon', excerpt: 'We handed developers our App SDK for a weekend for the chance to win $10K. Here\'s how it went.', category: 'Inside Oxy', date: "Sep '25", author: 'Team Oxy', authorRole: 'Engineering' },
  { slug: 'oxy-raises-52m-series-b', title: 'Oxy raises $52m Series B', excerpt: "Building the new foundation of CRM.", category: 'Company', date: "Aug '25", author: 'Nicolas Sharp', authorRole: 'CEO & Co-founder' },
  { slug: 'data-model-explained', title: 'The Oxy data model explained', excerpt: 'How our adaptive data model works and why it matters.', category: 'Guides', date: "Jul '25", author: 'Mike Chen', authorRole: 'Solutions' },
  { slug: 'crm-buying-guide', title: 'The CRM buying guide for 2025', excerpt: 'Everything you need to know about choosing a CRM.', category: 'Perspectives', date: "Jun '25", author: 'Emily Rodriguez', authorRole: 'Content' },
  { slug: 'inside-our-engineering', title: 'Inside our engineering culture', excerpt: 'How we ship fast while maintaining quality.', category: 'Inside Oxy', date: "May '25", author: 'Alexander Christie', authorRole: 'CTO & Co-founder' },
  { slug: 'reporting-best-practices', title: 'Reporting best practices', excerpt: 'Get the most out of your CRM data with advanced reporting.', category: 'Guides', date: "Apr '25", author: 'Jordan Park', authorRole: 'Customer Success' },
  { slug: 'introducing-call-intelligence', title: 'Introducing Call Intelligence', excerpt: 'Your CRM now captures, understands, and surfaces insights from every live conversation.', category: 'Product', date: "Apr '25", author: 'Sarah Kim', authorRole: 'Product' },
  { slug: 'email-sync-guide', title: 'Complete guide to email sync', excerpt: 'Set up bi-directional email sync in minutes.', category: 'Guides', date: "Mar '25", author: 'Sarah Kim', authorRole: 'Product' },
  { slug: 'introducing-ai-attributes', title: 'Introducing AI Attributes', excerpt: "AI Attributes brings Oxy's powerful AI agents directly into your lists, views and record pages.", category: 'Product', date: "Feb '25", author: 'Jeremy Lee', authorRole: 'Product Marketing' },
  { slug: 'how-we-chose-the-name-oxy', title: 'How we chose the name Oxy', excerpt: "Your brand name, and by extension your domain, is the heartbeat of your company. Here's the story behind how we chose the name Oxy.", category: 'Inside Oxy', date: "Feb '25", author: 'Nicolas Sharp', authorRole: 'CEO & Co-founder' },
  { slug: 'introducing-oxy-sequences', title: 'Introducing Oxy Sequences', excerpt: 'Our new email sequencing tool lets you create intelligent email sequences that respond to real prospect moments and signals.', category: 'Product', date: "Nov '24", author: 'Abby Uy', authorRole: 'Product Marketing' },
  { slug: 'oxy-raises-33-million', title: 'Oxy raises $33 million in funding', excerpt: "We're accelerating our mission of building the definitive CRM for the next generation.", category: 'Company', date: "Aug '24", author: 'Nicolas Sharp', authorRole: 'CEO & Co-founder' },
  { slug: 'introducing-ai-research-agent', title: "Introducing Oxy's AI-powered research agent", excerpt: "We've just shipped a new AI-powered research agent that can research anything on the web right inside of Oxy.", category: 'Product', date: "Aug '24", author: 'Alexander Christie', authorRole: 'CTO & Co-founder' },
  { slug: 'ai-and-next-gen-crm', title: 'AI and the next generation of CRM', excerpt: "We're going to usher CRM into the AI era, and it will represent a monumental shift for the category.", category: 'Perspectives', date: "Jul '24", author: 'Nicolas Sharp', authorRole: 'CEO & Co-founder' },
]
