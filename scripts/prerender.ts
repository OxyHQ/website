#!/usr/bin/env bun
/**
 * prerender.ts — build-time static SEO prerendering.
 *
 * The website is a Vite + React SPA on Cloudflare Pages. Out of the box,
 * every URL returns the same `dist/index.html`, so social crawlers (Open
 * Graph, X / Twitter, LinkedIn, Mention, Slack) only ever see the home
 * page's `<title>`, description, and OG image — every newsroom post,
 * docs page, help article, and academy lesson shares the same generic
 * meta. This script fixes that.
 *
 * Pipeline
 * --------
 *   1. Build the SSR bundle from `src/entry-server.tsx`. The bundle
 *      exports `renderSEO(props)` which mounts the actual `<SEO>` React
 *      component (wrapped in helmet + locale providers) and returns the
 *      serialized `<head>` fragment.
 *   2. Enumerate every prerenderable route:
 *        • Hand-curated static marketing routes (home, pricing, company…)
 *        • Help articles — walked from `src/content/help/**\/*.mdx` with
 *          per-article title + description pulled from MDX frontmatter.
 *        • Academy lessons — walked from `src/content/academy/**\/*.mdx`
 *          with per-lesson metadata from MDX frontmatter.
 *        • Newsroom posts — fetched from the live website API
 *          (`https://website-api.oxy.so/api/newsroom`).
 *        • Careers — fetched from `/api/jobs` (skipped gracefully if the
 *          endpoint isn't deployed).
 *        • Docs — every `(package, version, slug)` from
 *          `src/content/_synced/index.json`, using the page's title and
 *          description from the synced metadata.
 *   3. For each route, derive per-route SEO props from the data above
 *      (or from i18n dictionaries for static pages), call `renderSEO`,
 *      and write `dist/<path>/index.html` by splicing the helmet output
 *      into the original `dist/index.html` shell.
 *   4. Authenticated and dynamic surfaces (`/admin/*`, `/dashboard`,
 *      `/settings`, `/u/:username`) are deliberately left untouched —
 *      they stay client-rendered behind Cloudflare's SPA fallback.
 *
 * No edge middleware, no HTML rewriting. Every prerendered file is
 * served as-is by Cloudflare Pages, with the SPA hydrating the body on
 * the client as before.
 */

import { readFile, writeFile, mkdir, stat, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { build as viteBuild } from 'vite'
import type { SyncedIndex } from './types.ts'
import { buildSitemapXml, classifyRoute, toW3CDate, type SitemapEntry } from './sitemap.ts'
import type { SeoData } from '../src/lib/seo'
import type { SEOLocaleSeed } from '../src/entry-server'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isRtlLocale, type Locale } from '../src/lib/i18n/types'
import { featureRequestDescription, featureRequestPath } from '../src/lib/featureRequest'
import { ACADEMY_COURSES } from '../src/content/academy-courses'

/** Course metadata by slug, so academy titles match what the SPA renders. */
const COURSE_BY_SLUG = new Map(ACADEMY_COURSES.map((course) => [course.slug, course]))
const courseTitle = (slug: string): string => COURSE_BY_SLUG.get(slug)?.title ?? prettifySlug(slug)

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..')
const DIST_DIR = path.join(WEBSITE_ROOT, 'dist')
const SSR_DIR = path.join(WEBSITE_ROOT, 'dist-ssr')
const SYNCED_INDEX = path.join(WEBSITE_ROOT, 'src', 'content', '_synced', 'index.json')
const SYNCED_DIR = path.join(WEBSITE_ROOT, 'src', 'content', '_synced')
const HELP_DIR = path.join(WEBSITE_ROOT, 'src', 'content', 'help')
const ACADEMY_DIR = path.join(WEBSITE_ROOT, 'src', 'content', 'academy')
/**
 * Backend origin for the CMS-driven content baked into the prerendered HTML.
 * Reads the same `VITE_API_URL` the SPA does (`src/api/client.ts`) so a staging
 * build prerenders staging content instead of silently baking in production;
 * the fallbacks are the production values used when the var is unset.
 */
const API_BASE = process.env.VITE_API_URL || 'https://website-api.oxy.so'
const NEWSROOM_API = `${API_BASE}/api/newsroom?limit=500`
const JOBS_API = `${API_BASE}/api/jobs`
const PRODUCTS_API = `${API_BASE}/api/products?surface=products`
const FEATURES_API = `${API_BASE}/api/features`
/** The features list caps `limit` server-side; asking for more returns this many. */
const FEATURE_PRERENDER_PAGE_SIZE = 50
const SEO_API = `${API_BASE}/api/seo`
const LOCALES_API = `${API_BASE}/api/locales`

/**
 * Cloudflare Pages hard-fails a deployment above 20,000 files. Every extra
 * locale mirrors the entire route tree, so the ceiling is reached after only a
 * couple of locales. We stop well short of it and fail loudly rather than let
 * a deploy get rejected (or worse, silently truncated) after a green build.
 */
const CF_PAGES_FILE_LIMIT = 20_000
const FILE_BUDGET = 18_000

/** Canonical public origin, used to absolutise OG image URLs. */
const SITE_URL = process.env.SITE_URL || 'https://oxy.so'

/** Per-route SEO contract. Mirrors `<SEO>`'s prop interface. */
interface SEOProps {
  title: string
  description: string
  canonicalPath: string
  ogImage?: string
  ogType?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  noIndex?: boolean
}

/** Renders a page's markdown with the app's own article components. */
type RenderMarkdownFn = (markdown: string) => string

interface SsrRenderers {
  renderSEO: RenderSEOFn
  renderMarkdownBody: RenderMarkdownFn
}

interface RenderSEOFn {
  (
    input: SEOProps,
    seoData: SeoData | null,
    options?: { locale?: string; locales?: SEOLocaleSeed[] },
  ): { head: string }
}

/* ── SSR bundle build ─────────────────────────────────────────────── */

