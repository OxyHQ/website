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
import type { SeoData } from '../src/lib/seo'

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..')
const DIST_DIR = path.join(WEBSITE_ROOT, 'dist')
const SSR_DIR = path.join(WEBSITE_ROOT, 'dist-ssr')
const SYNCED_INDEX = path.join(WEBSITE_ROOT, 'src', 'content', '_synced', 'index.json')
const SYNCED_DIR = path.join(WEBSITE_ROOT, 'src', 'content', '_synced')
const HELP_DIR = path.join(WEBSITE_ROOT, 'src', 'content', 'help')
const ACADEMY_DIR = path.join(WEBSITE_ROOT, 'src', 'content', 'academy')
const NEWSROOM_API = 'https://website-api.oxy.so/api/newsroom?limit=500'
const JOBS_API = 'https://website-api.oxy.so/api/jobs'
const SEO_API = 'https://website-api.oxy.so/api/seo'

const SITE_URL = 'https://oxy.so'

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

interface RenderSEOFn {
  (input: SEOProps, seoData: SeoData | null): { head: string }
}

/* ── SSR bundle build ─────────────────────────────────────────────── */

async function buildSsrBundle(): Promise<RenderSEOFn> {
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
      // can't follow `@oxyhq/auth/dist/esm/WebOxyProvider`-style imports.
      noExternal: [
        '@oxyhq/auth',
        '@oxyhq/core',
        'react-helmet-async',
      ],
    },
  })

  const ssrEntry = path.join(SSR_DIR, 'entry-server.js')
  const mod = (await import(`file://${ssrEntry}`)) as { renderSEO: RenderSEOFn }
  if (typeof mod.renderSEO !== 'function') {
    throw new Error('[prerender] SSR bundle did not export renderSEO()')
  }
  return mod.renderSEO
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
      'Oxy is an independent, open-source ecosystem of ethical technology built to empower people, not exploit them. Apps, AI, an operating system, a browser, identity and more.',
    canonicalPath: '/',
  },
  '/pricing': {
    title: 'Pricing',
    description: 'Simple, transparent pricing for individuals, teams, and enterprises building on Oxy.',
    canonicalPath: '/pricing',
  },
  '/partners': {
    title: 'Partners',
    description: 'Meet the partners building on and with Oxy — agencies, integrators, and platform companies.',
    canonicalPath: '/partners',
  },
  '/referrals': {
    title: 'Referrals',
    description: 'Earn rewards by referring friends to Oxy. Get a personal referral link from your dashboard.',
    canonicalPath: '/referrals',
  },
  '/technologies': {
    title: 'Technologies',
    description: 'Explore the products and platforms that make up the Oxy ecosystem — Bloom, OxyOS, Astro, Codea, and more.',
    canonicalPath: '/technologies',
  },
  '/status': {
    title: 'Status',
    description: 'Live operational status for the Oxy platform — API, identity, messaging, and the developer console.',
    canonicalPath: '/status',
  },
  '/company': {
    title: 'Company',
    description: 'Oxy builds open, ethical technology for the next generation of the internet. Learn about our mission, team, and approach.',
    canonicalPath: '/company',
  },
  '/company/team': {
    title: 'Team',
    description: 'Meet the people building Oxy — engineers, designers, and operators across multiple continents.',
    canonicalPath: '/company/team',
  },
  '/company/manifesto': {
    title: 'Manifesto',
    description: 'Why Oxy exists, what we believe, and how we work. The principles that shape every product we ship.',
    canonicalPath: '/company/manifesto',
  },
  '/company/transparency': {
    title: 'Transparency',
    description: 'How we make decisions, how we handle data, and how we keep the platform accountable to the people who use it.',
    canonicalPath: '/company/transparency',
  },
  '/company/business': {
    title: 'Business',
    description: 'How Oxy makes money, who pays for what, and how we keep the lights on without selling your data.',
    canonicalPath: '/company/business',
  },
  '/company/careers': {
    title: 'Careers',
    description: 'Help us build a better internet. Open positions across engineering, design, and operations at Oxy.',
    canonicalPath: '/company/careers',
  },
  '/company/news': {
    title: 'Blog',
    description: 'Engineering deep dives, product updates, and notes from across the Oxy ecosystem.',
    canonicalPath: '/company/news',
  },
  '/newsroom': {
    title: 'Newsroom',
    description: 'Announcements, product launches, and engineering digests from across the Oxy ecosystem.',
    canonicalPath: '/newsroom',
  },
  '/academy': {
    title: 'Academy',
    description: 'Free, self-paced courses on Oxy ID, the platform APIs, and building on the Oxy ecosystem.',
    canonicalPath: '/academy',
  },
  '/help': {
    title: 'Help Center',
    description: 'How-tos, troubleshooting, and reference material for every Oxy product.',
    canonicalPath: '/help',
  },
  '/changelog': {
    title: 'Changelog',
    description: 'Release notes for the Oxy ecosystem — every shipped feature, fix, and breaking change.',
    canonicalPath: '/changelog',
  },
  '/developers': {
    title: 'Developers',
    description: 'Build on Oxy. SDKs, REST APIs, FedCM, OAuth, and reference apps for every layer of the platform.',
    canonicalPath: '/developers',
  },
  '/developers/docs': {
    title: 'Documentation',
    description: 'Developer docs for every Oxy SDK, app, and platform API — version-locked, searchable, and open source.',
    canonicalPath: '/developers/docs',
  },
  '/codea': {
    title: 'Codea',
    description: 'The AI-powered code editor — VS Code, native, with multi-model agents and your repo as context.',
    canonicalPath: '/codea',
  },
  '/codea/extension': {
    title: 'Codex Extension for VS Code',
    description: 'Bring Codea-style agents to your existing VS Code install via the Codex extension.',
    canonicalPath: '/codea/extension',
  },
  '/inbox': {
    title: 'Inbox — End-to-end encrypted email',
    description: 'A modern, end-to-end encrypted inbox built on Oxy ID — your keys, your data, no scanning.',
    canonicalPath: '/inbox',
  },
  '/ai': {
    title: 'Oxy AI',
    description: 'Oxy AI is Alia, an AI assistant built on the open, privacy first Oxy ecosystem.',
    canonicalPath: '/ai',
  },
  '/ai/pricing': {
    title: 'AI Pricing',
    description: 'Predictable usage-based pricing for the Oxy AI assistant — pay only for what you ask.',
    canonicalPath: '/ai/pricing',
  },
  '/initiative': {
    title: 'Initiative',
    description: 'Hold yourself and your team accountable to the work that matters. Oxy Initiative tracks the projects, not the tasks.',
    canonicalPath: '/initiative',
  },
  '/os': {
    title: 'OxyOS',
    description: 'A privacy-first, Android-derived operating system shipped with Oxy ID, encrypted backup, and your data under your keys.',
    canonicalPath: '/os',
  },
  '/tnp': {
    title: 'TNP — The Name Project',
    description: 'A decentralized alternative DNS / namespace system. Get your own .pres handle and own your identity end to end.',
    canonicalPath: '/tnp',
  },
  '/tnp/install': {
    title: 'Install TNP',
    description: 'Step-by-step setup for resolving the TNP namespace on macOS, Linux, Windows, iOS, and Android.',
    canonicalPath: '/tnp/install',
  },
  '/legal': {
    title: 'Legal',
    description: 'Terms of service, privacy policy, acceptable use policy, data-processing agreement, and security disclosures for Oxy.',
    canonicalPath: '/legal',
  },
  '/legal/privacy': {
    title: 'Privacy Policy',
    description: 'How Oxy collects, processes, and stores your data. Updated whenever the policy changes.',
    canonicalPath: '/legal/privacy',
  },
  '/legal/terms': {
    title: 'Terms of Service',
    description: 'The terms under which you use Oxy products and APIs.',
    canonicalPath: '/legal/terms',
  },
  '/legal/dpa': {
    title: 'Data Processing Agreement',
    description: 'GDPR-aligned DPA for organizations processing personal data through Oxy.',
    canonicalPath: '/legal/dpa',
  },
  '/legal/aup': {
    title: 'Acceptable Use Policy',
    description: "What you can and can't do on Oxy. Read this before deploying anything that touches users.",
    canonicalPath: '/legal/aup',
  },
  '/legal/cookies': {
    title: 'Cookies Policy',
    description: 'How Oxy uses cookies, localStorage, and similar technologies — and how to opt out.',
    canonicalPath: '/legal/cookies',
  },
  '/legal/security': {
    title: 'Security',
    description: 'How Oxy keeps your data safe — encryption, key handling, infrastructure, and our responsible disclosure program.',
    canonicalPath: '/legal/security',
  },
  '/astro': {
    title: 'Astro Browser',
    description: 'A privacy-first Chromium-based browser shipped with Oxy ID, native FedCM, and your data under your keys.',
    canonicalPath: '/astro',
  },
  '/features': {
    title: 'Feature Requests',
    description: 'Vote on what Oxy ships next — the public roadmap for every product in the ecosystem.',
    canonicalPath: '/features',
  },
  '/sustain': {
    title: 'Sustain',
    description: 'Support Oxy directly. Recurring contributions keep the open-source side of the ecosystem alive.',
    canonicalPath: '/sustain',
  },
  // FairCoin marketing surfaces on oxy.so (the apex on fairco.in gets its
  // own brand chrome but renders the same components).
  '/faircoin': {
    title: 'FairCoin, community run cryptocurrency',
    description:
      'FairCoin is a community run cryptocurrency. Decentralized, fair, free of speculation. Hybrid PoW and PoS, capped at 33M coins.',
    canonicalPath: '/faircoin',
  },
  '/faircoin/buy': {
    title: 'Buy FairCoin',
    description: 'Buy FAIR with USDC. Bridge to WFAIR on Base, then unwrap to native FairCoin.',
    canonicalPath: '/faircoin/buy',
  },
  '/faircoin/unwrap': {
    title: 'Redeem FairCoin',
    description: 'Unwrap WFAIR on Base back to native FairCoin.',
    canonicalPath: '/faircoin/unwrap',
  },
  '/faircoin/bridge': {
    title: 'FairCoin bridge, WFAIR on Base',
    description:
      'Technical reference for the WFAIR bridge. 1:1 wrapped FairCoin on Base. Contract, source, status, reserves and API endpoints.',
    canonicalPath: '/faircoin/bridge',
  },
  '/faircoin/wallet': {
    title: 'FAIRWallet',
    description: 'FAIRWallet is a self custody wallet for receiving, sending and staking FairCoin.',
    canonicalPath: '/faircoin/wallet',
  },
}

