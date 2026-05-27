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
  /**
   * Resolved cover image URL — author-set `coverImage` from frontmatter when
   * present, otherwise the auto-generated OG card at
   * `/images/help-og/<slug>.png` produced by `scripts/build-help-og-images.ts`.
   * Listing cards and the article header should prefer this over
   * `frontmatter.coverImage` so unset articles fall back to the generated PNG.
   */
  cover: string
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

/**
 * Eager metadata glob. Each compiled MDX module exposes `frontmatter` as a
 * named export (via `remark-mdx-frontmatter`) plus the default component.
 * We only read `frontmatter` here; the default component is wrapped via the
 * lazy glob below so individual articles still ship as their own chunks.
 */
interface MdxModuleMeta {
  frontmatter: Record<string, unknown>
  default: ComponentType<Record<string, unknown>>
}

const eagerModules = import.meta.glob<MdxModuleMeta>('./help/**/*.mdx', {
  eager: true,
})

// Lazy component glob — one chunk per article.
const componentModules = import.meta.glob<{ default: ComponentType<Record<string, unknown>> }>(
  './help/**/*.mdx',
)

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

  for (const [path, mod] of Object.entries(eagerModules)) {
    // Strip the `./help/` prefix to get the path relative to the content root.
    const relative = path.replace(/^\.\/help\//, '')
    const { slug, locale } = parseLocaleFromPath(relative)

    const parsed = HelpFrontmatter.safeParse(mod.frontmatter ?? {})
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

    // Generated OG card fallback. `scripts/build-help-og-images.ts` writes
    // a card per `(locale, slug)` pair — the default locale keeps the bare
    // path for backwards-compat with existing OG URLs, every other locale
    // nests under `/<locale>/`. Author-set covers always win.
    const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
    const generatedCover = `/images/help-og${localePrefix}/${slug}.png`
    const cover = parsed.data.coverImage ?? generatedCover

    const entry: HelpEntry = {
      slug,
      locale,
      // Mirror the resolved cover back into frontmatter.coverImage so legacy
      // consumers that read the field directly (e.g. before this loader
      // exposed `cover`) also benefit from the fallback without having to
      // know about it.
      frontmatter: { ...parsed.data, coverImage: cover },
      cover,
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
