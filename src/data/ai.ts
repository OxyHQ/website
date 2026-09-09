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

export const conversationHeroVideos = [
  '/ai/managed-inbox.mp4',
  '/ai/morning-briefing-results.mp4',
  '/ai/todo-assign-ai.mp4',
] as const

export const conversationHeroHeadline = 'Your work, understood.\nYour day, moving.'
export const conversationHeroCta = 'Meet Alia'
export const conversationHeroCtaHref = 'https://alia.onl/'

export const conversationHeroMessages: ReadonlyArray<{
  author: 'alia' | 'person'
  name: string
  text: string
}> = [
  { author: 'person', name: 'You', text: 'Can everyone make Thursday afternoon?' },
  { author: 'alia', name: 'Alia', text: 'I checked the team calendars. Three times work for everyone.' },
  { author: 'person', name: 'You', text: 'Book the earliest one and add the project notes.' },
  { author: 'alia', name: 'Alia', text: 'Ready. I included the latest brief and left time for questions.' },
]

export const conversationHeroSlotDay = 'Thursday, 10 September'
export const conversationHeroSlots = ['14:00', '14:30', '15:00', '15:30', '16:00'] as const
export const conversationHeroSlotCta = 'Meeting scheduled · 14:00'

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
    href: '/developers/docs',
    cta: 'Learn more',
  },
]

/* ── Section 3: Globe ── */

export const globeTextLeft = 'Understand'
export const globeTextRight = 'Your World'

/* ── Section 4: Research CTA ── */

export const researchHeading = 'AI for Research'
export const researchParagraph =
  'At Oxy, we combine external models from providers like OpenAI, Anthropic, and Meta with the development of our own models. With {highlight}, we work to advance scientific research, healthcare, and human understanding through technology that is open, transparent, and ethical, keeping people in control.'
export const researchHighlight = 'Oxy AI'
export const researchCta = 'Learn more'
export const researchCtaHref = '/initiative'