async function buildSsrBundle(): Promise<SsrRenderers> {
  if (existsSync(SSR_DIR)) {
    await rm(SSR_DIR, { recursive: true })
  }

  console.log('[prerender] building SSR bundle…')
  await viteBuild({
    configFile: path.join(WEBSITE_ROOT, 'vite.config.ts'),
    logLevel: 'error',
    plugins: [
      // The image optimizer plugin re-processes every public asset whenever
      // it sees a `dist/` outDir. For the SSR build we don't ship any
      // assets — we only need the JS bundle — and the dupe processing
      // costs a noisy minute on every prerender run. Strip the plugin.
      {
        name: 'oxy-prerender-strip-image-optimizer',
        enforce: 'pre' as const,
        configResolved(resolved) {
          const plugins = resolved.plugins as Array<{ name: string }>
          // Splice in place — there's no immutable variant.
          for (let i = plugins.length - 1; i >= 0; i--) {
            if (plugins[i]?.name === 'vite-plugin-image-optimizer') {
              plugins.splice(i, 1)
            }
          }
        },
      },
    ],
    build: {
      ssr: 'src/entry-server.tsx',
      outDir: SSR_DIR,
      emptyOutDir: true,
      rollupOptions: {
        output: { format: 'esm', entryFileNames: 'entry-server.js' },
      },
      // Server bundle is throwaway; skip minification + asset duplication.
      minify: false,
      copyPublicDir: false,
    },
    ssr: {
      // Bundle our internal packages so Vite resolves their submodule
      // re-exports correctly. External packages from Node's resolver
      // can't follow `@oxyhq/services/dist/.../OxyProvider`-style imports.
      noExternal: [
        '@oxyhq/services',
        '@oxyhq/core',
        'react-helmet-async',
      ],
    },
  })

  const ssrEntry = path.join(SSR_DIR, 'entry-server.js')
  const mod = (await import(`file://${ssrEntry}`)) as Partial<SsrRenderers>
  if (typeof mod.renderSEO !== 'function') {
    throw new Error('[prerender] SSR bundle did not export renderSEO()')
  }
  if (typeof mod.renderMarkdownBody !== 'function') {
    throw new Error('[prerender] SSR bundle did not export renderMarkdownBody()')
  }
  return { renderSEO: mod.renderSEO, renderMarkdownBody: mod.renderMarkdownBody }
}

/* ── Static route SEO props ───────────────────────────────────────── */

/**
 * Each static marketing route declares its SEO props inline. The strings
 * mirror the values the pages would pass to `<SEO>` at runtime (resolved
 * from i18n dictionaries) — keeping them in sync is a one-line PR if a
 * page changes its title.
 *
 * This list intentionally excludes auth-gated routes (`/admin`,
 * `/dashboard`, `/settings`), user-profile pages (`/u/:username`), and
 * the FairCoin dApp's interactive sub-routes (which need a wallet to
 * make sense). Those routes stay client-rendered behind Cloudflare's
 * SPA fallback.
 */
