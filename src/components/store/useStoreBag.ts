import { useSyncExternalStore } from 'react'
import { STORE_PRODUCTS } from '../../data/store'

interface StoreState {
  quantities: Readonly<Record<string, number>>
  saved: readonly string[]
}

const STORAGE_KEY = 'oxy:store:bag:v1'
const EMPTY: StoreState = { quantities: {}, saved: [] }
const productIds = new Set(STORE_PRODUCTS.map(product => product.id))
const listeners = new Set<() => void>()
let state = EMPTY
let hydrated = false

function readStorage(): StoreState {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!raw || typeof raw !== 'object') return EMPTY
    const stored = raw as { quantities?: unknown; saved?: unknown }
    const quantities: Record<string, number> = {}
    if (stored.quantities && typeof stored.quantities === 'object' && !Array.isArray(stored.quantities)) {
      for (const [id, quantity] of Object.entries(stored.quantities)) {
        if (productIds.has(id) && typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0 && quantity <= 99) quantities[id] = quantity
      }
    }
    const saved = Array.isArray(stored.saved)
      ? [...new Set(stored.saved.filter((id): id is string => typeof id === 'string' && productIds.has(id)))]
      : []
    return { quantities, saved }
  } catch {
    // Private browsing, unavailable storage and an old/corrupt bag still allow a local session.
    return EMPTY
  }
}

function getSnapshot() {
  if (!hydrated && typeof window !== 'undefined') {
    state = readStorage()
    hydrated = true
  }
  return state
}
const getServerSnapshot = () => EMPTY
const emit = () => listeners.forEach(listener => listener())

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return
  state = readStorage()
  hydrated = true
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

function update(next: StoreState) {
  state = next
  hydrated = true
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* Keep the session usable without storage. */ }
  emit()
}

function setQuantity(id: string, quantity: number) {
  if (!productIds.has(id) || !Number.isFinite(quantity)) return
  const current = getSnapshot()
  const quantities = { ...current.quantities }
  const next = Math.max(0, Math.min(99, Math.floor(quantity)))
  if (next > 0) quantities[id] = next
  else delete quantities[id]
  update({ ...current, quantities })
}

function addItem(id: string) {
  setQuantity(id, (getSnapshot().quantities[id] ?? 0) + 1)
}

function toggleSaved(id: string) {
  if (!productIds.has(id)) return
  const current = getSnapshot()
  update({ ...current, saved: current.saved.includes(id) ? current.saved.filter(value => value !== id) : [...current.saved, id] })
}

/** A device-local preview bag shared by the collection and product routes. No checkout or account data. */
export function useStoreBag() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return {
    ...snapshot,
    count: Object.values(snapshot.quantities).reduce((total, quantity) => total + quantity, 0),
    total: STORE_PRODUCTS.reduce((total, product) => total + product.price * (snapshot.quantities[product.id] ?? 0), 0),
    setQuantity,
    addItem,
    toggleSaved,
  }
}
