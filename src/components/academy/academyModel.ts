import type { BloomIconComponent } from '@oxy.so/bloom/icons'
import { RiBroadcastLine } from '@oxy.so/bloom/icons/RiBroadcastLine'
import { RiCodeSSlashLine } from '@oxy.so/bloom/icons/RiCodeSSlashLine'
import { RiRocket2Line } from '@oxy.so/bloom/icons/RiRocket2Line'
import { RiShieldCheckLine } from '@oxy.so/bloom/icons/RiShieldCheckLine'
import type { CourseWithLessons, LessonEntry } from '../../content/academy-loader'
import type { CourseProgress, LessonStatus } from './progressStorage'

/* ──────────────────────────────────────────────
 * The Academy's derived model: tracks, per-course progress summaries, the
 * resume target, the lesson sequence prev/next walks, and search.
 *
 * Everything here is pure — the pages and the rail call it with the loader's
 * courses and the progress hooks' maps, so the three routes can never disagree
 * about what "in progress" or "next lesson" means.
 * ──────────────────────────────────────────── */

export interface TrackDef {
  key: 'foundations' | 'identity' | 'social' | 'developer'
  /** Course tags that place a course in this track. First matching track wins. */
  tags: readonly string[]
  Icon: BloomIconComponent
}

export const TRACKS: readonly TrackDef[] = [
  { key: 'foundations', tags: ['intro', 'onboarding'], Icon: RiRocket2Line },
  { key: 'identity', tags: ['identity', 'security'], Icon: RiShieldCheckLine },
  { key: 'social', tags: ['mention', 'publishing', 'fediverse'], Icon: RiBroadcastLine },
  { key: 'developer', tags: ['developer', 'api', 'sdk'], Icon: RiCodeSSlashLine },
]

export interface TrackGroup {
  track: TrackDef
  courses: CourseWithLessons[]
}

/** Courses grouped by track, in track order. A course with no matching tag joins the first track. */
export function groupByTrack(courses: readonly CourseWithLessons[]): TrackGroup[] {
  const groups = TRACKS.map<TrackGroup>((track) => ({ track, courses: [] }))
  for (const course of courses) {
    const index = TRACKS.findIndex((track) => course.tags.some((tag) => track.tags.includes(tag)))
    groups[Math.max(0, index)].courses.push(course)
  }
  return groups
}

/** A course with no published lessons yet is announced, not opened. */
export const isCourseAvailable = (course: CourseWithLessons): boolean => course.lessons.length > 0

/* ── Progress ─────────────────────────────────────────────── */

export function lessonStatus(progress: CourseProgress | undefined, lessonSlug: string): LessonStatus {
  return progress?.[lessonSlug]?.status ?? 'not-started'
}

export interface CourseSummary {
  completed: number
  total: number
  status: LessonStatus
  /** The first lesson not yet completed — where "Continue" goes. Null once the course is done. */
  nextLesson: LessonEntry | null
  /** Latest completion time, for picking the course the learner touched last. */
  lastActivity: number
}

export function summarizeCourse(course: CourseWithLessons, progress: CourseProgress | undefined): CourseSummary {
  const total = course.lessons.length
  let completed = 0
  let lastActivity = 0
  let nextLesson: LessonEntry | null = null
  for (const lesson of course.lessons) {
    const entry = progress?.[lesson.lessonSlug]
    if (entry?.status === 'completed') {
      completed += 1
      const at = entry.completedAt ? Date.parse(entry.completedAt) : 0
      if (Number.isFinite(at) && at > lastActivity) lastActivity = at
    } else if (!nextLesson) {
      nextLesson = lesson
    }
  }
  // A course is started once a lesson in it is COMPLETED. A lesson's own
  // `in-progress` entry does not count: until the reader marked it only on
  // reading into the article, it was written the moment a lesson was opened,
  // and saved progress cannot tell those page views from real reading — so a
  // visitor who glanced at one lesson would be told a course was under way.
  const status: LessonStatus =
    total > 0 && completed === total ? 'completed' : completed > 0 ? 'in-progress' : 'not-started'
  return { completed, total, status, nextLesson, lastActivity }
}

export interface AcademyTotals {
  coursesStarted: number
  coursesCompleted: number
  lessonsCompleted: number
  lessonsTotal: number
  courseCount: number
}