const STATIC_ROUTE_SEO: Record<string, SEOProps> = {
  '/': {
    title: 'Oxy, an open-source ecosystem of ethical technology',
    description:
      'One identity you hold yourself, and a family of open apps built on it: social, messaging, housing, payments, AI and an operating system. No ads, no data sales.',
    canonicalPath: '/',
  },
  '/pricing': {
    title: 'Pricing',
    description:
      'What each plan costs and what it includes across the Oxy apps. A free tier that is genuinely useful, and paid plans priced against real costs.',
    canonicalPath: '/pricing',
  },
  '/apps': {
    title: 'Apps',
    description:
      'Every app in the Oxy ecosystem: social, messaging, AI, housing, payments and more, all on one account you own.',
    canonicalPath: '/apps',
  },
  '/products': {
    title: 'Products',
    description:
      'Every Oxy app in one list, from identity and social to housing, payments and developer tools, with what each one is for.',
    canonicalPath: '/products',
  },
  '/technologies': {
    title: 'Technologies',
    description:
      'The ecosystem map: every Oxy app and service, and how they share one identity, one design system and one platform underneath.',
    canonicalPath: '/technologies',
  },
  '/commons': {
    title: 'Commons, identity you actually own',
    description:
      'Oxy ID lives on your device, not in our database. Sign in across every Oxy app by proving possession of a key nobody else holds.',
    canonicalPath: '/commons',
  },
  '/faqs': {
    title: 'Frequently asked questions',
    description:
      'Short answers about Oxy: what it is, what it costs, how the apps fit together, how your data is handled and how to build on the platform.',
    canonicalPath: '/faqs',
  },
  '/pay': {
    title: 'Oxy Pay',
    description:
      'Payments across the Oxy ecosystem, with every fee shown before you confirm. In development: nothing is open for deposits yet.',
    canonicalPath: '/pay',
  },
  '/mention': {
    title: 'Mention, an open social network',
    description:
      'A social network on the fediverse, without engagement-maxxing algorithms or surveillance ads. Your posts travel through ActivityPub.',
    canonicalPath: '/mention',
  },
  '/homiio': {
    title: 'Homiio, renting made transparent',
    description:
      'Transparent listings, values-based matching, an Oxy-powered trust signal and an assistant that knows tenant rights.',
    canonicalPath: '/homiio',
  },
  '/inbox': {
    title: 'Inbox, end-to-end encrypted email',
    description:
      'Email, chat and federated messages in one calm place. Encrypted by default, with triage that surfaces what actually matters.',
    canonicalPath: '/inbox',
  },
  '/ai': {
    title: 'Oxy AI',
    description:
      'Private AI for people and developers: open models you can inspect, fine-tune and self-host, with conversations that never train anyone else.',
    canonicalPath: '/ai',
  },
  '/ai/pricing': {
    title: 'Oxy AI pricing',
    description:
      'What Oxy AI costs per plan, what each tier includes and how usage is measured. Bring your own model on the higher tiers.',
    canonicalPath: '/ai/pricing',
  },
  '/os': {
    title: 'Oxy OS',
    description:
      'An operating system designed around privacy and user freedom. No telemetry, no tracking, built on battle-tested open source.',
    canonicalPath: '/os',
  },
  '/astro': {
    title: 'Astro Browser',
    description:
      'Browse with AI beside you: instant answers, smarter suggestions and help with tasks, with the privacy controls on your side.',
    canonicalPath: '/astro',
  },
  '/codea': {
    title: 'Codea, an open-source AI code editor',
    description:
      'Write, review and ship in the browser, on your machine or self-hosted. A professional AI editor you can read the source of.',
    canonicalPath: '/codea',
  },
  '/codea/extension': {
    title: 'Codea for VS Code',
    description:
      'Bring Codea\'s open-source assistant into the editor you already use: reviews, refactors and completions, free to inspect and extend.',
    canonicalPath: '/codea/extension',
  },
  '/tnp': {
    title: 'TNP, The Name Project',
    description: 'Register names on .ox, .app, .com and more. DNS-only, system-wide, and fully under your control.',
    canonicalPath: '/tnp',
  },
  '/tnp/install': {
    title: 'Install TNP',
    description:
      'Set up TNP on macOS, Linux, Windows, iOS and Android, and resolve alternative namespaces system-wide.',
    canonicalPath: '/tnp/install',
  },
  '/status': {
    title: 'Status',
    description:
      'Live operational status for every public Oxy service, probed independently so an outage in one is not hidden by another.',
    canonicalPath: '/status',
  },
  '/partners': {
    title: 'Partners',
    description:
      'Build with Oxy: education, community and ecosystem programs, with fair revenue splits and no exclusivity traps.',
    canonicalPath: '/partners',
  },
  '/referrals': {
    title: 'Referrals',
    description: 'Refer people to Oxy and earn rewards. Get a personal referral link from your dashboard.',
    canonicalPath: '/referrals',
  },
  '/initiative': {
    title: 'The Oxy Initiative',
    description:
      'The community work Oxy funds and supports: open source, digital rights, education and the people building alternatives.',
    canonicalPath: '/initiative',
  },
  '/sustain': {
    title: 'Sustain Oxy',
    description:
      'How to support the work: sponsorship, contribution and the programs that keep open infrastructure maintained.',
    canonicalPath: '/sustain',
  },
  '/company': {
    title: 'Company',
    description:
      'Who builds Oxy and why: an open ecosystem of ethical technology, the people behind it and the commitments it runs on.',
    canonicalPath: '/company',
  },
  '/company/team': {
    title: 'Team',
    description: 'The people building Oxy across engineering, design, community and operations.',
    canonicalPath: '/company/team',
  },
  '/company/manifesto': {
    title: 'Manifesto',
    description:
      'Why we build the way we do, what we refuse to trade away, and how to hold us to it. The short version of the Founding Charter.',
    canonicalPath: '/company/manifesto',
  },
  '/company/charter': {
    title: 'Founding Charter',
    description:
      'What Oxy is trying to become, what it must protect while it grows, and what it must never sacrifice for speed, attention, money or status.',
    canonicalPath: '/company/charter',
  },
  '/company/transparency': {
    title: 'Transparency Center',
    description:
      'What Oxy publishes about its code, decisions, incidents and money, and what it deliberately does not.',
    canonicalPath: '/company/transparency',
  },
  '/company/business': {
    title: 'How our business works',
    description:
      'Where the money comes from, where it goes, what we refuse to earn it from, and the terms capital has to accept.',
    canonicalPath: '/company/business',
  },
  '/company/careers': {
    title: 'Careers',
    description:
      'Open roles across engineering, design, community and operations. Help build software that answers to the people who use it.',
    canonicalPath: '/company/careers',
  },
  '/company/news': {
    title: 'Engineering blog',
    description:
      'Deep dives from the people building Oxy: architecture, identity, federation and the decisions behind them.',
    canonicalPath: '/company/news',
  },
  '/newsroom': {
    title: 'Newsroom',
    description: 'Announcements, product updates and engineering posts from across the Oxy ecosystem.',
    canonicalPath: '/newsroom',
  },
  '/academy': {
    title: 'Academy',
    description:
      'Short courses on Oxy ID, building on the platform and running it yourself, from first steps to production patterns.',
    canonicalPath: '/academy',
  },
  '/help': {
    title: 'Help Center',
    description:
      'Guides and answers for every Oxy product: accounts, identity, billing, privacy controls and the developer console.',
    canonicalPath: '/help',
  },
  '/changelog': {
    title: 'Changelog',
    description: 'Every notable change across the Oxy ecosystem, including the ones that remove something.',
    canonicalPath: '/changelog',
  },
  '/developers': {
    title: 'Developers',
    description:
      'Build on Oxy: one identity layer, open APIs, SDKs for web and native, and a design system shared by every app.',
    canonicalPath: '/developers',
  },
  '/developers/docs': {
    title: 'Documentation',
    description: 'Guides, API references and SDK docs for the Oxy platform, from authentication to federation.',
    canonicalPath: '/developers/docs',
  },
  '/developers/docs/api': {
    title: 'API reference',
    description:
      'Every Oxy API endpoint, versioned, with request and response shapes and the auth each one expects.',
    canonicalPath: '/developers/docs/api',
  },
  '/developers/docs/bloom/playground': {
    title: 'Bloom playground',
    description:
      'Try the components behind every Oxy app: live props, theming and the code to paste into your project.',
    canonicalPath: '/developers/docs/bloom/playground',
  },
  '/features': {
    title: 'Feature requests',
    description: 'What people are asking for across the Oxy apps, what is planned and what already shipped.',
    canonicalPath: '/features',
  },
  '/legal': {
    title: 'Legal',
    description:
      'Terms, privacy policy, data processing agreement, acceptable use and security disclosures for Oxy.',
    canonicalPath: '/legal',
  },
  '/legal/privacy': {
    title: 'Privacy Policy',
    description: 'What Oxy collects, why, how long it is kept and how to remove or export it.',
    canonicalPath: '/legal/privacy',
  },
  '/legal/terms': {
    title: 'Terms of Service',
    description: 'The terms that govern the use of Oxy products and services.',
    canonicalPath: '/legal/terms',
  },
  '/legal/dpa': {
    title: 'Data Processing Agreement',
    description: 'The processing terms for organisations running Oxy on behalf of their own users.',
    canonicalPath: '/legal/dpa',
  },
  '/legal/aup': {
    title: 'Acceptable Use Policy',
    description: 'What is and is not allowed on Oxy services, and how the rules are enforced.',
    canonicalPath: '/legal/aup',
  },
  '/legal/cookies': {
    title: 'Cookies Policy',
    description: 'Which cookies and local storage Oxy uses, what each one is for and how to refuse them.',
    canonicalPath: '/legal/cookies',
  },
  '/legal/security': {
    title: 'Security',
    description: 'How Oxy protects accounts and data, and how to report a vulnerability.',
    canonicalPath: '/legal/security',
  },
  '/account-deletion': {
    title: 'Delete your Oxy account',
    description: 'How to delete an Oxy account and what happens to your data when you do.',
    canonicalPath: '/account-deletion',
  },
  '/faircoin': {
    title: 'FairCoin, community run cryptocurrency',
    description:
      'A community run cryptocurrency: decentralized, fair and free of speculation. Hybrid PoW and PoS, capped at 33M coins.',
    canonicalPath: '/faircoin',
  },
  '/faircoin/buy': {
    title: 'Buy FairCoin',
    description:
      'Buy FAIR with crypto through the official payment-address flow, with the network fee stated up front.',
    canonicalPath: '/faircoin/buy',
  },
  '/faircoin/unwrap': {
    title: 'Redeem FairCoin',
    description: 'Redeem WFAIR on Base back to native FairCoin through the custodial bridge.',
    canonicalPath: '/faircoin/unwrap',
  },
  '/faircoin/bridge': {
    title: 'FairCoin bridge, WFAIR on Base',
    description:
      'Move value between FairCoin L1 and WFAIR on Base with a 1:1 custodial bridge, and follow its live status.',
    canonicalPath: '/faircoin/bridge',
  },
  '/faircoin/wallet': {
    title: 'FAIRWallet',
    description:
      'A self-custodied wallet for everyday FairCoin use: send, receive and track balances across devices.',
    canonicalPath: '/faircoin/wallet',
  },
}

/* ── Dynamic route resolvers ──────────────────────────────────────── */

interface NewsroomApiPost {
  slug: string
  status?: string
  title: string
  /** The post's body, in markdown. The list endpoint already returns it. */
  content?: string
  categories?: string[]
  description?: string
  resume?: string
  metaTitle?: string
  ogImage?: string | null
  coverImage?: { url?: string } | string | null
  publishedAt?: string
  updatedAt?: string
}

interface NewsroomApiResponse {
  posts: NewsroomApiPost[]
}

/**
 * Subset of `/api/jobs` used for SEO. Mirrors `Job` in `src/api/hooks.ts` —
 * the route returns a bare array (the backend already filters `active: true`).
 * `description` is deliberately absent: the API returns it as a block array,
 * not a string, so it can never be used as meta description text.
 */
