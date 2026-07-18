/* ──────────────────────────────────────────────
 * Academy progress hook
 *
 * Single source of truth for lesson completion in `/academy`. Returns a
 * `CourseProgress` map plus the imperative actions that update it.
 *
 *   const { data, markLessonStarted, markLessonCompleted, reset } = useAcademyProgress(courseSlug)
 *
 * Behaviour:
 *   - Signed in  → backed by the Oxy user app-data store (`academy` namespace,
 *                  one document per course slug).
 *   - Signed out → backed by `localStorage` (`oxy:academy:progress:<courseSlug>`),
 *                  observed through `useSyncExternalStore` so writes
 *                  re-render the UI on the same tab and across tabs.
 *   - On sign-in → migrates every locally-stored course into the user's
 *                  app-data namespace, merging by recency per lesson, then
 *                  clears the local copies.
 *
 * SSR: every browser API (`localStorage`, `window`) is guarded so the static
 * build (SSG) renders the empty/null state without throwing.
 * ──────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useAuth, useOxy } from '@oxyhq/services'
import {
  useAppData,
  useAppDataNamespace,
  useSetAppData,
} from '../../lib/appDataHooks'
import {
  clearAllLocalAcademyProgress,
  mergeCourseProgress,
  readAllLocalCourseProgress,
  sanitizeCourseProgress,
  subscribeProgress,
  writeLocalCourseProgress,
  LOCAL_STORAGE_PREFIX,
  type CourseProgress,
  type LessonProgress,
} from './progressStorage'

/** Stable empty object used when no progress exists — avoids reference churn. */
const EMPTY_PROGRESS: CourseProgress = Object.freeze({}) as CourseProgress

const ACADEMY_NAMESPACE = 'academy'

export interface UseAcademyProgressResult {
  /** Current progress map. Always a fresh object for the active source. */
  data: CourseProgress
  /** True while the initial read is still in flight (server side only). */
  isLoading: boolean
  /** True iff the current device is signed in to an Oxy account. */
  isAuthenticated: boolean
  /** Mark a lesson as started — no-op if it's already completed or started. */
  markLessonStarted: (lessonSlug: string) => void
  /** Mark a lesson as completed (sets `completedAt: now`). */
  markLessonCompleted: (lessonSlug: string) => void
  /**
   * Reset progress. With no argument, clears every lesson in the course.
   * With a `lessonSlug`, removes that single lesson's entry only.
   */
  reset: (lessonSlug?: string) => void
}

/**
 * Server snapshot subscriber used when signed out: bridges localStorage
 * mutations to React's `useSyncExternalStore` so every consumer of this hook
 * sees the same value in the same render pass.
 *
 * The snapshot is the *raw string* from localStorage (or null). We parse on
 * the consumer side and memoize so a re-read with the same string returns
 * the same parsed object — that gates React's bailout on equality.
 */
