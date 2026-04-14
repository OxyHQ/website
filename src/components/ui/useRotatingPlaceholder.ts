import { useCallback, useSyncExternalStore } from 'react'

const TYPING_SPEED_MS = 50
const ERASING_SPEED_MS = 30
const PAUSE_AFTER_TYPED_MS = 2000
const PAUSE_AFTER_ERASED_MS = 400

interface Runner {
  text: string
  listeners: Set<() => void>
  timer: number | null
}

/**
 * Module-level runner cache keyed by the serialized phrase list. Each runner
 * maintains its own typewriter loop and gets started on first subscribe / torn
 * down on last unsubscribe. A shared runner per phrase list means every
 * consumer of the same phrases sees identical text without duplicating timers.
 */
const runners = new Map<string, Runner>()

function serialize(phrases: string[]): string {
  return phrases.join('\u0001')
}

function stop(runner: Runner) {
  if (runner.timer != null) {
    clearTimeout(runner.timer)
    runner.timer = null
  }
}

function notify(runner: Runner) {
  runner.listeners.forEach(l => l())
}

function start(phrases: string[], runner: Runner) {
  if (phrases.length === 0) return
  let phraseIndex = 0
  let charIndex = 0
  let erasing = false

  const tick = () => {
    if (runner.listeners.size === 0) {
      runner.timer = null
      return
    }
    const phrase = phrases[phraseIndex % phrases.length]
    if (!erasing) {
      charIndex++
      runner.text = phrase.slice(0, charIndex)
      notify(runner)
      if (charIndex >= phrase.length) {
        erasing = true
        runner.timer = window.setTimeout(tick, PAUSE_AFTER_TYPED_MS)
        return
      }
      runner.timer = window.setTimeout(tick, TYPING_SPEED_MS)
      return
    }
    charIndex--
    runner.text = phrase.slice(0, charIndex)
    notify(runner)
    if (charIndex <= 0) {
      erasing = false
      phraseIndex = (phraseIndex + 1) % phrases.length
      runner.timer = window.setTimeout(tick, PAUSE_AFTER_ERASED_MS)
      return
    }
    runner.timer = window.setTimeout(tick, ERASING_SPEED_MS)
  }

  runner.timer = window.setTimeout(tick, PAUSE_AFTER_ERASED_MS)
}

export function useRotatingPlaceholder(phrases: string[]): string {
  const key = serialize(phrases)

  const subscribe = useCallback((listener: () => void) => {
    let runner = runners.get(key)
    if (!runner) {
      runner = { text: '', listeners: new Set(), timer: null }
      runners.set(key, runner)
    }
    const wasEmpty = runner.listeners.size === 0
    runner.listeners.add(listener)
    if (wasEmpty) start(phrases, runner)
    return () => {
      const r = runners.get(key)
      if (!r) return
      r.listeners.delete(listener)
      if (r.listeners.size === 0) {
        stop(r)
        runners.delete(key)
      }
    }
  }, [key, phrases])

  const getSnapshot = useCallback(() => runners.get(key)?.text ?? '', [key])
  const getServerSnapshot = useCallback(() => '', [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
