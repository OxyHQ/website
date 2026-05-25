import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { z } from 'zod'
import { CompanyFrontmatter, DEFAULT_LOCALE, parseLocaleFromPath } from './schemas'

/* ──────────────────────────────────────────────
 * company-loader.ts
 *
 * Build-time loader for `/company/*` prose pages. One MDX file per page:
 *
 *   src/content/company/manifesto.mdx
 *   src/content/company/transparency.mdx
 *   src/content/company/mission.mdx
 *   src/content/company/business.mdx
 *
 * Spanish translations follow the `.es.mdx` sibling-file pattern.
 *
 * The company landing (`/company`) keeps its rich interactive layout
 * (stats, team, FAQ, news). Pure-prose pages (manifesto, transparency,
 * mission, business) get their copy from MDX so writers can update the
 * page without touching React code.
 * ──────────────────────────────────────────── */

export interface CompanyEntry {
  slug: string
  locale: string
  frontmatter: z.infer<typeof CompanyFrontmatter>
  Component: LazyExoticComponent<ComponentType<Record<string, unknown>>>
}

/* ─── Glob loaders ─── */

/**
 * Eager metadata glob. Each compiled MDX module exposes `frontmatter` as a
 * named export (via `remark-mdx-frontmatter`). The lazy glob below is used
 * for the React component default export.
 */
interface MdxModuleMeta {
  frontmatter: Record<string, unknown>
  default: ComponentType<Record<string, unknown>>
}

const eagerModules = import.meta.glob<MdxModuleMeta>('./company/**/*.mdx', {
  eager: true,
})

const componentModules = import.meta.glob<{ default: ComponentType<Record<string, unknown>> }>(
  './company/**/*.mdx',
)

/* ─── Index build ─── */

interface CompanyIndex {
  bySlug: Map<string, Map<string, CompanyEntry>>
}

function buildIndex(): CompanyIndex {
  const bySlug = new Map<string, Map<string, CompanyEntry>>()

  for (const [path, mod] of Object.entries(eagerModules)) {
    const relative = path.replace(/^\.\/company\//, '')
    const { slug, locale } = parseLocaleFromPath(relative)

    const parsed = CompanyFrontmatter.safeParse(mod.frontmatter ?? {})
    if (!parsed.success) {
      console.error(
        `[company-loader] invalid frontmatter for ${path}:`,
        parsed.error.flatten(),
      )
      continue
    }

    const componentLoader = componentModules[path]
    if (!componentLoader) {
      console.error(`[company-loader] no component loader for ${path}`)
      continue
    }
    const Component = lazy(componentLoader)

    const entry: CompanyEntry = {
      slug,
      locale,
      frontmatter: parsed.data,
      Component,
    }
    let localeMap = bySlug.get(slug)
    if (!localeMap) {
      localeMap = new Map()
      bySlug.set(slug, localeMap)
    }
    localeMap.set(locale, entry)
  }

  return { bySlug }
}

const index = buildIndex()

/* ─── Public API ─── */

/** Load a single company page by slug + locale, with default-locale fallback. */
export function loadCompanyPage(slug: string, locale = DEFAULT_LOCALE): CompanyEntry | null {
  const localeMap = index.bySlug.get(slug)
  if (!localeMap) return null
  return localeMap.get(locale) ?? localeMap.get(DEFAULT_LOCALE) ?? null
}

/** All known company pages, default locale. Used by the build-search-index script. */
export function loadCompanyPages(locale = DEFAULT_LOCALE): CompanyEntry[] {
  const out: CompanyEntry[] = []
  for (const slug of index.bySlug.keys()) {
    const entry = loadCompanyPage(slug, locale)
    if (entry) out.push(entry)
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug))
}
