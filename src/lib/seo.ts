/**
 * SEO resolver — the single, framework-agnostic source of truth for turning a
 * (path, host) into page metadata. Pure data in, meta out: imported by the
 * client `<SEO>` component, the build-time prerender, and the Cloudflare edge
 * middleware, so all three resolve identically and nothing is hardcoded twice.
 *
 * The metadata itself is CMS-managed (`GET /api/seo`); this module only knows
 * how to *resolve* it, plus the fixed brand identities keyed by host.
 */

export type SeoBrand = 'oxy' | 'faircoin'

export interface SeoMeta {
  title: string
  description: string
  /** Root-relative or absolute. Empty falls back to the brand default. */
  ogImage: string
}

export interface BrandSeo {
  default: SeoMeta | null
  routes: Record<string, SeoMeta>
}

/** Shape of `GET /api/seo`. */
export type SeoData = Record<SeoBrand, BrandSeo>

interface BrandIdentity {
  origin: string
  siteName: string
  /** Used when the CMS has no `ogImage` for the route or brand default. */
  fallbackOgImage: string
  /**
   * Bootstrap title/description used only when the CMS has no entry at all
   * (API unseeded or unreachable). The CMS is the real source of truth; this is
   * a thin safety net so a brand never ships empty or wrong meta. No CRM, no
   * em-dashes.
   */
  fallbackTitle: string
  fallbackDescription: string
}

const BRANDS: Record<SeoBrand, BrandIdentity> = {
  oxy: {
    origin: 'https://oxy.so',
    siteName: 'Oxy',
    fallbackOgImage: '/og-default.png',
    fallbackTitle: 'Oxy, an open-source ecosystem of ethical technology',
    fallbackDescription:
      'Oxy is an independent, open-source ecosystem of ethical technology built to empower people, not exploit them. Apps, AI, an operating system, a browser, identity and more. Mention, Allo, Inbox, Codea, Oxy AI, OxyOS, Astro, TNP, FairCoin and Homiio.',
  },
  faircoin: {
    origin: 'https://fairco.in',
    siteName: 'FairCoin',
    fallbackOgImage: '/og-faircoin.png',
    fallbackTitle: 'FairCoin, community run cryptocurrency',
    fallbackDescription:
      'FairCoin is a community run cryptocurrency. Decentralized, fair, free of speculation. Hybrid PoW and PoS, capped at 33M coins. Wallets, masternodes, explorer and an optional Base bridge.',
  },
}

const FAIRCOIN_HOSTS: ReadonlySet<string> = new Set(['fairco.in', 'www.fairco.in'])

/** Which brand a hostname belongs to. Defaults to Oxy off-browser / unknown hosts. */
export function brandForHost(host?: string | null): SeoBrand {
  return host && FAIRCOIN_HOSTS.has(host.toLowerCase()) ? 'faircoin' : 'oxy'
}

export interface ResolvedSeo {
  title: string
  description: string
  canonical: string
  ogImage: string
  siteName: string
  brand: SeoBrand
}

/** Trailing-slash-normalize a path (`/a/` → `/a`, `/` stays `/`). */
function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.replace(/\/+$/, '')
  return pathname || '/'
}

function toAbsolute(origin: string, url: string): string {
  if (!url) return ''
  return /^https?:\/\//.test(url) ? url : origin + url
}

/**
 * Resolve the SEO for `pathname` on the brand that owns `host`. Returns `null`
 * when the CMS has no entry and no brand default for that route — the caller
 * (a dynamic page like a blog post or docs page) then supplies its own meta.
 */
export function resolveSeo(data: SeoData | null, pathname: string, host?: string | null): ResolvedSeo | null {
  const brand = brandForHost(host)
  const identity = BRANDS[brand]
  const table = data?.[brand]
  const entry = table?.routes[normalizePath(pathname)] ?? table?.default ?? null
  if (!entry) return null
  const ogImage = entry.ogImage || table?.default?.ogImage || identity.fallbackOgImage
  return {
    title: entry.title,
    description: entry.description,
    canonical: identity.origin + pathname,
    ogImage: toAbsolute(identity.origin, ogImage),
    siteName: identity.siteName,
    brand,
  }
}

/** Brand identity + origin for a host, with no CMS lookup. */
export function brandConfig(host?: string | null): { brand: SeoBrand; origin: string; siteName: string } {
  const brand = brandForHost(host)
  return { brand, origin: BRANDS[brand].origin, siteName: BRANDS[brand].siteName }
}

/**
 * Resolve with a guaranteed result: the CMS entry when present, otherwise the
 * brand bootstrap meta. Used by the prerender and edge middleware, which must
 * always emit *some* correct, host-appropriate meta even before the CMS is
 * seeded or if the API is unreachable.
 */
export function resolveSeoOrDefault(data: SeoData | null, pathname: string, host?: string | null): ResolvedSeo {
  const fromCms = resolveSeo(data, pathname, host)
  if (fromCms) return fromCms
  const brand = brandForHost(host)
  const identity = BRANDS[brand]
  return {
    title: identity.fallbackTitle,
    description: identity.fallbackDescription,
    canonical: identity.origin + pathname,
    ogImage: identity.origin + identity.fallbackOgImage,
    siteName: identity.siteName,
    brand,
  }
}
