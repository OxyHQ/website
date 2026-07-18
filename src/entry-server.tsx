/**
 * entry-server.tsx — build-time SEO renderer.
 *
 * Vite builds this file into a Node-loadable ESM bundle. The bundle exports
 * `renderSEO(props)` which mounts only the `<SEO>` component (the canonical
 * source of every meta tag the site ships) inside a minimal provider shell,
 * captures helmet's output (or, on React 19, scrapes the head tags out of
 * the `renderToString` payload), and returns a head fragment ready to
 * splice into `dist/<path>/index.html`.
 *
 * Why this entry only renders `<SEO>`
 * -----------------------------------
 * In principle we want to mount each page so its `<SEO>` call inside the
 * page body fires the same way it would at runtime. In practice the page
 * tree pulls in heavy React-Native-flavored libraries (`@oxyhq/bloom`,
 * `react-native-svg`, `react-native-reanimated`, `react-three-fiber`,
 * `wagmi`) whose SSR/Node story is brittle to non-existent. Bundling them
 * just to throw the body away costs minutes and breaks on every dep bump.
 *
 * Instead, the prerender script computes per-route SEO props from the
 * exact same data sources the pages use — `src/content/_synced/index.json`
 * for docs, the live newsroom API, MDX frontmatter for help/academy,
 * the i18n dictionaries for static pages — and feeds them to the actual
 * `<SEO>` component here. The meta tags shipped to crawlers are the
 * literal output of `<SEO>` (with the route's real props), not a forked
 * parallel string table. If the spec for a meta tag changes in
 * `src/components/SEO.tsx`, every prerendered page picks it up
 * automatically on the next build.
 *
 * Hydration safety
 * ----------------
 * The SPA still mounts on the prerendered HTML and re-emits the same tags
 * via helmet-async at hydration. The static markup matches what helmet
 * would produce client-side, so there is no diff and no flash.
 */
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SEO from './components/SEO'
import { LocaleProvider } from './lib/i18n'
import type { SeoData } from './lib/seo'

/**
 * Mirrors the props of `<SEO>` exactly. Kept inline (not imported from
 * `SEO.tsx`) so the prerender contract is visible in one place and the
 * compiler catches any future drift via a type check at the call site in
 * `scripts/prerender.ts`.
 */
export interface SEORenderInput {
  title: string
  description: string
  /**
   * Always the BARE path (`/pricing`), never locale-prefixed. `<SEO>`'s
   * `buildLocalizedUrl` adds the `/<locale>` prefix itself for canonical,
   * hreflang and x-default — passing `/es/pricing` here would double-prefix.
   */
  canonicalPath: string
  ogImage?: string
  ogType?: string
  noIndex?: boolean
  publishedTime?: string
  modifiedTime?: string
  author?: string
}

/** One entry of `GET /api/locales`, as far as `<SEO>`'s hreflang block cares. */
export interface SEOLocaleSeed {
  code: string
  name?: string
  nativeName?: string
  isDefault?: boolean
  enabled?: boolean
  translationCount?: number
  translationReady?: boolean
}

export interface SEORenderOptions {
  /**
   * Locale to render as. `LocaleProvider` resolves this from the router path,
   * so we seed the router at `/<locale><canonicalPath>` while `<SEO>` still
   * receives the bare `canonicalPath`. Omitted → the default locale.
   */
  locale?: string
  /**
   * Seeds the `public-locales` query. Without it the provider sees no API data
   * and every entry is `translationReady: false`, so a prerendered page emits
   * ZERO hreflang links — the crawler-facing case this whole pipeline exists
   * for. The prerender passes the same list it derives its locale set from.
   */
  locales?: SEOLocaleSeed[]
}

export interface SEORenderResult {
  /** Serialized `<head>` fragment, ready to splice into HTML. */
  head: string
}

