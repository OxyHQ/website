/* ──────────────────────────────────────────────
 * Academy progress — local storage helper
 *
 * Signed-out visitors track lesson completion locally so first-time readers
 * who haven't created an Oxy account yet still see their progress carry
 * across sessions on the same device. Once they sign in we migrate the
 * locally-stored progress into the user's app-data namespace and clear the
 * local store (see `useAcademyProgress`).
 *
 * This file owns the on-disk shape, the typed read/write helpers, and a
 * tiny pub-sub that bridges `localStorage` mutations to `useSyncExternalStore`
 * so React components react to writes from other tabs (or from the
 * `localStorage.clear()` path during sign-in migration).
 *
 * SSR safety: every read/write checks `typeof window !== 'undefined'`. The
 * subscribe function returns an unsubscribe no-op on the server so
 * `useSyncExternalStore` works during build-time prerender.
 * ──────────────────────────────────────────── */

export type LessonStatus = 'not-started' | 'in-progress' | 'completed'

export interface LessonProgress {
  status: LessonStatus
  /** ISO 8601 timestamp the lesson was marked completed. */
  completedAt?: string
  /** Optional resume position for future video/audio integrations. */
  positionMs?: number
}

/** `lessonSlug -> LessonProgress` for a single course. */
export type CourseProgress = Record<string, LessonProgress>

/** Cross-course rollup written under the same namespace as a separate key. */
export interface CourseIndexEntry {
  courseSlug: string
  /** Most recent `completedAt` across the course's lessons, or "" if none. */
  lastActivityAt: string
  status: 'in-progress' | 'completed'
}

/** localStorage key prefix used for the per-course progress maps. */
export const LOCAL_STORAGE_PREFIX = 'oxy:academy:progress:'

/** Subscribers notified on any `oxy:academy:progress:*` write or removal. */
type Listener = () => void
const listeners = new Set<Listener>()

function notify(): void {
  for (const listener of listeners) {
    try {
      listener()
    } catch {
      // A buggy listener must not poison the others.
    }
  }
}

/** Subscribe to academy-progress writes. Returns an unsubscribe function. */
export function subscribeProgress(listener: Listener): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(LOCAL_STORAGE_PREFIX)) {
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function isLessonProgress(value: unknown): value is LessonProgress {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<LessonProgress>
  if (
    candidate.status !== 'not-started' &&
    candidate.status !== 'in-progress' &&
    candidate.status !== 'completed'
  ) {
    return false
  }
  if (candidate.completedAt !== undefined && typeof candidate.completedAt !== 'string') {
    return false
  }
  if (candidate.positionMs !== undefined && typeof candidate.positionMs !== 'number') {
    return false
  }
  return true
}

/**
 * Reject anything that doesn't look like a `CourseProgress` map — keeps a
 * tampered or stale entry from poisoning the UI.
 */
function sanitizeCourseProgress(value: unknown): CourseProgress {
  if (!value || typeof value !== 'object') return {}
  const out: CourseProgress = {}
  for (const [lessonSlug, lessonValue] of Object.entries(value as Record<string, unknown>)) {
    if (typeof lessonSlug === 'string' && isLessonProgress(lessonValue)) {
      out[lessonSlug] = lessonValue
    }
  }
  return out
}

/** Read course progress from localStorage. Returns `{}` outside the browser. */
export function readLocalCourseProgress(courseSlug: string): CourseProgress {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${courseSlug}`)
    if (!raw) return {}
    return sanitizeCourseProgress(JSON.parse(raw))
  } catch {
    return {}
  }
}

/** Persist course progress to localStorage. No-op outside the browser. */
export function writeLocalCourseProgress(courseSlug: string, progress: CourseProgress): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      `${LOCAL_STORAGE_PREFIX}${courseSlug}`,
      JSON.stringify(progress),
    )
    notify()
  } catch {
    // Quota errors / disabled storage — best-effort, the in-memory cache
    // through React Query / useSyncExternalStore still keeps the session
    // current.
  }
}

/** Drop a single course's local progress. */
export function clearLocalCourseProgress(courseSlug: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${courseSlug}`)
    notify()
  } catch {
    // ignore
  }
}

/** Drop every academy-progress key. Used on sign-in migration. */
export function clearAllLocalAcademyProgress(): void {
  if (typeof window === 'undefined') return
  try {
    const removable: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
        removable.push(key)
      }
    }
    for (const key of removable) {
      window.localStorage.removeItem(key)
    }
    if (removable.length > 0) {
      notify()
    }
  } catch {
    // ignore
  }
}

/** Enumerate the `(courseSlug, progress)` pairs currently in localStorage. */
export function readAllLocalCourseProgress(): Array<{
  courseSlug: string
  progress: CourseProgress
}> {
  if (typeof window === 'undefined') return []
  const entries: Array<{ courseSlug: string; progress: CourseProgress }> = []
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
        const courseSlug = key.slice(LOCAL_STORAGE_PREFIX.length)
        const raw = window.localStorage.getItem(key)
        if (raw) {
          try {
            entries.push({
              courseSlug,
              progress: sanitizeCourseProgress(JSON.parse(raw)),
            })
          } catch {
            // Skip malformed entries.
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return entries
}

/**
 * Merge two course-progress maps, preferring the most recent `completedAt`
 * per lesson. Used during sign-in migration when both the local and remote
 * states may have entries — we want the user's most recent action to win.
 */
export function mergeCourseProgress(
  a: CourseProgress,
  b: CourseProgress,
): CourseProgress {
  const out: CourseProgress = { ...a }
  for (const [lessonSlug, bEntry] of Object.entries(b)) {
    const aEntry = out[lessonSlug]
    if (!aEntry) {
      out[lessonSlug] = bEntry
      continue
    }
    // Prefer "completed" over "in-progress"/"not-started", then by recency.
    const aIsCompleted = aEntry.status === 'completed'
    const bIsCompleted = bEntry.status === 'completed'
    if (bIsCompleted && !aIsCompleted) {
      out[lessonSlug] = bEntry
      continue
    }
    if (aIsCompleted && !bIsCompleted) {
      // Keep a — already the better signal.
      continue
    }
    // Both completed (or both not), tie-break by completedAt recency.
    const aTime = aEntry.completedAt ? Date.parse(aEntry.completedAt) : 0
    const bTime = bEntry.completedAt ? Date.parse(bEntry.completedAt) : 0
    out[lessonSlug] = bTime > aTime ? bEntry : aEntry
  }
  return out
}

/** Roll up a single course-progress map into a `CourseIndexEntry`. */
export function summarizeCourseProgress(
  courseSlug: string,
  progress: CourseProgress,
): CourseIndexEntry | null {
  const lessons = Object.values(progress)
  if (lessons.length === 0) return null
  let latest = ''
  let allCompleted = true
  for (const lesson of lessons) {
    if (lesson.status !== 'completed') {
      allCompleted = false
    }
    if (lesson.completedAt && lesson.completedAt > latest) {
      latest = lesson.completedAt
    }
  }
  return {
    courseSlug,
    lastActivityAt: latest,
    status: allCompleted ? 'completed' : 'in-progress',
  }
}