/* ── Dynamic route resolvers ──────────────────────────────────────── */

interface NewsroomApiPost {
  slug: string
  status?: string
  title: string
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

interface JobApiEntry {
  slug: string
  title?: string
  description?: string
  status?: string
}

interface JobsApiResponse {
  jobs?: JobApiEntry[]
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

async function fetchJobs(): Promise<JobApiEntry[]> {
  try {
    const res = await fetch(JOBS_API)
    if (!res.ok) return []
    const data = (await res.json()) as JobsApiResponse
    return (data.jobs ?? []).filter((j) => (j.status ?? 'open') !== 'closed' && j.slug)
  } catch {
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
async function enumerateDocsRoutes(): Promise<Array<{ url: string; seo: SEOProps }>> {
  if (!existsSync(SYNCED_INDEX)) return []
  const raw = await readFile(SYNCED_INDEX, 'utf8')
  const index = JSON.parse(raw) as SyncedIndex
  const out = new Map<string, SEOProps>()

  for (const pkg of index.packages) {
    const versioned = pkg.versioned === true
    // Package landing URL — emit at least one entry per package.
    const landingUrl = versioned
      ? `/developers/docs/${pkg.shortName}/${pkg.latestVersion}`
      : `/developers/docs/${pkg.shortName}`
    out.set(landingUrl, {
      title: `${pkg.displayName} — Oxy Docs`,
      description:
        pkg.description ?? `Documentation for ${pkg.displayName}, part of the Oxy ecosystem.`,
      canonicalPath: landingUrl,
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

        // Try to pull a description from the MDX frontmatter on disk.
        let description = page.description ?? pkg.description ?? `Documentation for ${pkg.displayName}.`
        const mdxPath = page.file ? path.join(SYNCED_DIR, page.file) : null
        if (mdxPath && existsSync(mdxPath)) {
          const fm = parseFrontmatter(await readFile(mdxPath, 'utf8'))
          if (typeof fm.description === 'string' && fm.description.length > 0) {
            description = fm.description
          }
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
          title: `${page.title} — ${pkg.displayName}`,
          description,
          canonicalPath,
        })
      }
    }
  }

  return Array.from(out.entries()).map(([url, seo]) => ({ url, seo }))
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
        title: `${title} — Oxy Academy`,
        description,
        canonicalPath: `/academy/${slug}`,
      },
    })
  }
  const courseRoutes = Array.from(courses).map<{ url: string; seo: SEOProps }>((course) => ({
    url: `/academy/${course}`,
    seo: {
      title: `${prettifySlug(course)} — Oxy Academy`,
      description: `Course: ${prettifySlug(course)} on Oxy Academy.`,
      canonicalPath: `/academy/${course}`,
    },
  }))
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