interface JobApiEntry {
  slug: string
  title: string
  department: string
  subtitle?: string
  location: string
  type?: string
  engagement?: string
}

async function fetchNewsroomPosts(): Promise<NewsroomApiPost[]> {
  try {
    const res = await fetch(NEWSROOM_API)
    if (!res.ok) {
      console.warn(`[prerender] newsroom API returned ${res.status}`)
      return []
    }
    const data = (await res.json()) as NewsroomApiResponse
    return data.posts.filter((p) => (p.status ?? 'published') === 'published' && p.slug)
  } catch (err) {
    console.warn('[prerender] newsroom fetch failed:', (err as Error).message)
    return []
  }
}

/**
 * Subset of `/api/features` used for SEO. Mirrors `FeatureRequestData` in
 * `src/api/hooks.ts`.
 */
interface FeatureApiEntry {
  number: number
  title: string
  description: string
  owner: string
  repoName: string
  createdAt: string
  updatedAt: string
  author: string
}

interface FeatureApiResponse {
  items: FeatureApiEntry[]
}

/**
 * Feature requests worth prerendering a `<head>` for.
 *
 * Two pages, not one: the most voted are the ones people link to, and the
 * newest are the ones their author has just shared. Both are capped by the
 * API's own page size, which keeps the file budget bounded no matter how large
 * the board grows. Anything outside them still works, it just falls back to the
 * generic shell in a crawler's preview until the next build.
 */
async function fetchFeatureRequests(): Promise<FeatureApiEntry[]> {
  const byUrl = new Map<string, FeatureApiEntry>()

  for (const query of ['sort=votes', 'sort=newest']) {
    try {
      const res = await fetch(`${FEATURES_API}?${query}&limit=${FEATURE_PRERENDER_PAGE_SIZE}`)
      if (!res.ok) {
        console.warn(`[prerender] features API returned ${res.status} for ${query}`)
        continue
      }
      const data = (await res.json()) as FeatureApiResponse
      for (const item of data.items ?? []) {
        // Skip anything that cannot produce a title or a valid path rather than
        // interpolating `undefined` into a <title> or a URL.
        if (!item.title || !item.owner || !item.repoName || !item.number) continue
        byUrl.set(`/features/${item.owner}/${item.repoName}/${item.number}`, item)
      }
    } catch (err) {
      console.warn(`[prerender] features fetch failed (${query}):`, (err as Error).message)
    }
  }

  return Array.from(byUrl.values())
}

interface ProductApiEntry {
  productId: string
  name: string
  tagline?: string
  description?: string
  category?: { label?: string } | string | null
}

async function fetchProducts(): Promise<ProductApiEntry[]> {
  try {
    const res = await fetch(PRODUCTS_API)
    if (!res.ok) return []
    const products = (await res.json()) as ProductApiEntry[]
    // Without an id there is no URL to emit, and without a name there is no
    // title — skip rather than interpolating `undefined` into either.
    return products.filter((product) => product.productId && product.name)
  } catch (err) {
    console.warn('[prerender] products fetch failed:', (err as Error).message)
    return []
  }
}

async function fetchJobs(): Promise<JobApiEntry[]> {
  try {
    const res = await fetch(JOBS_API)
    if (!res.ok) return []
    const jobs = (await res.json()) as JobApiEntry[]
    // Skip malformed entries rather than interpolating `undefined` into a
    // <title>; every field below is required to build the SEO props.
    return jobs.filter((job) => job.slug && job.title && job.department && job.location)
  } catch (err) {
    console.warn('[prerender] jobs fetch failed:', (err as Error).message)
    return []
  }
}

/**
 * Walk a content tree and collect MDX entries: `(slug, frontmatter)`.
 * Strips the `.{locale}.mdx` suffix so each canonical slug is captured
 * once. We use the default-locale variant for SEO meta — translated
 * variants share the same URL.
 */
async function walkMdxEntries(rootDir: string): Promise<Array<{ slug: string; frontmatter: Record<string, unknown> }>> {
  if (!existsSync(rootDir)) return []
  const result: Array<{ slug: string; frontmatter: Record<string, unknown>; isDefaultLocale: boolean }> = []

  async function recurse(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir)
    for (const entry of entries) {
      const full = path.join(dir, entry)
      const stats = await stat(full)
      if (stats.isDirectory()) {
        await recurse(full, prefix ? `${prefix}/${entry}` : entry)
      } else if (entry.endsWith('.mdx')) {
        const stripped = entry.replace(/\.mdx$/, '')
        // Distinguish `welcome.mdx` (default) from `welcome.es.mdx`.
        const localeMatch = stripped.match(/\.([a-z]{2,3})$/)
        const isDefaultLocale = !localeMatch
        const slugBase = localeMatch ? stripped.replace(/\.[a-z]{2,3}$/, '') : stripped
        const slug = prefix ? `${prefix}/${slugBase}` : slugBase
        const mdxRaw = await readFile(full, 'utf8')
        const frontmatter = parseFrontmatter(mdxRaw)
        result.push({ slug, frontmatter, isDefaultLocale })
      }
    }
  }
  await recurse(rootDir, '')

  // Prefer the default-locale entry per slug; only fall back to a
  // localized version when no default exists.
  const bySlug = new Map<string, { slug: string; frontmatter: Record<string, unknown> }>()
  for (const e of result) {
    if (e.isDefaultLocale || !bySlug.has(e.slug)) {
      bySlug.set(e.slug, { slug: e.slug, frontmatter: e.frontmatter })
    }
  }
  return Array.from(bySlug.values())
}

/**
 * Minimal YAML-ish frontmatter parser. Handles `key: value` and `key: "value"`
 * lines between the leading and trailing `---` markers. Sufficient for our
 * MDX files — anything more elaborate (lists, nested objects) is left as
 * a raw string; SEO only cares about a few flat string fields.
 */
/** The document without its frontmatter block, which is metadata, not prose. */
function stripFrontmatter(source: string): string {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(source)
  return match ? source.slice(match[0].length).trim() : source.trim()
}

