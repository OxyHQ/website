/* ─────────────────────────────────────────────
   AI page — static content constants.
   Same pattern as codea.ts / inbox.ts.
   ───────────────────────────────────────────── */

export interface ProductCard {
  title: string
  description: string
  href: string
  cta: string
}

/* ── Section 1: Hero ── */

export const heroTagline = 'Oxy AI is here:'
export const heroDescription =
  'Intelligent AI that understands your workflow, your data, and your goals.'
export const heroAnnouncementDesktop = 'Read announcement'
export const heroAnnouncementMobile = 'Oxy AI is here'
export const heroAnnouncementHref = '/company/news'
export const heroPlaceholder = 'What do you want to know?'

/* ── Section 2: Products ── */

export const productsTag = 'Products'
export const productsHeading = 'AI for everyone'

export const productCards: ProductCard[] = [
  {
    title: 'Alia AI',
    description:
      'Your intelligent assistant, now accessible on web, iOS, and Android. Explore and accomplish more with AI.',
    href: 'https://alia.onl/',
    cta: 'Use now',
  },
  {
    title: 'API',
    description:
      'Supercharge your applications with enhanced speed, precision, and multilingual capabilities.',
    href: '/developers/docs',
    cta: 'Build now',
  },
  {
    title: 'Developer Docs',
    description:
      'Learn how to quickly integrate Oxy AI at the heart of your applications and explore guides covering common use cases.',
    href: '/developers/docs/overview',
    cta: 'Learn more',
  },
]

/* ── Section 3: Globe ── */

export const globeTextLeft = 'Understand'
export const globeTextRight = 'Your World'

/* ── Section 4: Research CTA ── */

export const researchHeading = 'AI for Research'
export const researchParagraphs = [
  "At Oxy, we're building AI that advances research across science, healthcare, and human understanding, tackling the problems that matter most.",
  'From accelerating drug discovery and genomics to climate modeling and social science, {highlight} is designed to help researchers push the boundaries of what\'s possible.',
]
export const researchHighlight = 'Oxy AI'
export const researchCta = 'Learn more'
export const researchCtaHref = '/initiative'

/* ── Section 5: Blog / News ── */

export const blogTag = 'Blog'
export const blogHeading = 'Latest news'
export const blogExploreCta = 'Explore more'
export const blogExploreHref = '/company/news'
export const blogReadCta = 'Read'
export const blogEmptyText = 'No articles found.'
