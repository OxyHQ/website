import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { z } from 'zod'
import { AcademyFrontmatter, DEFAULT_LOCALE, parseLocaleFromPath } from './schemas'

/* ──────────────────────────────────────────────
 * academy-loader.ts
 *
 * Build-time loader for `/academy`. Each course is a subdirectory under
 * `src/content/academy/`. Each lesson is a numbered MDX file inside that
 * subdirectory.
 *
 *   src/content/academy/
 *     getting-started/
 *       01-what-is-oxy.mdx          ← lesson 1 (default locale)
 *       01-what-is-oxy.es.mdx       ← Spanish translation
 *       02-create-account.mdx
 *     using-oxy-id/
 *       01-identity-basics.mdx
 *
 * URL convention:
 *   /academy/:course                — course landing
 *   /academy/:course/:lesson        — single lesson
 *
 * `lesson` is the filename minus extension (e.g. `01-what-is-oxy`).
 *
 * Course metadata lives in `ACADEMY_COURSES` below. Adding a new course
 * requires both creating the folder + lesson MDX and registering the
 * course metadata here. This keeps the course catalog explicit instead of
 * being mined from frontmatter scattered across lesson files.
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

const COURSES_BY_SLUG = new Map(ACADEMY_COURSES.map((c) => [c.slug, c]))

/* ─── Glob loaders ─── */

/**
 * Eager metadata glob. Each compiled MDX module exposes `frontmatter` as a
 * named export (via `remark-mdx-frontmatter`). The lazy glob below is used
 * for the React component default export so individual lessons still ship
 * as their own chunks.
 */
interface MdxModuleMeta {
  frontmatter: Record<string, unknown>
  default: ComponentType<Record<string, unknown>>
}

const eagerModules = import.meta.glob<MdxModuleMeta>('./academy/**/*.mdx', {
  eager: true,
})

const componentModules = import.meta.glob<{ default: ComponentType<Record<string, unknown>> }>(
  './academy/**/*.mdx',
)

/* ─── Index build ─── */

export interface LessonEntry {
  /** Lesson filename minus locale + .mdx — e.g. `01-what-is-oxy`. */
  lessonSlug: string
  /** Owning course slug (folder name). */
  course: string
  locale: string
  frontmatter: z.infer<typeof AcademyFrontmatter>
  Component: LazyExoticComponent<ComponentType<Record<string, unknown>>>
}

interface AcademyIndex {
  /** `${course}/${lessonSlug}` → locale → entry */
  byPath: Map<string, Map<string, LessonEntry>>
  /** course slug → ordered list of unique lesson slugs (default locale + any extra) */
  byCourse: Map<string, string[]>
}

