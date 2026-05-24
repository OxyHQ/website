import { useState, useRef, useCallback, type ChangeEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import MiniSearch from 'minisearch'
import { getIndex } from '../../content/docs-loader'
import type { SyncedIndex, SyncedPackage } from '../../../scripts/types'

interface SearchResult {
  id: string
  url: string
  title: string
  packageName: string
  category: string
  snippet?: string
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

function buildMiniSearchIndex(index: SyncedIndex) {
  const documents: Array<{ id: string; title: string; packageName: string; category: string; url: string; body: string }> = []
  for (const pkg of index.packages) {
    for (const ver of pkg.versions) {
      // Only the default version is searchable to keep the index small in dev.
      if (ver.version !== pkg.defaultVersion) continue
      for (const page of ver.pages) {
        const url = page.slug
          ? `/developers/docs/${pkg.shortName}/${ver.version}/${page.slug}`
          : `/developers/docs/${pkg.shortName}/${ver.version}`
        documents.push({
          id: url,
          title: page.title,
          packageName: pkg.displayName,
          category: pkg.category,
          url,
          body: page.description ?? page.title,
        })
      }
    }
  }
  const ms = new MiniSearch({
    fields: ['title', 'body', 'packageName'],
    storeFields: ['title', 'packageName', 'category', 'url', 'body'],
    searchOptions: { boost: { title: 3, packageName: 1.5 }, fuzzy: 0.2, prefix: true },
  })
  ms.addAll(documents)
  return ms
}

const miniSearch = buildMiniSearchIndex(getIndex())

async function searchDev(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  const matches = miniSearch.search(query)
  return matches.slice(0, 20).map((m) => {
    const stored = m as unknown as { id: string; url: string; title: string; packageName: string; category: string; body: string }
    return {
      id: stored.id,
      url: stored.url,
      title: stored.title,
      packageName: stored.packageName,
      category: stored.category,
      snippet: stored.body,
    }
  })
}

/* --------------------- Pagefind (production) ---------------------- */

let pagefindPromise: Promise<PagefindAPI | null> | null = null

async function loadPagefind(): Promise<PagefindAPI | null> {
  if (pagefindPromise) return pagefindPromise
  pagefindPromise = (async () => {
    if (typeof window === 'undefined') return null
    try {
      // `/pagefind/pagefind.js` is emitted by the `pagefind --site dist`
      // postbuild step. In dev there is no `dist/`, so this import fails and
      // we fall back to MiniSearch.
      const url = `${window.location.origin}/pagefind/pagefind.js`
      const mod = (await import(/* @vite-ignore */ url)) as PagefindAPI
      return mod
    } catch {
      return null
    }
  })()
  return pagefindPromise
}

async function searchProd(query: string, packages: SyncedPackage[]): Promise<SearchResult[] | null> {
  const pagefind = await loadPagefind()
  if (!pagefind) return null
  if (!query.trim()) return []
  const { results } = await pagefind.search(query)
  const top = results.slice(0, 20)
  const out: SearchResult[] = []
  for (const r of top) {
    const data = await r.data()
    const url = data.url.replace(/\.html$/, '')
    // Best-effort: associate URL with one of our packages so we can show a
    // category label. Falls back to "Docs".
    const matchPkg = packages.find((p) => url.includes(`/developers/docs/${p.shortName}/`))
    out.push({
      id: r.id,
      url,
      title: data.meta.title ?? url,
      packageName: matchPkg?.displayName ?? 'Docs',
      category: matchPkg?.category ?? 'sdk',
      snippet: data.excerpt,
    })
  }
  return out
}

/* ----------------------------- UI ------------------------------- */

const categoryOrder = ['ui-library', 'sdk', 'app', 'service'] as const

function groupResults(results: SearchResult[]): Array<{ category: string; items: SearchResult[] }> {
  const groups = new Map<string, SearchResult[]>()
  for (const r of results) {
    const list = groups.get(r.category) ?? []
    list.push(r)
    groups.set(r.category, list)
  }
  return categoryOrder
    .filter((cat) => groups.has(cat))
    .map((cat) => ({ category: cat, items: groups.get(cat) ?? [] }))
}

const categoryLabels: Record<string, string> = {
  'ui-library': 'UI Library',
  sdk: 'SDK',
  app: 'Apps',
  service: 'Services',
}

interface DocsSearchProps {
  /** When true, renders as an inline header search box. When false, opens via ⌘K. */
  variant?: 'inline' | 'modal'
  className?: string
}

export default function DocsSearch({ variant = 'inline', className }: DocsSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [open, setOpen] = useState(variant === 'inline')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    const prod = await searchProd(q, getIndex().packages)
    if (prod !== null) {
      setResults(prod)
    } else {
      const dev = await searchDev(q)
      setResults(dev)
    }
    setActiveIndex(0)
  }, [])

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setQuery(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(next), 120)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const r = results[activeIndex]
      if (r) {
        e.preventDefault()
        setOpen(false)
        navigate(r.url)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  // ⌘K registration only for modal variant.
  const registerHotkey = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node
    if (variant !== 'modal') return
    if (!node) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
        node.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [variant])

  const grouped = groupResults(results)

  return (
    <div className={className}>
      <label className="relative block">
        <span className="sr-only">Search documentation</span>
        <input
          ref={registerHotkey}
          type="search"
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          placeholder="Search docs..."
          className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Search documentation"
          aria-expanded={open}
        />
      </label>

      {open && query.trim() ? (
        <div className="absolute z-50 mt-2 w-full max-w-xl rounded-2xl border border-border bg-background shadow-lg">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No results.</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {grouped.map((group) => (
                <div key={group.category} className="mb-3 last:mb-0">
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {categoryLabels[group.category] ?? group.category}
                  </div>
                  <ul className="space-y-0.5">
                    {group.items.map((r, idx) => {
                      const globalIdx = grouped
                        .slice(0, grouped.indexOf(group))
                        .reduce((n, g) => n + g.items.length, 0) + idx
                      const isActive = globalIdx === activeIndex
                      return (
                        <li key={r.id}>
                          <button
                            type="button"
                            className={
                              isActive
                                ? 'block w-full rounded-xl bg-primary/10 px-3 py-2 text-left text-sm text-primary'
                                : 'block w-full rounded-xl px-3 py-2 text-left text-sm text-foreground hover:bg-surface'
                            }
                            onClick={() => {
                              setOpen(false)
                              navigate(r.url)
                            }}
                          >
                            <div className="font-medium">{r.title}</div>
                            <div className="text-[11px] text-muted-foreground">{r.packageName}</div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