function parseFrontmatter(source: string): Record<string, unknown> {
  if (!source.startsWith('---')) return {}
  const end = source.indexOf('\n---', 3)
  if (end < 0) return {}
  const block = source.slice(3, end).trim()
  const out: Record<string, unknown> = {}
  for (const line of block.split('\n')) {
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

interface DocsPageMeta {
  slug: string
  title: string
  description?: string
  file: string
  section?: 'guides' | 'api'
}

/**
 * For each `(package, version, slug)` from the synced index, build the
 * URL plus its SEO props. Versioned packages always carry their version
 * in the URL; non-versioned packages skip the version segment (the
 * `defaultVersion` is implicit).
 *
 * We also read each page's MDX frontmatter to pull a `description` when
 * the synced metadata doesn't already carry one — this mirrors how
 * `DocsPage` resolves the page meta at runtime.
 */
async function enumerateDocsRoutes(): Promise<RouteEntry[]> {
  if (!existsSync(SYNCED_INDEX)) return []
  const raw = await readFile(SYNCED_INDEX, 'utf8')
  const index = JSON.parse(raw) as SyncedIndex
  const out = new Map<string, RouteEntry>()

  for (const pkg of index.packages) {
    const versioned = pkg.versioned === true
    // Package landing URL — emit at least one entry per package.
    const landingUrl = versioned
      ? `/developers/docs/${pkg.shortName}/${pkg.latestVersion}`
      : `/developers/docs/${pkg.shortName}`
    out.set(landingUrl, {
      url: landingUrl,
      seo: {
        title: `${pkg.displayName}, Oxy Docs`,
        description:
          pkg.description ?? `Documentation for ${pkg.displayName}, part of the Oxy ecosystem.`,
        canonicalPath: landingUrl,
      },
    })

    for (const version of pkg.versions) {
      for (const page of version.pages as DocsPageMeta[]) {
        // Resolve the URL for this (package, version, slug) tuple.
        let url: string
        if (versioned) {
          url = page.slug
            ? `/developers/docs/${pkg.shortName}/${version.version}/${page.slug}`
            : `/developers/docs/${pkg.shortName}/${version.version}`
        } else {
          url = page.slug
            ? `/developers/docs/${pkg.shortName}/${page.slug}`
            : `/developers/docs/${pkg.shortName}`
        }

        // The file on disk answers two questions at once: what the page's
        // description is, and what its prose says. It is read once for both.
        let description = page.description ?? pkg.description ?? `Documentation for ${pkg.displayName}.`
        let markdown: string | undefined
        const mdxPath = page.file ? path.join(SYNCED_DIR, page.file) : null
        if (mdxPath && existsSync(mdxPath)) {
          const source = await readFile(mdxPath, 'utf8')
          const fm = parseFrontmatter(source)
          if (typeof fm.description === 'string' && fm.description.length > 0) {
            description = fm.description
          }
          markdown = stripFrontmatter(source)
        }

        // Canonical points at the latest version — matches how DocsPage
        // resolves its canonical at runtime so older versions don't
        // dilute the latest version's search ranking.
        const canonicalPath = versioned
          ? page.slug
            ? `/developers/docs/${pkg.shortName}/${pkg.latestVersion}/${page.slug}`
            : `/developers/docs/${pkg.shortName}/${pkg.latestVersion}`
          : url

        out.set(url, {
          url,
          seo: {
            title: `${page.title}, ${pkg.displayName}`,
            description,
            canonicalPath,
          },
          body: markdown ? { heading: page.title, meta: pkg.displayName, markdown } : undefined,
        })
      }
    }
  }

  return Array.from(out.values())
}

async function enumerateHelpRoutes(): Promise<Array<{ url: string; seo: SEOProps }>> {
  const entries = await walkMdxEntries(HELP_DIR)
  const helpOgRoot = path.join(WEBSITE_ROOT, 'public', 'images', 'help-og')
  return entries.map(({ slug, frontmatter }) => {
    const title = typeof frontmatter.title === 'string' ? frontmatter.title : slug
    const description =
      typeof frontmatter.description === 'string'
        ? frontmatter.description
        : `Help article: ${title}.`
    // Help articles get auto-generated OG cards under public/images/help-og/.
    // Author-set `coverImage:` in frontmatter wins; otherwise we point at the
    // generated PNG iff the build step actually wrote one.
    let ogImage: string | undefined
    if (typeof frontmatter.coverImage === 'string' && frontmatter.coverImage.length > 0) {
      ogImage = frontmatter.coverImage
    } else if (existsSync(path.join(helpOgRoot, `${slug}.png`))) {
      ogImage = `${SITE_URL}/images/help-og/${slug}.png`
    }
    return {
      url: `/help/${slug}`,
      seo: {
        title,
        description,
        canonicalPath: `/help/${slug}`,
        ogImage,
      },
    }
  })
}

async function enumerateAcademyRoutes(): Promise<Array<{ url: string; seo: SEOProps }>> {
  const entries = await walkMdxEntries(ACADEMY_DIR)
  const courses = new Set<string>()
  const lessons: Array<{ url: string; seo: SEOProps }> = []
  for (const { slug, frontmatter } of entries) {
    const slash = slug.indexOf('/')
    if (slash < 0) continue
    const course = slug.slice(0, slash)
    courses.add(course)
    const title = typeof frontmatter.title === 'string' ? frontmatter.title : slug
    const description =
      typeof frontmatter.description === 'string'
        ? frontmatter.description
        : `Academy lesson: ${title}.`
    lessons.push({
      url: `/academy/${slug}`,
      seo: {
        // Mirrors `LessonPage`'s `<SEO title>`; the course title comes from the
        // same `ACADEMY_COURSES` catalog the SPA reads.
        title: `${title}, ${courseTitle(course)}`,
        description,
        canonicalPath: `/academy/${slug}`,
      },
    })
  }
  const courseRoutes = Array.from(courses).map<{ url: string; seo: SEOProps }>((course) => {
    const meta = COURSE_BY_SLUG.get(course)
    return {
      url: `/academy/${course}`,
      seo: {
        // `CourseDetailPage` renders the bare `course.title`; match it exactly.
        title: meta?.title ?? prettifySlug(course),
        description: meta?.summary ?? `Course: ${prettifySlug(course)} on Oxy Academy.`,
        canonicalPath: `/academy/${course}`,
      },
    }
  })
  return [...courseRoutes, ...lessons]
}

function prettifySlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => (part ? part[0]?.toUpperCase() + part.slice(1) : ''))
    .join(' ')
}

function newsroomImage(post: NewsroomApiPost): string | undefined {
  if (post.ogImage) return post.ogImage
  if (typeof post.coverImage === 'string') return post.coverImage
  if (post.coverImage && typeof post.coverImage.url === 'string') return post.coverImage.url
  return undefined
}

function newsroomDateline(post: NewsroomApiPost): string | undefined {
  const published = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined
  return [post.categories?.[0], published].filter(Boolean).join(' · ') || undefined
}

