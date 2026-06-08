import type MiniSearch from 'minisearch'
import { buildDocsHref, getIndex } from '../content/docs-loader'
import { categoryLabels, categoryOrder } from '../components/docs/docsTypes'
import type { SyncedIndex, SyncedPackage } from '../../scripts/types'

/**
 * Site-wide search engine, shared by the navbar search.
 *
 * - **Production**: Pagefind (`/pagefind/pagefind.js`, emitted by the
 *   `run-pagefind` postbuild step) indexes *every* prerendered page — marketing
 *   pages and docs alike — so results already span the whole site.
 * - **Development**: there is no `dist/`, so we fall back to an in-memory
 *   MiniSearch index built from the synced docs index plus a curated list of
 *   top-level marketing pages.
 */

export interface SearchResult {
  id: string
  url: string
  title: string
  /** Group key — a docs category (`sdk`, `app`, …) or `pages` for the site. */
  group: string
  /** Shown under the title: the package name, or "Oxy" for marketing pages. */
  subtitle: string
  snippet?: string
}

// `pages` (marketing) first, then the docs categories in their canonical order
// and labels — shared with the docs sidebar/hub via docsTypes so they can't drift.
const GROUP_ORDER: string[] = ['pages', 'blog', ...categoryOrder]

export const GROUP_LABELS: Record<string, string> = { pages: 'Pages', blog: 'Newsroom', ...categoryLabels }

interface PagefindResult {
  id: string
  data: () => Promise<{
    url: string
    excerpt: string
    meta: { title: string; route?: string }
    filters: Record<string, string[]>
  }>
}

interface PagefindAPI {
  search: (query: string) => Promise<{ results: PagefindResult[] }>
}

/* ----------------- MiniSearch (dev-mode fallback) ----------------- */

/**
 * Top-level marketing pages seeded into the dev index. Production relies on
 * Pagefind (full coverage), so this only needs the primary destinations to keep
 * local search useful beyond docs.
 */
const SITE_PAGES: Array<{ url: string; title: string }> = [
  { url: '/', title: 'Home' },
  { url: '/technologies', title: 'Technologies' },
  { url: '/pricing', title: 'Pricing' },
  { url: '/developers/docs', title: 'Developer docs' },
  { url: '/company', title: 'Company' },
  { url: '/company/team', title: 'Team' },
  { url: '/company/careers', title: 'Careers' },
  { url: '/company/manifesto', title: 'Manifesto' },
  { url: '/academy', title: 'Academy' },
  { url: '/newsroom', title: 'Newsroom' },
  { url: '/partners', title: 'Partners' },
  { url: '/referrals', title: 'Referrals' },
  { url: '/status', title: 'Status' },
  { url: '/faircoin', title: 'FairCoin' },
]

interface IndexDoc {
  id: string
  title: string
  subtitle: string
  group: string
  url: string
  body: string
}

function buildSearchDocuments(index: SyncedIndex): IndexDoc[] {
  const documents: IndexDoc[] = []
  for (const page of SITE_PAGES) {
    documents.push({ id: page.url, title: page.title, subtitle: 'Oxy', group: 'pages', url: page.url, body: page.title })
  }
  for (const pkg of index.packages) {
    for (const ver of pkg.versions) {
      // Only the latest (or working-tree) version is searchable — keeps the
      // index small and avoids old-version duplicates.
      if (ver.version !== pkg.latestVersion) continue
      for (const page of ver.pages) {
        const url = buildDocsHref(pkg, 'latest', page.slug)
        documents.push({
          id: url,
          title: page.title,
          subtitle: pkg.displayName,
          group: pkg.category,
          url,
          body: page.description ?? page.title,
        })
      }
    }
  }
  return documents
}

interface NewsroomPost {
  slug: string
  title: string
  description?: string
  resume?: string
  status?: string
}

/**
 * Dev-only: fetch published blog posts so local search covers the newsroom too
 * (production indexes them through Pagefind). Best-effort — returns [] if the
 * API is unavailable, so search never breaks on a missing backend.
 */
async function fetchNewsroomDocuments(): Promise<IndexDoc[]> {
  try {
    const res = await fetch('/api/newsroom?limit=500')
    if (!res.ok) return []
    const data = (await res.json()) as { posts?: NewsroomPost[] }
    return (data.posts ?? [])
      .filter((p) => /^[a-z0-9-]+$/i.test(p.slug ?? '') && (p.status ?? 'published') === 'published')
      .map((p) => ({
        id: `/newsroom/${p.slug}`,
        title: p.title,
        subtitle: 'Newsroom',
        group: 'blog',
        url: `/newsroom/${p.slug}`,
        body: p.description ?? p.resume ?? p.title,
      }))
  } catch {
    return []
  }
}

