/* ──────────────────────────────────────────────
 * Academy course catalog.
 *
 * Split out of `academy-loader.ts` so it can be imported by BOTH the SPA
 * (through the loader) and `scripts/prerender.ts`. The loader itself uses
 * `import.meta.glob`, which only resolves under Vite — a plain Bun script
 * cannot import it. Keeping the catalog in this zero-dependency module is
 * what lets the prerendered `<title>` for `/academy/<course>` use the same
 * course titles the SPA renders, instead of a slug-derived approximation
 * that silently drifts from them.
 *
 * Adding a course still means creating the folder + lesson MDX and
 * registering the metadata here.
 * ──────────────────────────────────────────── */

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export interface CourseMeta {
  slug: string
  title: string
  summary: string
  level: CourseLevel
  /** Human-readable total duration. */
  duration?: string
  /** Order in the catalog (asc). */
  order: number
  /** Featured courses surface on the academy landing first. */
  featured: boolean
  /** Optional cover image (absolute URL or asset path). */
  coverImage?: string
  /** Free-form tags. */
  tags: string[]
}

export const ACADEMY_COURSES: CourseMeta[] = [
  {
    slug: 'getting-started',
    title: 'Getting started with Oxy',
    summary: 'Set up your account, install the apps, and ship your first project on Oxy.',
    level: 'beginner',
    duration: '~15 min',
    order: 10,
    featured: true,
    tags: ['intro', 'onboarding'],
  },
  {
    slug: 'using-oxy-id',
    title: 'Using your Oxy ID',
    summary: 'Your portable identity — how Oxy ID keys, sessions, and recovery work end to end.',
    level: 'beginner',
    duration: '~20 min',
    order: 20,
    featured: true,
    tags: ['identity', 'security'],
  },
  {
    slug: 'publishing-with-mention',
    title: 'Publishing with Mention',
    summary: 'Use Mention to publish to the fediverse, manage your audience, and grow your reach.',
    level: 'intermediate',
    duration: '~25 min',
    order: 30,
    featured: false,
    tags: ['mention', 'publishing', 'fediverse'],
  },
]