function buildNewsroomRoutes(posts: NewsroomApiPost[]): Array<{ url: string; seo: SEOProps }> {
  return posts.map((post) => ({
    url: `/newsroom/${post.slug}`,
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

function buildJobRoutes(jobs: JobApiEntry[]): Array<{ url: string; seo: SEOProps }> {
  return jobs.map((job) => ({
    url: `/company/careers/${job.slug}`,
    seo: {
      title: job.title ? `${job.title} — Careers at Oxy` : `Career — ${job.slug}`,
      description:
        job.description ?? `Open position at Oxy — apply via the careers page.`,
      canonicalPath: `/company/careers/${job.slug}`,
    },
  }))
}

/* ── All routes ───────────────────────────────────────────────────── */

async function enumerateAllRoutes(): Promise<Array<{ url: string; seo: SEOProps }>> {
  const result = new Map<string, SEOProps>()

  for (const [url, seo] of Object.entries(STATIC_ROUTE_SEO)) {
    result.set(url, seo)
  }

  const [news, jobs, helpRoutes, academyRoutes, docsRoutes] = await Promise.all([
    fetchNewsroomPosts(),
    fetchJobs(),
    enumerateHelpRoutes(),
    enumerateAcademyRoutes(),
    enumerateDocsRoutes(),
  ])

  for (const { url, seo } of buildNewsroomRoutes(news)) result.set(url, seo)
  for (const { url, seo } of buildJobRoutes(jobs)) result.set(url, seo)
  for (const { url, seo } of helpRoutes) result.set(url, seo)
  for (const { url, seo } of academyRoutes) result.set(url, seo)
  for (const { url, seo } of docsRoutes) result.set(url, seo)

  return Array.from(result.entries()).map(([url, seo]) => ({ url, seo }))
}

/* ── HTML emission ────────────────────────────────────────────────── */

async function loadShellHtml(): Promise<string> {
  return readFile(path.join(DIST_DIR, 'index.html'), 'utf8')
}

/**
 * Tag-level regex set for the head fragments we override. Static tags
 * outside this set (favicon, manifest, host-meta.js, structured-data
 * script, theme-fouc script) stay in place — they're shared across
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

function injectHead(shell: string, headHtml: string): string {
  const idx = shell.indexOf('</head>')
  if (idx < 0) throw new Error('[prerender] shell missing </head>')
  return `${shell.slice(0, idx)}    ${headHtml}\n  ${shell.slice(idx)}`
}

function pathToFile(routePath: string): string {
  if (routePath === '/') return path.join(DIST_DIR, 'index.html')
  const clean = routePath.replace(/^\/+/, '').replace(/\/+$/, '')
  return path.join(DIST_DIR, clean, 'index.html')
}

interface RenderJob {
  url: string
  seo: SEOProps
}

/**
 * Fetch the CMS-managed SEO once for the whole build. Best-effort: if the API
 * is unseeded or unreachable, returns null and every route falls back to its
 * enumerated props, so the build never breaks on a missing backend.
 */
async function fetchSeoData(): Promise<SeoData | null> {
  try {
    const res = await fetch(SEO_API)
    if (!res.ok) return null
    return (await res.json()) as SeoData
  } catch (err) {
    console.warn('[prerender] SEO CMS fetch failed, using fallback meta:', (err as Error).message)
    return null
  }
}

async function writeRoute(
  renderSEO: RenderSEOFn,
  shell: string,
  job: RenderJob,
  seoData: SeoData | null,
): Promise<boolean> {
  try {
    const { head } = renderSEO(job.seo, seoData)
    if (!head) {
      console.warn(`[prerender] empty head for ${job.url}`)
    }
    const stripped = stripExistingMeta(shell)
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

/* ── Main ─────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  if (!existsSync(DIST_DIR)) {
    throw new Error(`[prerender] dist missing at ${DIST_DIR} — run vite build first`)
  }

  const startTime = Date.now()

  const [renderSEO, jobs, shell, seoData] = await Promise.all([
    buildSsrBundle(),
    enumerateAllRoutes(),
    loadShellHtml(),
    fetchSeoData(),
  ])

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
      const ok = await writeRoute(renderSEO, shell, job, seoData)
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

  if (failed > 0 && process.env.PRERENDER_STRICT === '1') {
    process.exit(1)
  }
}

await main()
