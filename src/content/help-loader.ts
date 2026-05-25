import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { z } from 'zod'
import { HelpFrontmatter, DEFAULT_LOCALE, parseLocaleFromPath } from './schemas'

/* ──────────────────────────────────────────────
 * help-loader.ts
 *
 * Build-time MDX loader for `/help`. Uses Vite's `import.meta.glob` to
 * collect every `.mdx` file under `src/content/help/**`, parse its
 * frontmatter, group by `{ slug, locale }`, and expose typed entries to the
 * UI. Locale resolution falls back to `en` when a translation is missing.
 *
 * Article slug semantics: the part of the path under `src/content/help/`
 * minus the file extension and any `.{locale}` suffix. Examples:
 *
 *   src/content/help/account/add-recovery-email.mdx
 *     → { slug: 'account/add-recovery-email', locale: 'en' }
 *
 *   src/content/help/account/add-recovery-email.es.mdx
 *     → { slug: 'account/add-recovery-email', locale: 'es' }
 *
 * URL routes use the same slug verbatim: `/help/account/add-recovery-email`.
 * ──────────────────────────────────────────── */

export type HelpCategoryId =
  | 'account'
  | 'inbox'
  | 'console'
  | 'auth'
  | 'getting-started'

export interface HelpEntry {
  slug: string
  locale: string
  frontmatter: z.infer<typeof HelpFrontmatter>
  Component: LazyExoticComponent<ComponentType<Record<string, unknown>>>
}

/**
 * Static metadata about a help category. Labels are kept here (not in
 * frontmatter) so the category list stays stable even when no articles
 * exist yet in a category.
 */
export interface HelpCategoryMeta {
  id: HelpCategoryId
  label: string
  description: string
  /** Lucide icon slug used by `CategoryCardIcon`. */
  icon: string
  order: number
}

export const HELP_CATEGORIES: HelpCategoryMeta[] = [
  {
    id: 'getting-started',
    label: 'Getting started',
    description: 'Set up your Oxy account and learn the basics.',
    icon: 'sparkles',
    order: 10,
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Profile, identity, security, and account management.',
    icon: 'user-circle',
    order: 20,
  },
  {
    id: 'inbox',
    label: 'Inbox',
    description: 'End-to-end encrypted email — compose, encrypt, organize.',
    icon: 'inbox',
    order: 30,
  },
  {
    id: 'console',
    label: 'Console',
    description: 'Developer console — apps, API keys, usage metrics.',
    icon: 'layout-dashboard',
    order: 40,
  },
  {
    id: 'auth',
    label: 'Auth & sign-in',
    description: 'FedCM, sign-in flow, two-factor authentication.',
    icon: 'shield-check',
    order: 50,
  },
]

/* ─── Glob loaders ─── */

// Frontmatter glob is eager so we can build indexes / category lists without
// fetching every MDX module. We import the raw text and parse YAML ourselves;
// MDX's frontmatter export isn't directly readable from a glob without
// loading the module.
const frontmatterModules = import.meta.glob<string>('./help/**/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Lazy component glob — one chunk per article.
const componentModules = import.meta.glob<{ default: ComponentType<Record<string, unknown>> }>(
  './help/**/*.mdx',
)

/* ─── YAML frontmatter parser ─── */

interface ParsedFrontmatter {
  data: Record<string, unknown>
  body: string
}

/**
 * Parse a YAML frontmatter block — only the simple key/value forms that
 * authors actually use in help/academy/company MDX:
 *
 *   ---
 *   title: Add a recovery email
 *   description: Keep your account recoverable.
 *   category: account
 *   order: 1
 *   featured: true
 *   tags: [security, account]
 *   ---
 *
 * Numbers, booleans, strings (quoted or bare), and one-line `[a, b, c]`
 * arrays are supported. Anything fancier should go in the MDX body.
 */
function parseFrontmatter(source: string): ParsedFrontmatter {
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) {
    return { data: {}, body: source }
  }
  const end = source.indexOf('\n---', 4)
  if (end < 0) return { data: {}, body: source }
  const fmBlock = source.slice(4, end)
  const body = source.slice(end + 4).replace(/^\r?\n/, '')
  const data: Record<string, unknown> = {}
  for (const rawLine of fmBlock.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const key = line.slice(0, colon).trim()
    const valueRaw = line.slice(colon + 1).trim()
    data[key] = coerceYamlValue(valueRaw)
  }
  return { data, body }
}

function coerceYamlValue(raw: string): unknown {
  if (raw === '') return ''
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw === 'null' || raw === '~') return null
  // Quoted strings — strip the wrapping quotes and unescape `\"` / `\'`.
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1).replace(/\\(["'\\])/g, '$1')
  }
  // Inline arrays.
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim()
    if (inner === '') return []
    return inner.split(',').map((item) => coerceYamlValue(item.trim()))
  }
  // Numbers — only when the whole string is a finite numeric literal.
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
    const num = Number(raw)
    if (Number.isFinite(num)) return num
  }
  return raw
}