let miniSearch: MiniSearch | null = null

// MiniSearch (~18 KB gzip) only powers the dev fallback, so load it dynamically:
// it stays out of the eager bundle that ships the navbar on every page.
async function getMiniSearch(): Promise<MiniSearch> {
  if (!miniSearch) {
    const { default: MiniSearch } = await import('minisearch')
    const ms = new MiniSearch<IndexDoc>({
      fields: ['title', 'body', 'subtitle'],
      storeFields: ['title', 'subtitle', 'group', 'url', 'body'],
      searchOptions: { boost: { title: 3, subtitle: 1.5 }, fuzzy: 0.2, prefix: true },
    })
    ms.addAll(buildSearchDocuments(getIndex()))
    ms.addAll(await fetchNewsroomDocuments())
    miniSearch = ms
  }
  return miniSearch
}

async function searchDev(query: string): Promise<SearchResult[]> {
  const ms = await getMiniSearch()
  return ms.search(query).slice(0, 20).map((m) => {
    const s = m as unknown as { id: string; url: string; title: string; subtitle: string; group: string; body: string }
    return { id: s.id, url: s.url, title: s.title, group: s.group, subtitle: s.subtitle, snippet: s.body }
  })
}

/* --------------------- Pagefind (production) ---------------------- */

let pagefindPromise: Promise<PagefindAPI | null> | null = null

async function loadPagefind(): Promise<PagefindAPI | null> {
  if (pagefindPromise) return pagefindPromise
  pagefindPromise = (async () => {
    if (typeof window === 'undefined') return null
    try {
      const url = `${window.location.origin}/pagefind/pagefind.js`
      return (await import(/* @vite-ignore */ url)) as PagefindAPI
    } catch {
      return null
    }
  })()
  return pagefindPromise
}

async function searchProd(query: string): Promise<SearchResult[] | null> {
  const pagefind = await loadPagefind()
  if (!pagefind) return null
  const { results } = await pagefind.search(query)
  const packages = getIndex().packages
  const top = results.slice(0, 20)
  // Each `r.data()` is an independent fragment fetch — load them in parallel.
  const datas = await Promise.all(top.map((r) => r.data()))
  return top.map((r, i) => {
    const data = datas[i]
    // Content stubs declare their real SPA route in pagefind metadata
    // (`route`); prerendered pages fall back to their own file URL.
    const url = data.meta.route ?? (data.url.replace(/\.html$/, '').replace(/\/index$/, '') || '/')
    const { group, subtitle } = classifyResult(url, packages)
    return { id: r.id, url, title: data.meta.title ?? url, group, subtitle, snippet: data.excerpt }
  })
}

/** Map a result URL to its display group + subtitle (docs package, blog, …). */
function classifyResult(url: string, packages: SyncedPackage[]): { group: string; subtitle: string } {
  const docPkg = packages.find((p) => url.includes(`/developers/docs/${p.shortName}`))
  if (docPkg) return { group: docPkg.category, subtitle: docPkg.displayName }
  if (url.startsWith('/newsroom')) return { group: 'blog', subtitle: 'Newsroom' }
  if (url.startsWith('/academy')) return { group: 'pages', subtitle: 'Academy' }
  if (url.startsWith('/help')) return { group: 'pages', subtitle: 'Help' }
  return { group: 'pages', subtitle: 'Oxy' }
}

/* ----------------------------- API ------------------------------- */

/** Search the whole site. Uses Pagefind in production, MiniSearch in dev. */
export async function searchSite(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  const prod = await searchProd(query)
  return prod !== null ? prod : searchDev(query)
}

/**
 * Group flat results by section. `priority` groups are surfaced first (current-
 * section context), then the rest follow the canonical order.
 */
export function groupResults(
  results: SearchResult[],
  priority: string[] = [],
): Array<{ group: string; items: SearchResult[] }> {
  const groups = new Map<string, SearchResult[]>()
  for (const r of results) {
    const list = groups.get(r.group) ?? []
    list.push(r)
    groups.set(r.group, list)
  }
  const order = [...priority, ...GROUP_ORDER.filter((g) => !priority.includes(g))]
  return order.filter((g) => groups.has(g)).map((g) => ({ group: g, items: groups.get(g) ?? [] }))
}

/**
 * Which result groups to surface first given the page the user is on — so a
 * search from the docs prioritizes docs, from the newsroom prioritizes blog
 * posts, and so on. Returns [] (no reordering) elsewhere.
 */
export function searchContextGroups(pathname: string): string[] {
  if (pathname.startsWith('/developers/docs')) return ['ui-library', 'sdk', 'app', 'service']
  if (pathname.startsWith('/newsroom')) return ['blog']
  if (pathname.startsWith('/help') || pathname.startsWith('/academy')) return ['pages']
  return []
}
