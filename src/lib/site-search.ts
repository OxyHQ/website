import MiniSearch from 'minisearch'
import { buildDocsHref, getIndex } from '../content/docs-loader'
import type { SyncedIndex } from '../../scripts/types'

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

const GROUP_ORDER = ['pages', 'ui-library', 'sdk', 'app', 'service'] as const

export const GROUP_LABELS: Record<string, string> = {
  pages: 'Pages',
  'ui-library': 'UI Library',
  sdk: 'SDK',
  app: 'Apps',
  service: 'Services',
}

interface PagefindResult {
  id: string
  data: () => Promise<{
    url: string
    excerpt: string
    meta: { title: string }
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

function buildMiniSearchIndex(index: SyncedIndex): MiniSearch {
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
  const ms = new MiniSearch<IndexDoc>({
    fields: ['title', 'body', 'subtitle'],
    storeFields: ['title', 'subtitle', 'group', 'url', 'body'],
    searchOptions: { boost: { title: 3, subtitle: 1.5 }, fuzzy: 0.2, prefix: true },
  })
  ms.addAll(documents)
  return ms
}

let miniSearch: MiniSearch | null = null

function getMiniSearch(): MiniSearch {
  if (!miniSearch) miniSearch = buildMiniSearchIndex(getIndex())
  return miniSearch
}

function searchDev(query: string): SearchResult[] {
  const matches = getMiniSearch().search(query)
  return matches.slice(0, 20).map((m) => {
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
  const out: SearchResult[] = []
  for (const r of results.slice(0, 20)) {
    const data = await r.data()
    const url = data.url.replace(/\.html$/, '').replace(/\/index$/, '') || '/'
    const docPkg = packages.find((p) => url.includes(`/developers/docs/${p.shortName}`))
    out.push({
      id: r.id,
      url,
      title: data.meta.title ?? url,
      group: docPkg?.category ?? 'pages',
      subtitle: docPkg?.displayName ?? 'Oxy',
      snippet: data.excerpt,
    })
  }
  return out
}

/* ----------------------------- API ------------------------------- */

/** Search the whole site. Uses Pagefind in production, MiniSearch in dev. */
export async function searchSite(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  const prod = await searchProd(query)
  return prod !== null ? prod : searchDev(query)
}

/** Group flat results by section in a stable display order. */
export function groupResults(results: SearchResult[]): Array<{ group: string; items: SearchResult[] }> {
  const groups = new Map<string, SearchResult[]>()
  for (const r of results) {
    const list = groups.get(r.group) ?? []
    list.push(r)
    groups.set(r.group, list)
  }
  return GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({ group: g, items: groups.get(g) ?? [] }))
}