export function renderSEO(
  input: SEORenderInput,
  seoData: SeoData | null = null,
  options: SEORenderOptions = {},
): SEORenderResult {
  const helmetContext: { helmet?: HelmetServerState } = {}

  // Fresh QueryClient per call — never let cache state leak across routes.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
    },
  })
  // Seed the CMS-managed SEO so `<SEO>`'s `useSeo()` resolves synchronously from
  // cache. staleTime Infinity means no per-route network fetch during the build;
  // `null` (API unseeded/unreachable) makes `<SEO>` fall back to the props below.
  queryClient.setQueryData(['seo', 'oxy', input.canonicalPath], seoData)
  // Same key `LocaleProvider`'s `useQuery` reads. Seeding it is what lets the
  // prerendered <head> carry real hreflang links instead of none.
  if (options.locales) {
    queryClient.setQueryData(['public-locales'], options.locales)
  }

  // Router path carries the locale prefix so `LocaleProvider` detects it;
  // `<SEO canonicalPath>` stays bare so `buildLocalizedUrl` prefixes once.
  const routerPath =
    options.locale && input.canonicalPath === '/'
      ? `/${options.locale}`
      : options.locale
        ? `/${options.locale}${input.canonicalPath}`
        : input.canonicalPath

  // `<SEO>` reads `useLocaleContext()` to emit hreflang entries. The
  // LocaleProvider's `useQuery('public-locales')` returns `undefined`
  // here (no network during prerender); SEO then falls back to the
  // static `SUPPORTED_LOCALES`, identical to the client's first paint.
  //
  // MemoryRouter is required because the provider calls `useNavigate()`
  // and `useLocation()`. We seed the router at the route we're rendering
  // for so any future `useLocation`-based logic in SEO sees the right URL.
  const body = renderToString(
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[routerPath]}>
          <LocaleProvider>
            <SEO
              title={input.title}
              description={input.description}
              canonicalPath={input.canonicalPath}
              ogImage={input.ogImage}
              ogType={input.ogType}
              noIndex={input.noIndex}
              publishedTime={input.publishedTime}
              modifiedTime={input.modifiedTime}
              author={input.author}
            />
          </LocaleProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  )

  // React 18 path: helmet captures into context.
  const helmet = helmetContext.helmet
  if (helmet) {
    const head = [
      helmet.title.toString(),
      helmet.meta.toString(),
      helmet.link.toString(),
    ]
      .filter((part) => part.trim().length > 0)
      .join('\n    ')
    if (head.length > 0) return { head }
  }

  // React 19 path: head tags are emitted inline in the `renderToString`
  // payload. The current React/react-helmet-async pair takes this branch.
  return { head: extractHeadFromBody(body) }
}

/**
 * Recover the SEO-relevant tags from React 19's renderToString output.
 * React 19 inlines `<title>`, `<meta>`, and `<link>` tags wherever they
 * appear in the tree; the browser hoists them into `<head>` at hydration.
 * For prerendering we just need them as a string we can paste into a
 * static `<head>`.
 */
function extractHeadFromBody(body: string): string {
  const tagPatterns: RegExp[] = [
    /<title[^>]*>[\s\S]*?<\/title>/gi,
    /<meta\s[^>]*\/?>/gi,
    /<link\s[^>]*\/?>/gi,
  ]
  const collected: string[] = []
  for (const pattern of tagPatterns) {
    const matches = body.match(pattern)
    if (matches) collected.push(...matches)
  }
  // Normalize React's camelCase attribute names back to canonical lowercase.
  // Crawlers accept either, but lowercase matches what the rest of the
  // document ships in its static markup.
  const normalized = collected.map((tag) =>
    tag
      .replace(/\shrefLang=/g, ' hreflang=')
      .replace(/\shttpEquiv=/g, ' http-equiv=')
      .replace(/\scharSet=/g, ' charset=')
      .trim(),
  )
  return Array.from(new Set(normalized)).join('\n    ')
}
