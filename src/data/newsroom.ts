export interface NewsArticle {
  id: string
  slug: string
  title: string
  description: string
  category: string
  date: string
  imageUrl: string
}

export const newsCategories = [
  'Company',
  'Research',
  'Product',
  'Safety',
  'Engineering',
  'Security',
  'All',
] as const

export type NewsCategory = (typeof newsCategories)[number]

/* ─── Featured / hero article (left sticky, 4:5 aspect) ─── */
export const featuredArticle: NewsArticle = {
  id: 'f1',
  slug: 'introducing-oxy-enterprise',
  title: 'Introducing Oxy Enterprise',
  description:
    "Today we're launching Oxy Enterprise, our most powerful CRM offering built for large organizations with complex workflows and advanced security requirements.",
  category: 'Product',
  date: '2026-03-20',
  imageUrl:
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=1000&fit=crop',
}

/* ─── Sidebar cards (right column, 1:1 aspect) ─── */
export const sidebarArticles: NewsArticle[] = [
  {
    id: 's1',
    slug: 'series-b-funding',
    title: 'Oxy raises $120M Series B to redefine CRM with AI',
    description:
      "We're excited to announce our Series B funding round, led by top-tier investors who share our vision.",
    category: 'Company',
    date: '2026-03-17',
    imageUrl:
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=800&fit=crop',
  },
  {
    id: 's2',
    slug: 'ai-powered-lead-scoring',
    title: "How Oxy's AI-powered lead scoring works",
    description:
      'A deep dive into the machine learning models behind our intelligent lead scoring system.',
    category: 'Product',
    date: '2026-03-06',
    imageUrl:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=800&fit=crop',
  },
  {
    id: 's3',
    slug: 'responsible-ai-commitment',
    title: 'Our commitment to responsible AI in CRM',
    description:
      "Transparency, fairness, and privacy are at the core of how we build AI features.",
    category: 'Safety',
    date: '2026-02-27',
    imageUrl:
      'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&h=800&fit=crop',
  },
]

/* ─── Main article listing grid (1:1 aspect cards, 3 cols) ─── */
export const gridArticles: NewsArticle[] = [
  {
    id: 'g1',
    slug: 'oxy-ask-launch',
    title: 'Oxy Ask: your AI assistant for every deal',
    description:
      'Meet Ask — the AI assistant that lives inside your CRM.',
    category: 'Product',
    date: '2026-02-28',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=800&fit=crop',
  },
  {
    id: 'g2',
    slug: 'new-york-office',
    title: 'Oxy opens New York headquarters',
    description:
      'Our new NYC office marks an exciting milestone as we expand our team.',
    category: 'Company',
    date: '2026-02-27',
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=800&fit=crop',
  },
  {
    id: 'g3',
    slug: 'soc2-type2-certification',
    title: 'Oxy achieves SOC 2 Type II certification',
    description:
      'Reinforcing our commitment to enterprise-grade security.',
    category: 'Security',
    date: '2026-02-27',
    imageUrl:
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=800&fit=crop',
  },
  {
    id: 'g4',
    slug: 'data-privacy-framework',
    title: "Oxy's data privacy framework",
    description:
      "A look at the safeguards we've put in place to protect customer data.",
    category: 'Safety',
    date: '2026-02-27',
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&h=800&fit=crop',
  },
  {
    id: 'g5',
    slug: 'customer-milestone',
    title: 'Oxy reaches 10,000 customers worldwide',
    description:
      "A heartfelt thank you to the teams and companies who trust Oxy.",
    category: 'Company',
    date: '2026-02-24',
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=800&fit=crop',
  },
  {
    id: 'g6',
    slug: 'integrations-marketplace',
    title: 'Announcing the Oxy Integrations Marketplace',
    description:
      'Connect Oxy to your favorite tools with one click.',
    category: 'Product',
    date: '2026-02-12',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=800&fit=crop',
  },
  {
    id: 'g7',
    slug: 'workflow-automation',
    title: 'Workflow automation: build custom pipelines with no code',
    description:
      'Design powerful automations that move deals forward.',
    category: 'Product',
    date: '2026-02-09',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=800&fit=crop',
  },
  {
    id: 'g8',
    slug: 'london-office-expansion',
    title: 'Expanding our London engineering hub',
    description:
      "We're doubling down on our London presence with a new office.",
    category: 'Company',
    date: '2026-02-05',
    imageUrl:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=800&fit=crop',
  },
  {
    id: 'g9',
    slug: 'enrichment-api-v2',
    title: 'Enrichment API v2: smarter, faster data enrichment',
    description:
      'The next generation of our enrichment engine delivers 3x more data points.',
    category: 'Product',
    date: '2026-01-28',
    imageUrl:
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=800&fit=crop',
  },
]