function buildNewsroomRoutes(posts: NewsroomApiPost[]): RouteEntry[] {
  return posts.map((post) => ({
    url: `/newsroom/${post.slug}`,
    body: post.content
      ? {
          heading: post.title,
          meta: newsroomDateline(post),
          standfirst: post.resume,
          markdown: post.content,
        }
      : undefined,
    seo: {
      title: post.metaTitle || post.title,
      description: post.description || post.resume || post.title,
      canonicalPath: `/newsroom/${post.slug}`,
      ogImage: newsroomImage(post),
      ogType: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
  }))
}

function buildFeatureRoutes(features: FeatureApiEntry[]): Array<{ url: string; seo: SEOProps }> {
  return features.map((feature) => ({
    url: featureRequestPath(feature.owner, feature.repoName, feature.number),
    seo: {
      // Mirrors `FeatureRequestPage`'s `<SEO>` props, through the same helpers,
      // so the baked <head> and the client-rendered one cannot disagree.
      title: feature.title,
      description: featureRequestDescription(feature.description ?? '', feature.title),
      canonicalPath: featureRequestPath(feature.owner, feature.repoName, feature.number),
      ogType: 'article',
      publishedTime: feature.createdAt,
      modifiedTime: feature.updatedAt,
      author: feature.author,
    },
  }))
}

function buildAppRoutes(products: ProductApiEntry[]): Array<{ url: string; seo: SEOProps }> {
  return products.map((product) => {
    const category = typeof product.category === 'object' && product.category ? (product.category.label ?? '') : ''
    return {
      url: `/apps/${product.productId}`,
      seo: {
        // Mirrors `AppDetailContent`'s `<SEO>` props verbatim so the
        // prerendered <head> matches the client-rendered one.
        title: `${product.name}, ${category || 'Oxy'}`,
        description: product.tagline || product.description || '',
        canonicalPath: `/apps/${product.productId}`,
      },
    }
  })
}

function buildJobRoutes(jobs: JobApiEntry[]): Array<{ url: string; seo: SEOProps }> {
  return jobs.map((job) => ({
    url: `/company/careers/${job.slug}`,
    seo: {
      // Mirrors `CareerDetailPage`'s `<SEO>` props verbatim so the prerendered
      // <head> and the client-rendered one produce the same title/description.
      title: `${job.title}, ${job.department}`,
      description:
        job.subtitle ||
        `Join Oxy as ${job.title}. ${job.location}. ${job.engagement ?? job.type ?? 'Full-time'}.`,
      canonicalPath: `/company/careers/${job.slug}`,
    },
  }))
}

/* ── All routes ───────────────────────────────────────────────────── */

/**
 * Locales whose `/<code>/…` mirror we prerender.
 *
 * Filters on `translationReady` and NOTHING else. That flag is computed
 * server-side (`server/utils/localeReadiness.ts`) from the same helper the
 * sitemap uses, so the sitemap and this build can never advertise different
 * locale sets. Re-deriving readiness here from `translationCount` would let the
 * two silently drift, which is the one outcome we're trying to avoid.
 *
 * `enabled` is deliberately NOT a proxy: it defaults to true the moment a
 * locale row is created, long before any translation exists.
 *
 * Returns `[]` on any failure or when nothing qualifies. That is a correct,
 * non-fatal outcome — it just means no locale-prefixed pages get emitted.
 */
async function fetchTranslationReadyLocales(): Promise<{
  locales: Locale[]
  seed: SEOLocaleSeed[]
}> {
  let entries: SEOLocaleSeed[]
  try {
    const res = await fetch(LOCALES_API)
    if (!res.ok) {
      console.warn(`[prerender] locales API returned ${res.status} — no locale-prefixed pages.`)
      return { locales: [], seed: [] }
    }
    entries = (await res.json()) as SEOLocaleSeed[]
  } catch (err) {
    console.warn('[prerender] locales fetch failed — no locale-prefixed pages:', (err as Error).message)
    return { locales: [], seed: [] }
  }

  const locales: Locale[] = []
  for (const entry of entries) {
    if (entry.translationReady !== true) continue
    const code = entry.code as Locale
    if (!SUPPORTED_LOCALES.includes(code)) continue
    // The default locale is served ONLY at the bare path, so it never gets a
    // prefixed mirror. Keyed on the STATIC `DEFAULT_LOCALE` rather than the
    // CMS `isDefault`, matching `App.tsx` / `SEO.tsx` / `locale-context.tsx`:
    // the URL shape must not shift when someone flips a CMS toggle.
    if (code === DEFAULT_LOCALE) continue
    if (!locales.includes(code)) locales.push(code)
  }
  return { locales, seed: entries }
}

/**
 * Mirror every base route under each translation-ready locale. The base
 * (default-locale) routes keep their bare paths; `seo` is shared untouched
 * because `canonicalPath` must stay bare — `<SEO>` derives the localized
 * canonical, hreflang and x-default from it plus the active locale.
 */
function expandRoutesForLocales(base: RenderJob[], locales: readonly Locale[]): RenderJob[] {
  if (locales.length === 0) return base
  const expanded: RenderJob[] = [...base]
  for (const locale of locales) {
    for (const job of base) {
      expanded.push({
        // No `body`: the markdown behind it is the default locale's text, and a
        // `/es/` URL serving English prose reads worse to a crawler than one
        // serving none.
        url: job.url === '/' ? `/${locale}` : `/${locale}${job.url}`,
        seo: job.seo,
        locale,
      })
    }
  }
  return expanded
}

async function enumerateAllRoutes(): Promise<RouteEntry[]> {
  const result = new Map<string, RouteEntry>()

  for (const [url, seo] of Object.entries(STATIC_ROUTE_SEO)) {
    result.set(url, { url, seo })
  }

  const [news, jobs, apps, features, helpRoutes, academyRoutes, docsRoutes] = await Promise.all([
    fetchNewsroomPosts(),
    fetchJobs(),
    fetchProducts(),
    fetchFeatureRequests(),
    enumerateHelpRoutes(),
    enumerateAcademyRoutes(),
    enumerateDocsRoutes(),
  ])

  for (const entry of buildNewsroomRoutes(news)) result.set(entry.url, entry)
  for (const { url, seo } of buildJobRoutes(jobs)) result.set(url, { url, seo })
  for (const { url, seo } of buildAppRoutes(apps)) result.set(url, { url, seo })
  for (const { url, seo } of buildFeatureRoutes(features)) result.set(url, { url, seo })
  for (const { url, seo } of helpRoutes) result.set(url, { url, seo })
  for (const { url, seo } of academyRoutes) result.set(url, { url, seo })
  for (const entry of docsRoutes) result.set(entry.url, entry)

  return Array.from(result.values())
}

/* ── HTML emission ────────────────────────────────────────────────── */

async function loadShellHtml(): Promise<string> {
  return readFile(path.join(DIST_DIR, 'index.html'), 'utf8')
}

/**
 * Tag-level regex set for the head fragments we override. Static tags
 * outside this set (favicon, manifest, preconnects, host-meta and
 * theme-fouc inline scripts, structured data) stay in place — they're shared across
 * every page and don't depend on the route.
 */
const STRIP_PATTERNS: ReadonlyArray<RegExp> = [
  /<title[^>]*>[\s\S]*?<\/title>\s*/gi,
  /<meta\s+name=["']description["'][^>]*>\s*/gi,
  /<meta\s+property=["']og:[^"']*["'][^>]*>\s*/gi,
  /<meta\s+name=["']twitter:[^"']*["'][^>]*>\s*/gi,
  /<link\s+rel=["']canonical["'][^>]*>\s*/gi,
  /<link\s+rel=["']alternate["'][^>]*hreflang=[^>]*>\s*/gi,
  /<meta\s+name=["']theme-color["'][^>]*>\s*/gi,
  /<meta\s+property=["']article:[^"']*["'][^>]*>\s*/gi,
  /<meta\s+name=["']robots["'][^>]*>\s*/gi,
]

function stripExistingMeta(shell: string): string {
  let out = shell
  for (const pattern of STRIP_PATTERNS) out = out.replace(pattern, '')
  return out
}

/**
 * Localize the shell's `<html lang dir>` for a locale mirror.
 *
 * `<SEO>` sets these via helmet's `htmlAttributes`, but the prerender only
 * splices `<title>/<meta>/<link>` into the static shell — attributes on the
 * `<html>` element itself are not part of that fragment. Without this a
 * prerendered `/es/...` page ships `lang="en"`, which is what crawlers and
 * screen readers read before hydration.
 */
function applyHtmlLang(shell: string, locale: Locale): string {
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr'
  return shell.replace(
    /<html\b[^>]*>/i,
    (tag) =>
      tag
        .replace(/\slang=(["'])[^"']*\1/i, ` lang="${locale}"`)
        .replace(/\sdir=(["'])[^"']*\1/i, ` dir="${dir}"`),
  )
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char)
}

/**
 * Put the page's prose inside the container the app mounts into.
 *
 * `createRoot` empties that container before its first render, so this is what
 * a crawler that runs no JavaScript reads, and what a reader sees for the
 * moment before the bundle takes over — the same text either way, in the same
 * classes.
 */
/**
 * How much prose one document may carry.
 *
 * The generated API references are the reason there is a limit at all: one
 * typedoc class page is 200 kB of markdown and renders to nearly a megabyte of
 * HTML, which is a disproportionate thing to send ahead of a bundle that will
 * replace it. The cut is on a blank line so it never lands mid-sentence, and
 * every capped page is reported at the end of the build — a bound nothing
 * announces reads as full coverage to whoever looks next.
 */
const MAX_PROSE_CHARS = 40_000
const cappedRoutes: Array<{ url: string; chars: number }> = []

function capProse(markdown: string, url: string): string {
  if (markdown.length <= MAX_PROSE_CHARS) return markdown
  const head = markdown.slice(0, MAX_PROSE_CHARS)
  const boundary = head.lastIndexOf('\n\n')
  cappedRoutes.push({ url, chars: markdown.length })
  return boundary > MAX_PROSE_CHARS / 2 ? head.slice(0, boundary) : head
}

function injectBody(
  shell: string,
  body: PageBody,
  url: string,
  renderMarkdownBody: RenderMarkdownFn,
): string {
  const parts = [
    `<h1 class="text-heading-responsive-lg text-text">${escapeHtml(body.heading)}</h1>`,
    body.meta ? `<p class="mt-4 text-sm text-text-secondary">${escapeHtml(body.meta)}</p>` : '',
    body.standfirst ? `<p class="mt-6 text-lg text-text">${escapeHtml(body.standfirst)}</p>` : '',
    `<div class="mt-10">${renderMarkdownBody(capProse(body.markdown, url))}</div>`,
  ]
  const article = `<article class="mx-auto w-full max-w-[46rem] px-4 py-16">${parts.join('')}</article>`
  const root = '<div id="root"></div>'
  const idx = shell.indexOf(root)
  if (idx < 0) throw new Error('[prerender] shell missing an empty #root container')
  return `${shell.slice(0, idx)}<div id="root">${article}</div>${shell.slice(idx + root.length)}`
}

function injectHead(shell: string, headHtml: string): string {
  const idx = shell.indexOf('</head>')
  if (idx < 0) throw new Error('[prerender] shell missing </head>')
  return `${shell.slice(0, idx)}    ${headHtml}\n  ${shell.slice(idx)}`
}

function assertSafeRoutePath(routePath: string): string {
  if (!routePath.startsWith('/')) {
    throw new Error(`route path must be absolute: ${routePath}`)
  }
  if (routePath.includes('\\') || routePath.includes('\0') || routePath.includes('?') || routePath.includes('#')) {
    throw new Error(`route path contains unsupported characters: ${routePath}`)
  }

  const normalized = path.posix.normalize(routePath)
  if (normalized !== routePath.replace(/\/+$/, '') && !(routePath === '/' && normalized === '/')) {
    throw new Error(`route path is not normalized: ${routePath}`)
  }

  for (const segment of normalized.split('/')) {
    if (segment === '..' || segment === '.') {
      throw new Error(`route path contains traversal segment: ${routePath}`)
    }
  }

  return normalized
}

function assertInsideDist(filePath: string): string {
  const resolvedDist = path.resolve(DIST_DIR)
  const resolvedFile = path.resolve(filePath)
  const relative = path.relative(resolvedDist, resolvedFile)
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return resolvedFile
  }
  throw new Error(`refusing to write outside dist: ${resolvedFile}`)
}

function pathToFile(routePath: string): string {
  const safeRoutePath = assertSafeRoutePath(routePath)
  if (safeRoutePath === '/') return assertInsideDist(path.join(DIST_DIR, 'index.html'))
  const clean = safeRoutePath.replace(/^\/+/, '').replace(/\/+$/, '')
  return assertInsideDist(path.join(DIST_DIR, clean, 'index.html'))
}

/**
 * The prose a route can put in the document it serves.
 *
 * Only the two families whose content IS markdown carry one — newsroom posts
 * and the synced documentation. A marketing page is built from components, so
 * there is no honest text to emit for it and it keeps the empty shell rather
 * than gaining a heading that repeats its own `<title>`.
 */
interface PageBody {
  /** The page's own H1. */
  heading: string
  /** A dateline, a package name — whatever the page shows under its title. */
  meta?: string
  /** The standfirst, where the page has one. */
  standfirst?: string
  /** The page's body, in markdown. */
  markdown: string
}

/** A route the build will write, with the prose it can serve if it has any. */
interface RouteEntry {
  url: string
  seo: SEOProps
  body?: PageBody
}

interface RenderJob {
  url: string
  /** Always the bare-path SEO props; the locale prefix lives in `url`. */
  seo: SEOProps
  /** Set only for locale-prefixed mirrors; absent means the default locale. */
  locale?: Locale
  /** Absent for routes with no markdown of their own. */
  body?: PageBody
}

/**
 * Fetch the CMS-managed SEO for one route. Best-effort: if the API is unseeded
 * or unreachable, returns null and that route falls back to its enumerated
 * props, so the build never breaks on a missing backend.
 */
async function fetchSeoData(routePath: string): Promise<SeoData | null> {
  try {
    const url = new URL(SEO_API)
    url.searchParams.set('brand', 'oxy')
    url.searchParams.set('path', routePath)
    const res = await fetch(url.toString())
    if (!res.ok) return null
    return (await res.json()) as SeoData
  } catch (err) {
    console.warn('[prerender] SEO CMS fetch failed, using fallback meta:', (err as Error).message)
    return null
  }
}

async function writeRoute(
  ssr: SsrRenderers,
  shell: string,
  job: RenderJob,
  localeSeed: SEOLocaleSeed[],
): Promise<boolean> {
  try {
    // CMS SEO is keyed on the bare canonical path — a locale mirror shares the
    // same entry rather than looking up a `/es/...` key that does not exist.
    const seoData = await fetchSeoData(job.seo.canonicalPath)
    const { head } = ssr.renderSEO(job.seo, seoData, { locale: job.locale, locales: localeSeed })
    if (!head) {
      console.warn(`[prerender] empty head for ${job.url}`)
    }
    const localized = job.locale ? applyHtmlLang(shell, job.locale) : shell
    const withBody = job.body
      ? injectBody(localized, job.body, job.url, ssr.renderMarkdownBody)
      : localized
    const stripped = stripExistingMeta(withBody)
    const html = injectHead(stripped, head)
    const outFile = pathToFile(job.url)
    await mkdir(path.dirname(outFile), { recursive: true })
    await writeFile(outFile, html, 'utf8')
    return true
  } catch (err) {
    console.error(`[prerender] failed for ${job.url}:`, (err as Error).message)
    return false
  }
}

/**
 * Count everything under `dist/` that is NOT a route document, i.e. the assets
 * `vite build` emitted. Every `index.html` is excluded because those are this
 * script's own output: counting them would double-count on a re-run (the
 * previous run's pages plus the pages we are about to write) and could fail a
 * local build that CI, which always starts from a fresh `dist/`, would pass.
 */
async function countNonRouteFiles(dir: string): Promise<number> {
  if (!existsSync(dir)) return 0
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries.filter((entry) => entry.isFile() && entry.name !== 'index.html').length
}

/**
 * Deploy audit trail: what this build actually emitted.
 *
 * NOT a consumed input. `SEO.tsx` advertises hreflang from `translationReady`
 * on the live `/api/locales`, and `localeReadiness.ts` stays the single
 * authority shared with the sitemap — this file must never become a second
 * source those two have to be kept in sync with. It exists so a shipped
 * `dist/` can be inspected after the fact ("which locales does this deploy
 * contain?") without re-querying an API whose answer may have moved since.
 */
/**
 * Emit `dist/sitemap.xml` from the same route list that was just rendered.
 *
 * Written from `baseRoutes` (bare paths) rather than the locale-expanded jobs:
 * each locale is an `xhtml:link` alternate on its canonical `<url>`, not a
 * separate entry. `noIndex` routes are excluded — advertising a page that tells
 * crawlers not to index it is a contradiction Search Console reports as an
 * error.
 */
async function writeSitemap(
  routes: ReadonlyArray<{ url: string; seo: SEOProps }>,
  locales: readonly Locale[],
): Promise<void> {
  const entries: SitemapEntry[] = routes
    .filter((route) => !route.seo.noIndex)
    .map((route) => ({
      path: route.url,
      lastmod: toW3CDate(route.seo.modifiedTime ?? route.seo.publishedTime),
      ...classifyRoute(route.url),
    }))
    .sort((a, b) => b.priority - a.priority || a.path.localeCompare(b.path))

  const xml = buildSitemapXml(entries, {
    siteUrl: SITE_URL,
    defaultLocale: DEFAULT_LOCALE,
    localeCodes: locales,
  })
  await writeFile(path.join(DIST_DIR, 'sitemap.xml'), xml, 'utf8')
  console.log(`[prerender] wrote sitemap.xml (${entries.length} urls, ${locales.length} alternate locales)`)
}

async function writeLocaleManifest(locales: readonly Locale[]): Promise<void> {
  const outFile = path.join(DIST_DIR, 'prerendered-locales.json')
  const payload = { defaultLocale: DEFAULT_LOCALE, prerendered: locales }
  await writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

/* ── Main ─────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  if (!existsSync(DIST_DIR)) {
    throw new Error(`[prerender] dist missing at ${DIST_DIR} — run vite build first`)
  }

  const startTime = Date.now()

  const [ssr, baseRoutes, shell, localeInfo] = await Promise.all([
    buildSsrBundle(),
    enumerateAllRoutes(),
    loadShellHtml(),
    fetchTranslationReadyLocales(),
  ])

  const jobs = expandRoutesForLocales(baseRoutes, localeInfo.locales)

  if (localeInfo.locales.length === 0) {
    console.log(
      '[prerender] no translation-ready locales — emitting default-locale routes only. ' +
        'This is expected until a locale crosses the server-side readiness threshold.',
    )
  } else {
    console.log(
      `[prerender] translation-ready locales: ${localeInfo.locales.join(', ')} ` +
        `(+${jobs.length - baseRoutes.length} locale-prefixed routes)`,
    )
  }

  // A locale mirrors the whole tree, so the Cloudflare ceiling is reached after
  // very few locales. Fail here rather than after a green build.
  const assetFiles = await countNonRouteFiles(DIST_DIR)
  const projected = assetFiles + jobs.length
  console.log(
    `[prerender] file budget: ${assetFiles} assets + ${jobs.length} routes ` +
      `= ~${projected} (budget ${FILE_BUDGET}, Cloudflare limit ${CF_PAGES_FILE_LIMIT})`,
  )
  if (projected > FILE_BUDGET) {
    throw new Error(
      `[prerender] projected ~${projected} files exceeds the ${FILE_BUDGET} budget ` +
        `(Cloudflare Pages rejects deploys above ${CF_PAGES_FILE_LIMIT}). ` +
        `Reduce the number of prerendered locales (currently ${localeInfo.locales.length}).`,
    )
  }

  await writeLocaleManifest(localeInfo.locales)
  await writeSitemap(baseRoutes, localeInfo.locales)

  console.log(`[prerender] rendering ${jobs.length} routes…`)

  const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY ?? 16)
  let cursor = 0
  let succeeded = 0
  let failed = 0

  async function worker(): Promise<void> {
    while (cursor < jobs.length) {
      const idx = cursor++
      const job = jobs[idx]
      if (!job) continue
      const ok = await writeRoute(ssr, shell, job, localeInfo.seed)
      if (ok) succeeded++
      else failed++
      if ((idx + 1) % 100 === 0 || idx + 1 === jobs.length) {
        process.stdout.write(`\r[prerender] ${idx + 1}/${jobs.length}`)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  process.stdout.write('\n')

  // Tidy the SSR bundle so it doesn't ship to Cloudflare.
  await rm(SSR_DIR, { recursive: true, force: true })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[prerender] wrote ${succeeded} routes (${failed} failed) in ${elapsed}s`)
  if (cappedRoutes.length > 0) {
    const worst = cappedRoutes.reduce((a, b) => (b.chars > a.chars ? b : a))
    console.log(
      `[prerender] prose capped at ${MAX_PROSE_CHARS} chars on ${cappedRoutes.length} route(s); ` +
        `largest was ${worst.url} at ${worst.chars}`,
    )
  }

  // Strict by default: a prerender failure means those routes ship with the
  // generic home-page title/OG meta, which is worse than a failed build.
  // Set PRERENDER_STRICT=0 to opt out (local experiments only).
  if (failed > 0 && process.env.PRERENDER_STRICT !== '0') {
    process.exit(1)
  }
}

await main()
