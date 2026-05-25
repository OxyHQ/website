import { z } from 'zod'

/* ──────────────────────────────────────────────
 * Content frontmatter schemas
 *
 * Every MDX file under `src/content/help`, `src/content/academy`, and
 * `src/content/company` exports a typed `frontmatter` object via MDX's
 * `remark-frontmatter` integration. These schemas validate the frontmatter
 * at load time so authors get a clear error instead of a silent miss.
 *
 * Loaders parse the YAML block into a plain object and pass it through the
 * matching schema before exposing entries to the UI.
 * ──────────────────────────────────────────── */

export const HelpFrontmatter = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(['account', 'inbox', 'console', 'auth', 'getting-started']),
  order: z.number().default(100),
  audience: z.enum(['user', 'developer']).default('user'),
  /** ISO date of the most recent meaningful update. */
  updated: z.string().optional(),
  /** Whether to surface this article in the "Get started" featured rail. */
  featured: z.boolean().default(false),
  /** Optional cover image (absolute URL or asset path). */
  coverImage: z.string().optional(),
  /** Tags for filtering / SEO. */
  tags: z.array(z.string()).default([]),
})

export type HelpFrontmatter = z.infer<typeof HelpFrontmatter>

export const AcademyFrontmatter = z.object({
  title: z.string(),
  description: z.string(),
  /** Slug of the course this lesson belongs to (folder name). */
  course: z.string(),
  order: z.number(),
  /** Human-readable duration label, e.g. "5 min". */
  duration: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  tags: z.array(z.string()).default([]),
})

export type AcademyFrontmatter = z.infer<typeof AcademyFrontmatter>

/**
 * Frontmatter for course landing pages (e.g. `academy/getting-started/index.mdx`).
 * Distinct from lessons: courses describe the whole curriculum.
 */
export const AcademyCourseFrontmatter = z.object({
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  duration: z.string().optional(),
  order: z.number().default(100),
  featured: z.boolean().default(false),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export type AcademyCourseFrontmatter = z.infer<typeof AcademyCourseFrontmatter>

export const CompanyFrontmatter = z.object({
  title: z.string(),
  description: z.string(),
  ogImage: z.string().optional(),
  /** Optional eyebrow shown above the page title. */
  eyebrow: z.string().optional(),
})

export type CompanyFrontmatter = z.infer<typeof CompanyFrontmatter>

/* ─── Locale parsing helpers ─── */

/**
 * Default locale used when an MDX file has no `.{locale}` suffix.
 * Loaders return this when a caller asks for a locale that has no
 * translation for a given slug.
 */
export const DEFAULT_LOCALE = 'en'

/**
 * Match a 2-letter locale suffix in front of `.mdx` — e.g. `.es.mdx`.
 * Captures the locale code so callers can extract and strip it.
 */
export const LOCALE_SUFFIX_RE = /\.([a-z]{2})\.mdx$/

/**
 * Extract `{ slug, locale }` from an MDX path relative to its content
 * folder. The slug is the filename minus the locale suffix (and `.mdx`)
 * combined with any subdirectories. If no locale suffix is present, the
 * file is treated as the default locale (`en`).
 *
 * @example
 *   parseLocaleFromPath('account/add-recovery-email.mdx')
 *     → { slug: 'account/add-recovery-email', locale: 'en' }
 *
 *   parseLocaleFromPath('account/add-recovery-email.es.mdx')
 *     → { slug: 'account/add-recovery-email', locale: 'es' }
 */
export function parseLocaleFromPath(relativePath: string): { slug: string; locale: string } {
  // Strip leading `./` if present.
  const cleaned = relativePath.replace(/^\.\//, '')
  const match = cleaned.match(LOCALE_SUFFIX_RE)
  if (match) {
    const locale = match[1] ?? DEFAULT_LOCALE
    const slug = cleaned.replace(LOCALE_SUFFIX_RE, '')
    return { slug, locale }
  }
  const slug = cleaned.replace(/\.mdx$/, '')
  return { slug, locale: DEFAULT_LOCALE }
}