/* ─── Index build ─── */

interface HelpIndex {
  /** All entries keyed by `${locale}:${slug}`. */
  byKey: Map<string, HelpEntry>
  /** Entries grouped by slug. Values are sub-maps keyed by locale. */
  bySlug: Map<string, Map<string, HelpEntry>>
}

function buildIndex(): HelpIndex {
  const byKey = new Map<string, HelpEntry>()
  const bySlug = new Map<string, Map<string, HelpEntry>>()

  for (const [path, raw] of Object.entries(frontmatterModules)) {
    // Strip the `./help/` prefix to get the path relative to the content root.
    const relative = path.replace(/^\.\/help\//, '')
    const { slug, locale } = parseLocaleFromPath(relative)

    const { data } = parseFrontmatter(raw)
    const parsed = HelpFrontmatter.safeParse(data)
    if (!parsed.success) {
      // Surface broken frontmatter loudly — silent skips here lead to
      // articles disappearing from the index with no diagnostic trail.
      console.error(
        `[help-loader] invalid frontmatter for ${path}:`,
        parsed.error.flatten(),
      )
      continue
    }

    const componentLoader = componentModules[path]
    if (!componentLoader) {
      console.error(`[help-loader] no component loader for ${path}`)
      continue
    }
    const Component = lazy(componentLoader)

    const entry: HelpEntry = {
      slug,
      locale,
      frontmatter: parsed.data,
      Component,
    }
    byKey.set(`${locale}:${slug}`, entry)

    let localeMap = bySlug.get(slug)
    if (!localeMap) {
      localeMap = new Map()
      bySlug.set(slug, localeMap)
    }
    localeMap.set(locale, entry)
  }

  return { byKey, bySlug }
}

const index = buildIndex()

/* ─── Public API ─── */

/**
 * Pick the best entry for a given slug+locale. Returns the requested locale's
 * version if it exists, otherwise falls back to the default locale (`en`).
 * Returns `null` when neither exists.
 */
function pickEntry(slug: string, locale: string): HelpEntry | null {
  const localeMap = index.bySlug.get(slug)
  if (!localeMap) return null
  return localeMap.get(locale) ?? localeMap.get(DEFAULT_LOCALE) ?? null
}

/**
 * Load all help articles for the given locale, falling back per-slug to the
 * default locale when no translation exists.
 *
 * Returned entries are sorted by frontmatter `order` (ascending). Callers
 * that need a different sort (e.g. featured first) should re-sort the result.
 */
export function loadHelpArticles(locale = DEFAULT_LOCALE): HelpEntry[] {
  const out: HelpEntry[] = []
  for (const slug of index.bySlug.keys()) {
    const entry = pickEntry(slug, locale)
    if (entry) out.push(entry)
  }
  return out.sort((a, b) => a.frontmatter.order - b.frontmatter.order)
}

/** Load a single help article by slug + locale. */
export function loadHelpBySlug(slug: string, locale = DEFAULT_LOCALE): HelpEntry | null {
  return pickEntry(slug, locale)
}

/** Filter help articles to a specific category. */
export function loadHelpByCategory(
  category: HelpCategoryId,
  locale = DEFAULT_LOCALE,
): HelpEntry[] {
  return loadHelpArticles(locale).filter((a) => a.frontmatter.category === category)
}

/** Featured articles in display order, used by the "Get started" rail. */
export function loadFeaturedHelpArticles(
  locale = DEFAULT_LOCALE,
  limit = 6,
): HelpEntry[] {
  return loadHelpArticles(locale)
    .filter((a) => a.frontmatter.featured)
    .slice(0, limit)
}

/**
 * Pick prev/next siblings within the same category, sorted by frontmatter
 * `order`. Used by HelpArticlePage's footer nav.
 */
export interface HelpSiblings {
  prev: HelpEntry | null
  next: HelpEntry | null
}

export function loadHelpSiblings(
  slug: string,
  locale = DEFAULT_LOCALE,
): HelpSiblings {
  const entry = pickEntry(slug, locale)
  if (!entry) return { prev: null, next: null }
  const siblings = loadHelpByCategory(entry.frontmatter.category, locale)
  const idx = siblings.findIndex((s) => s.slug === entry.slug)
  if (idx === -1) return { prev: null, next: null }
  return {
    prev: idx > 0 ? siblings[idx - 1] ?? null : null,
    next: idx < siblings.length - 1 ? siblings[idx + 1] ?? null : null,
  }
}

/** Article count per category for landing-page card subtitles. */
export function loadHelpArticleCounts(
  locale = DEFAULT_LOCALE,
): Map<HelpCategoryId, number> {
  const counts = new Map<HelpCategoryId, number>()
  for (const entry of loadHelpArticles(locale)) {
    const prev = counts.get(entry.frontmatter.category) ?? 0
    counts.set(entry.frontmatter.category, prev + 1)
  }
  return counts
}
