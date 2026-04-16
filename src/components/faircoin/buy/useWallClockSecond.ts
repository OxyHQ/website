/**
 * useWallClockSecond — return the current wall-clock time in whole seconds,
 * re-rendering subscribers exactly once per second.
 *
 * Backed by a single shared external store + setInterval, registered lazily
 * on first subscription and torn down when the last subscriber unmounts.
 * The interval is process-wide, so dozens of countdown components share one
 * tick rather than racing N independent timers.
 *
 * Uses `useSyncExternalStore` instead of `useEffect` per the project's React
 * conventions — the store handles the lifecycle imperatively and React just
 * subscribes/unsubscribes through the standard hook contract.
 */
import { useSyncExternalStore } from 'react'

const TICK_MS = 1_000

let snapshot = nowSeconds()
const listeners = new Set<() => void>()
let intervalId: ReturnType<typeof setInterval> | null = null

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

function tick(): void {
  const next = nowSeconds()
  if (next === snapshot) return
  snapshot = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (intervalId === null) {
    intervalId = setInterval(tick, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

function getSnapshot(): number {
  return snapshot
}

function getServerSnapshot(): number {
  // SSR/build-time renders never animate countdowns; pin to 0 so output is
  // deterministic. The first client render replaces this with the real clock.
  return 0
}

export function useWallClockSecond(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