export function academyTotals(
  courses: readonly CourseWithLessons[],
  all: Record<string, CourseProgress>,
): AcademyTotals {
  const totals: AcademyTotals = {
    coursesStarted: 0,
    coursesCompleted: 0,
    lessonsCompleted: 0,
    lessonsTotal: 0,
    courseCount: 0,
  }
  for (const course of courses) {
    if (!isCourseAvailable(course)) continue
    const summary = summarizeCourse(course, all[course.slug])
    totals.courseCount += 1
    totals.lessonsTotal += summary.total
    totals.lessonsCompleted += summary.completed
    if (summary.status !== 'not-started') totals.coursesStarted += 1
    if (summary.status === 'completed') totals.coursesCompleted += 1
  }
  return totals
}

/** The in-progress course the learner touched most recently, with the lesson to resume at. */
export function pickResume(
  courses: readonly CourseWithLessons[],
  all: Record<string, CourseProgress>,
): { course: CourseWithLessons; summary: CourseSummary; lesson: LessonEntry } | null {
  let best: { course: CourseWithLessons; summary: CourseSummary; lesson: LessonEntry } | null = null
  for (const course of courses) {
    const summary = summarizeCourse(course, all[course.slug])
    if (summary.status !== 'in-progress' || !summary.nextLesson) continue
    if (!best || summary.lastActivity > best.summary.lastActivity) {
      best = { course, summary, lesson: summary.nextLesson }
    }
  }
  return best
}

/** Where a new learner starts: the first beginner course that has lessons. */
export function pickStarterCourse(courses: readonly CourseWithLessons[]): CourseWithLessons | null {
  return (
    courses.find((course) => course.level === 'beginner' && isCourseAvailable(course)) ??
    courses.find(isCourseAvailable) ??
    null
  )
}

/* ── Sequence ─────────────────────────────────────────────── */

export interface SequenceStep {
  course: CourseWithLessons
  lesson: LessonEntry
}

/**
 * The lesson after this one: the next lesson of the course, else the first
 * lesson of the next course that has any. Null at the end of the catalog.
 */
export function nextStep(
  courses: readonly CourseWithLessons[],
  courseSlug: string,
  lessonSlug: string,
): SequenceStep | null {
  const courseIndex = courses.findIndex((course) => course.slug === courseSlug)
  if (courseIndex < 0) return null
  const course = courses[courseIndex]
  const position = course.lessons.findIndex((lesson) => lesson.lessonSlug === lessonSlug)
  if (position >= 0 && position < course.lessons.length - 1) {
    return { course, lesson: course.lessons[position + 1] }
  }
  for (const later of courses.slice(courseIndex + 1)) {
    if (later.lessons.length > 0) return { course: later, lesson: later.lessons[0] }
  }
  return null
}

/* ── Search ───────────────────────────────────────────────── */

export interface SearchHit {
  course: CourseWithLessons
  /** The course itself matched (title, summary or a tag). */
  courseMatched: boolean
  /** The lessons whose title or description matched. */
  lessons: LessonEntry[]
}

const includes = (haystack: string | undefined, needle: string) =>
  haystack !== undefined && haystack.toLowerCase().includes(needle)

/** Courses and lessons matching `query`, in catalog order. An empty query matches nothing. */
export function searchAcademy(courses: readonly CourseWithLessons[], query: string): SearchHit[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  const hits: SearchHit[] = []
  for (const course of courses) {
    const courseMatched =
      includes(course.title, needle) ||
      includes(course.summary, needle) ||
      course.tags.some((tag) => includes(tag, needle))
    const lessons = course.lessons.filter(
      (lesson) => includes(lesson.frontmatter.title, needle) || includes(lesson.frontmatter.description, needle),
    )
    if (courseMatched || lessons.length > 0) hits.push({ course, courseMatched, lessons })
  }
  return hits
}

/* ── URLs ─────────────────────────────────────────────────── */

export const academyPath = '/academy/'
export const coursePath = (courseSlug: string) => `/academy/${courseSlug}/`
export const lessonPath = (courseSlug: string, lessonSlug: string) => `/academy/${courseSlug}/${lessonSlug}/`