function getLocalSnapshot(courseSlug: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${courseSlug}`)
  } catch {
    return null
  }
}

function getServerSnapshot(): string | null {
  // No localStorage during SSG — the hook returns `{}` until hydration.
  return null
}

export function useAcademyProgress(courseSlug: string): UseAcademyProgressResult {
  const { isAuthenticated } = useAuth()
  const { oxyServices } = useOxy()

  // ── Signed-in path: React Query handles fetch + cache ─────────────────
  const remote = useAppData<CourseProgress>(ACADEMY_NAMESPACE, courseSlug)
  const setRemote = useSetAppData<CourseProgress>()

  // ── Signed-out path: useSyncExternalStore reflects localStorage ───────
  const subscribe = useCallback(
    (listener: () => void) => subscribeProgress(listener),
    [],
  )
  const localGetter = useCallback(
    () => getLocalSnapshot(courseSlug),
    [courseSlug],
  )
  const localRaw = useSyncExternalStore(subscribe, localGetter, getServerSnapshot)
  const localParsed = useMemo<CourseProgress>(() => {
    if (!localRaw) return EMPTY_PROGRESS
    try {
      // Same validation the storage module applies on its own read paths — a
      // tampered or stale entry must not reach the UI through this one.
      return sanitizeCourseProgress(JSON.parse(localRaw))
    } catch {
      return EMPTY_PROGRESS
    }
  }, [localRaw])

  // ── One-shot sign-in migration ────────────────────────────────────────
  // When the user signs in for the first time on this device, fold every
  // locally-stored course into the user's app-data namespace, then drop the
  // local copies. We track the "have I migrated yet on this mount" so the
  // operation runs at most once per app load even if the auth state flips.
  const migrationStartedRef = useRef(false)
  useEffect(() => {
    if (!isAuthenticated) {
      migrationStartedRef.current = false
      return
    }
    if (migrationStartedRef.current) return
    migrationStartedRef.current = true

    const localEntries = readAllLocalCourseProgress()
    if (localEntries.length === 0) return

    let cancelled = false
    void (async () => {
      try {
        for (const { courseSlug: localCourseSlug, progress } of localEntries) {
          if (cancelled) return
          // We don't know the current server value here without an extra
          // fetch. Merging with `{}` and letting the server-side store
          // overwrite would risk losing prior server progress. Instead, fall
          // back to a read-then-merge per course.
          let merged = progress
          try {
            const current = await oxyServices.getAppData<CourseProgress>(
              ACADEMY_NAMESPACE,
              localCourseSlug,
            )
            if (current) {
              merged = mergeCourseProgress(current, progress)
            }
          } catch {
            // Server unreachable — write the local copy as-is. The user will
            // simply see their local progress preserved.
          }
          await setRemote.mutateAsync({
            namespace: ACADEMY_NAMESPACE,
            key: localCourseSlug,
            value: merged,
          })
        }
        if (!cancelled) {
          clearAllLocalAcademyProgress()
        }
      } catch {
        // If the upload fails outright (network, 401, etc.) we deliberately
        // leave the local copies in place — the user can sign in again later
        // and we'll retry.
      }
    })()

    return () => {
      cancelled = true
    }
    // We intentionally omit setRemote and oxyServices from deps — those
    // are stable across re-renders inside OxyProvider and re-running this
    // effect on every render would re-trigger the migration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // ── Source of truth selection ─────────────────────────────────────────
  const data: CourseProgress = isAuthenticated
    ? remote.data ?? EMPTY_PROGRESS
    : localParsed

  // ── Mutators ──────────────────────────────────────────────────────────
  // Helper that takes the current snapshot, applies an updater, then writes
  // it back to whichever store is active. We capture the *current* `data`
  // reference inside the callback's closure each render so writes always see
  // the latest state.
  const update = useCallback(
    (updater: (prev: CourseProgress) => CourseProgress) => {
      const next = updater(data)
      // Reference-equal? Bail.
      if (next === data) return
      if (isAuthenticated) {
        setRemote.mutate({
          namespace: ACADEMY_NAMESPACE,
          key: courseSlug,
          value: next,
        })
      } else {
        writeLocalCourseProgress(courseSlug, next)
      }
    },
    [courseSlug, data, isAuthenticated, setRemote],
  )

  const markLessonStarted = useCallback(
    (lessonSlug: string) => {
      update((prev) => {
        const existing = prev[lessonSlug]
        if (existing && existing.status !== 'not-started') return prev
        const nextLesson: LessonProgress = {
          ...(existing ?? {}),
          status: 'in-progress',
        }
        return { ...prev, [lessonSlug]: nextLesson }
      })
    },
    [update],
  )

  const markLessonCompleted = useCallback(
    (lessonSlug: string) => {
      update((prev) => {
        const existing = prev[lessonSlug]
        // Don't bother writing if it's already completed today — saves an
        // unnecessary network round trip.
        if (existing?.status === 'completed') return prev
        const nextLesson: LessonProgress = {
          ...(existing ?? {}),
          status: 'completed',
          completedAt: new Date().toISOString(),
        }
        return { ...prev, [lessonSlug]: nextLesson }
      })
    },
    [update],
  )

  const reset = useCallback(
    (lessonSlug?: string) => {
      if (lessonSlug === undefined) {
        update(() => ({}))
        return
      }
      update((prev) => {
        if (!(lessonSlug in prev)) return prev
        const next = { ...prev }
        delete next[lessonSlug]
        return next
      })
    },
    [update],
  )

  return {
    data,
    isLoading: isAuthenticated && remote.isLoading,
    isAuthenticated,
    markLessonStarted,
    markLessonCompleted,
    reset,
  }
}

/**
 * Read-only multi-course view used by `/academy` for the per-card progress
 * chips. When signed in, hits the namespace endpoint once; when signed out,
 * subscribes to localStorage so the chips update live as the user works
 * through the lessons in another tab.
 */
export function useAcademyAllProgress(): {
  data: Record<string, CourseProgress>
  isLoading: boolean
  isAuthenticated: boolean
} {
  const { isAuthenticated } = useAuth()
  // Migration is owned by `useAcademyProgress` — the listing only reads.

  const subscribe = useCallback(
    (listener: () => void) => subscribeProgress(listener),
    [],
  )
  // Snapshot is the sorted `key -> stored value` list. It has to embed the
  // values themselves, not their lengths: marking a lesson completed rewrites
  // the entry at the same byte length, and a length-keyed snapshot would be
  // identical across that write, leaving the chips stale.
  const localSnapshot = useCallback((): string => {
    if (typeof window === 'undefined') return ''
    try {
      const entries: string[] = []
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i)
        if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
          entries.push(`${key}:${window.localStorage.getItem(key) ?? ''}`)
        }
      }
      return entries.sort().join('|')
    } catch {
      return ''
    }
  }, [])
  const localStamp = useSyncExternalStore(subscribe, localSnapshot, () => '')
  const localAll = useMemo<Record<string, CourseProgress>>(() => {
    if (typeof window === 'undefined') return {}
    const entries = readAllLocalCourseProgress()
    const map: Record<string, CourseProgress> = {}
    for (const { courseSlug, progress } of entries) {
      map[courseSlug] = progress
    }
    return map
    // localStamp drives invalidation — the snapshot string is the dep we
    // actually want to react to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStamp])

  // Always-call the namespace hook (Rules of Hooks); it gates itself on
  // `isAuthenticated` internally, so the request only fires when signed in.
  const remote = useAppDataNamespace<CourseProgress>(ACADEMY_NAMESPACE)

  if (isAuthenticated) {
    return {
      data: remote.data ?? {},
      isLoading: remote.isLoading,
      isAuthenticated,
    }
  }
  return { data: localAll, isLoading: false, isAuthenticated }
}
