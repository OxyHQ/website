export interface NewsroomPost {
  _id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage?: string
  oxyUserId: string
  tags: string[]
  category: string
  featured: boolean
  status: 'draft' | 'published'
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
  publishedAt: string
  createdAt: string
  updatedAt: string
  authorUsername?: string
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

/* helper to build placeholder posts */
function post(id: string, slug: string, title: string, excerpt: string, category: string, publishedAt: string, coverImage: string, extra?: Partial<NewsroomPost>): NewsroomPost {
  return {
    _id: id, slug, title, excerpt, content: '', coverImage,
    oxyUserId: 'placeholder',
    tags: [], category, featured: false, status: 'published',
    publishedAt, createdAt: publishedAt, updatedAt: publishedAt,
    ...extra,
  }
}

/* ─── Featured / hero article (left sticky, 4:5 aspect) ─── */
export const featuredArticle: NewsroomPost = post(
  'f1', 'introducing-oxy-enterprise', 'Introducing Oxy Enterprise',
  "Today we're launching Oxy Enterprise, our most powerful CRM offering built for large organizations with complex workflows and advanced security requirements.",
  'Product', '2026-03-20',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=1000&fit=crop',
  { featured: true },
)

/* ─── Sidebar cards (right column, 1:1 aspect) ─── */
export const sidebarArticles: NewsroomPost[] = [
  post('s1', 'series-b-funding', 'Oxy raises $120M Series B to redefine CRM with AI',
    "We're excited to announce our Series B funding round, led by top-tier investors who share our vision.",
    'Company', '2026-03-17', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=800&fit=crop'),
  post('s2', 'ai-powered-lead-scoring', "How Oxy's AI-powered lead scoring works",
    'A deep dive into the machine learning models behind our intelligent lead scoring system.',
    'Product', '2026-03-06', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=800&fit=crop'),
  post('s3', 'responsible-ai-commitment', 'Our commitment to responsible AI in CRM',
    "Transparency, fairness, and privacy are at the core of how we build AI features.",
    'Safety', '2026-02-27', 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&h=800&fit=crop'),
]

/* ─── Main article listing grid (1:1 aspect cards, 3 cols) ─── */
export const gridArticles: NewsroomPost[] = [
  post('g1', 'oxy-ask-launch', 'Oxy Ask: your AI assistant for every deal',
    'Meet Ask — the AI assistant that lives inside your CRM.',
    'Product', '2026-02-28', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=800&fit=crop'),
  post('g2', 'new-york-office', 'Oxy opens New York headquarters',
    'Our new NYC office marks an exciting milestone as we expand our team.',
    'Company', '2026-02-27', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=800&fit=crop'),
  post('g3', 'soc2-type2-certification', 'Oxy achieves SOC 2 Type II certification',
    'Reinforcing our commitment to enterprise-grade security.',
    'Security', '2026-02-27', 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=800&fit=crop'),
  post('g4', 'data-privacy-framework', "Oxy's data privacy framework",
    "A look at the safeguards we've put in place to protect customer data.",
    'Safety', '2026-02-27', 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&h=800&fit=crop'),
  post('g5', 'customer-milestone', 'Oxy reaches 10,000 customers worldwide',
    "A heartfelt thank you to the teams and companies who trust Oxy.",
    'Company', '2026-02-24', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=800&fit=crop'),
  post('g6', 'integrations-marketplace', 'Announcing the Oxy Integrations Marketplace',
    'Connect Oxy to your favorite tools with one click.',
    'Product', '2026-02-12', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=800&fit=crop'),
  post('g7', 'workflow-automation', 'Workflow automation: build custom pipelines with no code',
    'Design powerful automations that move deals forward.',
    'Product', '2026-02-09', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=800&fit=crop'),
  post('g8', 'london-office-expansion', 'Expanding our London engineering hub',
    "We're doubling down on our London presence with a new office.",
    'Company', '2026-02-05', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=800&fit=crop'),
  post('g9', 'enrichment-api-v2', 'Enrichment API v2: smarter, faster data enrichment',
    'The next generation of our enrichment engine delivers 3x more data points.',
    'Product', '2026-01-28', 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=800&fit=crop'),
]

/* ─── "Recent news" 2-col grid section ─── */
export const recentNewsArticles: NewsroomPost[] = [
  post('rn1', 'graph-neural-networks-crm', 'Applying graph neural networks to relationship mapping',
    'Our research team explores how graph-based models can discover and strengthen business relationships.',
    'Engineering', '2026-01-15', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=800&fit=crop'),
  post('rn2', 'natural-language-queries', 'Natural language queries for CRM data',
    'Enabling users to ask questions in plain English and get precise answers — no SQL required.',
    'Research', '2026-01-10', 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=800&fit=crop'),
]

/* ─── "Stories" carousel section ─── */
export const storiesArticles: NewsroomPost[] = [
  post('st1', 'how-acme-uses-oxy', "How Acme Corp 10x'd their pipeline with Oxy",
    'Learn how one of the fastest-growing SaaS companies transformed their sales process.',
    'Company', '2026-01-25', 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=800&fit=crop'),
  post('st2', 'oxy-partner-summit', 'Highlights from the Oxy Partner Summit 2026',
    'Recapping the best moments from our first annual partner event.',
    'Company', '2026-01-20', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=800&fit=crop'),
  post('st3', 'building-crm-for-startups', 'Building the CRM startups actually want',
    'Why we designed Oxy from the ground up for fast-moving teams.',
    'Company', '2026-01-15', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=800&fit=crop'),
]

/* ─── "Latest research" carousel section ─── */
export const researchArticles: NewsroomPost[] = [
  post('lr1', 'bias-detection-ai-models', 'Bias detection in AI-assisted sales recommendations',
    "How our safety team identifies and mitigates potential biases in Oxy's AI models.",
    'Research', '2026-01-05', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=800&fit=crop'),
  post('lr2', 'embedding-models-crm', 'Custom embedding models for CRM search',
    'Training domain-specific embeddings that understand sales context and terminology.',
    'Research', '2025-12-20', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=800&fit=crop'),
  post('lr3', 'temporal-patterns-deals', 'Temporal patterns in deal progression',
    'Using time-series analysis to predict deal outcomes and optimal follow-up timing.',
    'Research', '2025-12-10', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=800&fit=crop'),
]

/* ─── "Oxy for business" carousel section ─── */
export const businessArticles: NewsroomPost[] = [
  post('b1', 'enterprise-security-overview', 'Enterprise security at Oxy: a comprehensive overview',
    'How we protect the data of the world\'s most security-conscious organizations.',
    'Security', '2025-12-01', 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&h=800&fit=crop'),
  post('b2', 'scaling-crm-10k-users', 'Scaling CRM for 10,000+ users',
    'The infrastructure decisions that let Oxy serve the largest teams without breaking a sweat.',
    'Engineering', '2025-11-20', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=800&fit=crop'),
  post('b3', 'api-first-crm', 'Why Oxy is API-first',
    'Our developer platform lets you build anything on top of your CRM data.',
    'Product', '2025-11-10', 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=800&fit=crop'),
]

/* ─── All placeholder posts combined (for placeholderData in hooks) ─── */
export const allPlaceholderPosts: NewsroomPost[] = [
  featuredArticle, ...sidebarArticles, ...gridArticles,
  ...recentNewsArticles, ...storiesArticles, ...researchArticles, ...businessArticles,
].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
