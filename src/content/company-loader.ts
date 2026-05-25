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

const frontmatterModules = import.meta.glob<string>('./company/**/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const componentModules = import.meta.glob<{ default: ComponentType<Record<string, unknown>> }>(
  './company/**/*.mdx',
)

/* ─── Frontmatter parser ─── */

interface ParsedFrontmatter {
  data: Record<string, unknown>
  body: string
}

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
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1).replace(/\\(["'\\])/g, '$1')
  }
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim()
    if (inner === '') return []
    return inner.split(',').map((item) => coerceYamlValue(item.trim()))
  }
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
    const num = Number(raw)
    if (Number.isFinite(num)) return num
  }
  return raw
}

/* ─── Index build ─── */

interface CompanyIndex {
  bySlug: Map<string, Map<string, CompanyEntry>>
}

function buildIndex(): CompanyIndex {
  const bySlug = new Map<string, Map<string, CompanyEntry>>()

  for (const [path, raw] of Object.entries(frontmatterModules)) {
    const relative = path.replace(/^\.\/company\//, '')
    const { slug, locale } = parseLocaleFromPath(relative)

    const { data } = parseFrontmatter(raw)
    const parsed = CompanyFrontmatter.safeParse(data)
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
