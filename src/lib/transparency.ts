/** Shared catalogue for the collection, routes, search and prerendering. */
export const LEGAL_DOCUMENTS = [
  { slug: 'privacy', title: 'Privacy Policy', description: 'How we collect, use, and protect your data.' },
  { slug: 'cookies', title: 'Cookie Policy', description: 'How we use cookies and similar technologies.' },
  { slug: 'terms', title: 'Terms & Conditions', description: 'The terms governing your use of Oxy.' },
  { slug: 'dpa', title: 'Data Processing Agreement', description: 'The processing terms for organisations using Oxy on behalf of their users.' },
  { slug: 'aup', title: 'Acceptable Use Policy', description: 'The rules for using Oxy services.' },
  { slug: 'security', title: 'Security', description: 'Security information and vulnerability reporting.' },
  { slug: 'accessibility', title: 'Accessibility', description: 'Our commitment to digital accessibility.' },
  { slug: 'llms', title: 'LLMs', description: 'How Oxy uses large language models.' },
] as const

export const TRANSPARENCY_DOCUMENTS = [
  { slug: 'manifesto', path: '/transparency/manifesto', title: 'The Oxy Manifesto', description: 'Why we build the way we do, and what we refuse to trade away.' },
  { slug: 'charter', path: '/transparency/charter', title: 'Founding Charter', description: 'The commitments Oxy is built on, and the limits on its power.' },
  { slug: 'influence', path: '/transparency/influence', title: 'Influence and Responsibility', description: 'Freedom to create, responsibility for consequences, and fair treatment.' },
  { slug: 'business', path: '/transparency/business', title: 'How our business works', description: 'Where the money comes from, where it goes, and what we refuse to earn it from.' },
  { slug: 'transparency', path: '/transparency/approach', title: 'What we publish, and why', description: 'Our approach to openness: code, decisions, incidents and money.' },
] as const

/** Exact migrations only: unknown document names must still return a 404. */
export const TRANSPARENCY_REDIRECTS: ReadonlyArray<readonly [string, string]> = [
  ['/company/transparency', '/transparency/'],
  ...TRANSPARENCY_DOCUMENTS.filter(({ slug }) => slug !== 'transparency')
    .map(({ slug, path }) => [`/company/${slug}`, `${path}/`] as const),
  ['/legal', '/transparency/legal/'],
  ...LEGAL_DOCUMENTS.map(({ slug }) => [`/legal/${slug}`, `/transparency/legal/${slug}/`] as const),
  ['/company/transparency/policies/privacy', '/transparency/legal/privacy/'],
  ['/company/transparency/policies/terms-of-service', '/transparency/legal/terms/'],
  ['/company/transparency/policies/cookies', '/transparency/legal/cookies/'],
]

/** Also normalises persisted CMS navigation, without changing stored content. */
export function transparencyDestination(pathname: string): string | undefined {
  const bare = pathname.replace(/\/+$/, '')
  return TRANSPARENCY_REDIRECTS.find(([from]) => from === bare)?.[1]
}
