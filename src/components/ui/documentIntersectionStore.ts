type Listener = () => void

interface Entry {
  isIntersecting: boolean
  listeners: Set<Listener>
  observer: IntersectionObserver | null
  scheduled: number | null
  element: Element | null
}

const entries = new Map<string, Entry>()

function ensureEntry(selector: string): Entry {
  let entry = entries.get(selector)
  if (entry) return entry
  entry = {
    isIntersecting: false,
    listeners: new Set(),
    observer: null,
    scheduled: null,
    element: null,
  }
  entries.set(selector, entry)
  return entry
}

function notify(entry: Entry) {
  entry.listeners.forEach(l => l())
}

function attachObserver(selector: string, entry: Entry) {
  const el = document.querySelector(selector)
  if (!el) return false
  entry.element = el
  entry.observer = new IntersectionObserver(
    ([observerEntry]) => {
      const next = observerEntry.isIntersecting
      if (entry.isIntersecting === next) return
      entry.isIntersecting = next
      notify(entry)
    },
    { threshold: 0 },
  )
  entry.observer.observe(el)
  return true
}

function scheduleAttach(selector: string, entry: Entry) {
  if (entry.scheduled != null) return
  entry.scheduled = window.setTimeout(() => {
    entry.scheduled = null
    if (entry.listeners.size === 0) return
    if (attachObserver(selector, entry)) return
    scheduleAttach(selector, entry)
  }, 100)
}

function detach(entry: Entry) {
  if (entry.scheduled != null) {
    clearTimeout(entry.scheduled)
    entry.scheduled = null
  }
  if (entry.observer) {
    entry.observer.disconnect()
    entry.observer = null
  }
  entry.element = null
}

export function subscribeDocumentIntersection(selector: string, listener: Listener): () => void {
  const entry = ensureEntry(selector)
  entry.listeners.add(listener)
  if (!entry.observer) {
    if (!attachObserver(selector, entry)) scheduleAttach(selector, entry)
  }
  return () => {
    entry.listeners.delete(listener)
    if (entry.listeners.size === 0) {
      detach(entry)
      entry.isIntersecting = false
    }
  }
}

export function getDocumentIntersectionSnapshot(selector: string): boolean {
  return entries.get(selector)?.isIntersecting ?? false
}

export function getDocumentIntersectionServerSnapshot(): boolean {
  return false
}