function buildIndex(): AcademyIndex {
  const byPath = new Map<string, Map<string, LessonEntry>>()
  const courseLessonsSet = new Map<string, Set<string>>()

  for (const [path, mod] of Object.entries(eagerModules)) {
    const relative = path.replace(/^\.\/academy\//, '')
    const { slug, locale } = parseLocaleFromPath(relative)
    // `slug` here is `<course>/<lesson>` because parseLocaleFromPath keeps
    // subdirectories. Split into course + lesson.
    const firstSlash = slug.indexOf('/')
    if (firstSlash < 0) {
      console.error(
        `[academy-loader] lesson file ${path} is not inside a course folder — skipped`,
      )
      continue
    }
    const course = slug.slice(0, firstSlash)
    const lessonSlug = slug.slice(firstSlash + 1)

    // Frontmatter exported by `remark-mdx-frontmatter`. Clone before mutating
    // because the export is shared across renders.
    const data: Record<string, unknown> = { ...(mod.frontmatter ?? {}) }
    // Authors don't repeat `course` in frontmatter — it's the folder name. We
    // inject it before validation so the schema check still passes.
    if (typeof data.course !== 'string' || data.course.length === 0) {
      data.course = course
    }
    const parsed = AcademyFrontmatter.safeParse(data)
    if (!parsed.success) {
      console.error(
        `[academy-loader] invalid frontmatter for ${path}:`,
        parsed.error.flatten(),
      )
      continue
    }
    if (parsed.data.course !== course) {
      console.error(
        `[academy-loader] frontmatter course "${parsed.data.course}" does not match folder "${course}" for ${path}`,
      )
      continue
    }

    const componentLoader = componentModules[path]
    if (!componentLoader) {
      console.error(`[academy-loader] no component loader for ${path}`)
      continue
    }
    const Component = lazy(componentLoader)

    const entry: LessonEntry = {
      lessonSlug,
      course,
      locale,
      frontmatter: parsed.data,
      Component,
    }
    const key = `${course}/${lessonSlug}`
    let localeMap = byPath.get(key)
    if (!localeMap) {
      localeMap = new Map()
      byPath.set(key, localeMap)
    }
    localeMap.set(locale, entry)

    let set = courseLessonsSet.get(course)
    if (!set) {
      set = new Set()
      courseLessonsSet.set(course, set)
    }
    set.add(lessonSlug)
  }

  // Compute ordered lesson lists per course using the default-locale entry's
  // frontmatter.order. Falls back to alphanumeric on the slug when no default
  // exists (e.g. a course was authored Spanish-first).
  const byCourse = new Map<string, string[]>()
  for (const [course, lessonSet] of courseLessonsSet.entries()) {
    const ordered = [...lessonSet].sort((a, b) => {
      const aEntry = byPath.get(`${course}/${a}`)?.get(DEFAULT_LOCALE)
        ?? byPath.get(`${course}/${a}`)?.values().next().value
      const bEntry = byPath.get(`${course}/${b}`)?.get(DEFAULT_LOCALE)
        ?? byPath.get(`${course}/${b}`)?.values().next().value
      const aOrder = aEntry?.frontmatter.order ?? 0
      const bOrder = bEntry?.frontmatter.order ?? 0
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.localeCompare(b)
    })
    byCourse.set(course, ordered)
  }

  return { byPath, byCourse }
}

const index = buildIndex()

/* ─── Public API ─── */

function pickEntry(course: string, lessonSlug: string, locale: string): LessonEntry | null {
  const key = `${course}/${lessonSlug}`
  const localeMap = index.byPath.get(key)
  if (!localeMap) return null
  return localeMap.get(locale) ?? localeMap.get(DEFAULT_LOCALE) ?? null
}

export interface CourseWithLessons extends CourseMeta {
  lessons: LessonEntry[]
}

/** All registered courses with their resolved (locale-aware) lesson list. */
export function loadCourses(locale = DEFAULT_LOCALE): CourseWithLessons[] {
  return ACADEMY_COURSES
    .map((course) => {
      const lessonSlugs = index.byCourse.get(course.slug) ?? []
      const lessons: LessonEntry[] = []
      for (const lessonSlug of lessonSlugs) {
        const entry = pickEntry(course.slug, lessonSlug, locale)
        if (entry) lessons.push(entry)
      }
      return { ...course, lessons }
    })
    .sort((a, b) => a.order - b.order)
}

/** Single course resolved with its lessons in the requested locale. */
export function loadCourse(slug: string, locale = DEFAULT_LOCALE): CourseWithLessons | null {
  const course = COURSES_BY_SLUG.get(slug)
  if (!course) return null
  const lessonSlugs = index.byCourse.get(course.slug) ?? []
  const lessons: LessonEntry[] = []
  for (const lessonSlug of lessonSlugs) {
    const entry = pickEntry(course.slug, lessonSlug, locale)
    if (entry) lessons.push(entry)
  }
  return { ...course, lessons }
}

/** A single lesson (with its course context). */
export interface LessonWithContext {
  course: CourseMeta
  lesson: LessonEntry
  /** Index of this lesson within the course (0-based). */
  position: number
  prev: { course: string; lessonSlug: string; title: string } | null
  next: { course: string; lessonSlug: string; title: string } | null
}

export function loadLesson(
  courseSlug: string,
  lessonSlug: string,
  locale = DEFAULT_LOCALE,
): LessonWithContext | null {
  const course = COURSES_BY_SLUG.get(courseSlug)
  if (!course) return null
  const lessonSlugs = index.byCourse.get(courseSlug) ?? []
  const position = lessonSlugs.indexOf(lessonSlug)
  if (position < 0) return null
  const lesson = pickEntry(courseSlug, lessonSlug, locale)
  if (!lesson) return null

  const prevSlug = position > 0 ? lessonSlugs[position - 1] : null
  const nextSlug = position < lessonSlugs.length - 1 ? lessonSlugs[position + 1] : null

  const prevEntry = prevSlug ? pickEntry(courseSlug, prevSlug, locale) : null
  const nextEntry = nextSlug ? pickEntry(courseSlug, nextSlug, locale) : null

  return {
    course,
    lesson,
    position,
    prev: prevEntry
      ? { course: courseSlug, lessonSlug: prevEntry.lessonSlug, title: prevEntry.frontmatter.title }
      : null,
    next: nextEntry
      ? { course: courseSlug, lessonSlug: nextEntry.lessonSlug, title: nextEntry.frontmatter.title }
      : null,
  }
}
