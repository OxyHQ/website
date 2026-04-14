import { useSyncExternalStore } from 'react'

type Listener = () => void

interface QueryStore {
  mql: MediaQueryList
  listeners: Set<Listener>
  subscribe: (listener: Listener) => () => void
  getSnapshot: () => boolean
}

const stores = new Map<string, QueryStore>()

function getStore(query: string): QueryStore | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null
  }
  const existing = stores.get(query)
  if (existing) return existing
  const mql = window.matchMedia(query)
  const listeners = new Set<Listener>()
  const notify = () => {
    listeners.forEach((listener) => listener())
  }
  const store: QueryStore = {
    mql,
    listeners,
    subscribe: (listener) => {
      if (listeners.size === 0) {
        mql.addEventListener('change', notify)
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) {
          mql.removeEventListener('change', notify)
        }
      }
    },
    getSnapshot: () => mql.matches,
  }
  stores.set(query, store)
  return store
}

function emptySubscribe(): () => void {
  return () => {}
}

function falseSnapshot(): boolean {
  return false
}

export function useMediaQuery(query: string): boolean {
  const store = getStore(query)
  return useSyncExternalStore(
    store ? store.subscribe : emptySubscribe,
    store ? store.getSnapshot : falseSnapshot,
    falseSnapshot,
  )
}