/* ─── "Recent news" 2-col grid section ─── */
export const recentNewsArticles: NewsArticle[] = [
  {
    id: 'rn1',
    slug: 'graph-neural-networks-crm',
    title: 'Applying graph neural networks to relationship mapping',
    description:
      'Our research team explores how graph-based models can discover and strengthen business relationships.',
    category: 'Engineering',
    date: '2026-01-15',
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=800&fit=crop',
  },
  {
    id: 'rn2',
    slug: 'natural-language-queries',
    title: 'Natural language queries for CRM data',
    description:
      'Enabling users to ask questions in plain English and get precise answers — no SQL required.',
    category: 'Research',
    date: '2026-01-10',
    imageUrl:
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=800&fit=crop',
  },
]

/* ─── "Stories" carousel section ─── */
export const storiesArticles: NewsArticle[] = [
  {
    id: 'st1',
    slug: 'how-acme-uses-oxy',
    title: "How Acme Corp 10x'd their pipeline with Oxy",
    description:
      'Learn how one of the fastest-growing SaaS companies transformed their sales process.',
    category: 'Company',
    date: '2026-01-25',
    imageUrl:
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=800&fit=crop',
  },
  {
    id: 'st2',
    slug: 'oxy-partner-summit',
    title: 'Highlights from the Oxy Partner Summit 2026',
    description:
      'Recapping the best moments from our first annual partner event.',
    category: 'Company',
    date: '2026-01-20',
    imageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=800&fit=crop',
  },
  {
    id: 'st3',
    slug: 'building-crm-for-startups',
    title: 'Building the CRM startups actually want',
    description:
      'Why we designed Oxy from the ground up for fast-moving teams.',
    category: 'Company',
    date: '2026-01-15',
    imageUrl:
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=800&fit=crop',
  },
]

/* ─── "Latest research" carousel section ─── */
export const researchArticles: NewsArticle[] = [
  {
    id: 'lr1',
    slug: 'bias-detection-ai-models',
    title: 'Bias detection in AI-assisted sales recommendations',
    description:
      "How our safety team identifies and mitigates potential biases in Oxy's AI models.",
    category: 'Research',
    date: '2026-01-05',
    imageUrl:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=800&fit=crop',
  },
  {
    id: 'lr2',
    slug: 'embedding-models-crm',
    title: 'Custom embedding models for CRM search',
    description:
      'Training domain-specific embeddings that understand sales context and terminology.',
    category: 'Research',
    date: '2025-12-20',
    imageUrl:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=800&fit=crop',
  },
  {
    id: 'lr3',
    slug: 'temporal-patterns-deals',
    title: 'Temporal patterns in deal progression',
    description:
      'Using time-series analysis to predict deal outcomes and optimal follow-up timing.',
    category: 'Research',
    date: '2025-12-10',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=800&fit=crop',
  },
]

/* ─── "Oxy for business" carousel section ─── */
export const businessArticles: NewsArticle[] = [
  {
    id: 'b1',
    slug: 'enterprise-security-overview',
    title: 'Enterprise security at Oxy: a comprehensive overview',
    description:
      'How we protect the data of the world\'s most security-conscious organizations.',
    category: 'Security',
    date: '2025-12-01',
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&h=800&fit=crop',
  },
  {
    id: 'b2',
    slug: 'scaling-crm-10k-users',
    title: 'Scaling CRM for 10,000+ users',
    description:
      'The infrastructure decisions that let Oxy serve the largest teams without breaking a sweat.',
    category: 'Engineering',
    date: '2025-11-20',
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=800&fit=crop',
  },
  {
    id: 'b3',
    slug: 'api-first-crm',
    title: 'Why Oxy is API-first',
    description:
      'Our developer platform lets you build anything on top of your CRM data.',
    category: 'Product',
    date: '2025-11-10',
    imageUrl:
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=800&fit=crop',
  },
]
