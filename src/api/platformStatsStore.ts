/**
 * Module-level store for the Oxy platform stats live stream.
 * Mirrors the faircoinStore pattern: one shared EventSource across
 * all subscribers, with an HTTP fallback on error.
 */

export interface PlatformStats {
  totalUsers: number
  activeSessions: number
  totalMessages: number
  totalNotifications: number
  totalFiles: number
  totalTransactions: number
  totalDeveloperApps: number
  totalFollows: number
  aiModels: number
  topCountries: Array<{ location: string; count: number }>
  regions: number
  timestamp: string
}

export interface ActivityEvent {
  countryCode: string
  delta: number
  timestamp: number
}

export interface PlatformStatsState {
  data: PlatformStats
  isConnected: boolean
  activityEvents: ActivityEvent[]
}

const DEFAULT_PLATFORM_STATS: PlatformStats = {
  totalUsers: 0,
  activeSessions: 0,
  totalMessages: 0,
  totalNotifications: 0,
  totalFiles: 0,
  totalTransactions: 0,
  totalDeveloperApps: 0,
  totalFollows: 0,
  aiModels: 4,
  topCountries: [],
  regions: 0,
  timestamp: new Date().toISOString(),
}

const INITIAL_STATE: PlatformStatsState = {
  data: DEFAULT_PLATFORM_STATS,
  isConnected: false,
  activityEvents: [],
}

const MAX_ACTIVITY_EVENTS = 15
// Oxy platform API base URL. Mirrors the VITE_OXY_API convention used in
// App.tsx — a deploy can override it; the production URL is the fallback.
const OXY_API =
  (import.meta.env.VITE_OXY_API as string | undefined) || 'https://api.oxy.so'
const INITIAL_RECONNECT_DELAY_MS = 1_000
const MAX_RECONNECT_DELAY_MS = 30_000

type Listener = () => void

let state: PlatformStatsState = INITIAL_STATE
const listeners = new Set<Listener>()
const prevCountries = new Map<string, number>()

let es: EventSource | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0

function emit() {
  listeners.forEach((listener) => listener())
}

function setState(next: PlatformStatsState) {
  state = next
  emit()
}

function ingest(parsed: PlatformStats) {
  const newEvents: ActivityEvent[] = []
  const now = Date.now()

  for (const entry of parsed.topCountries) {
    const code = entry.location?.toUpperCase()
    if (!code) continue
    const prevCount = prevCountries.get(code) ?? 0
    const delta = entry.count - prevCount
    if (delta > 0 && prevCount > 0) {
      newEvents.push({ countryCode: code, delta, timestamp: now + newEvents.length })
    }
  }

  const nextActivity = newEvents.length > 0
    ? [...state.activityEvents, ...newEvents].slice(-MAX_ACTIVITY_EVENTS)
    : state.activityEvents

  const nextMap = new Map<string, number>()
  for (const entry of parsed.topCountries) {
    const code = entry.location?.toUpperCase()
    if (code) nextMap.set(code, entry.count)
  }
  prevCountries.clear()
  nextMap.forEach((count, code) => prevCountries.set(code, count))

  setState({
    data: parsed,
    isConnected: true,
    activityEvents: nextActivity,
  })
}

async function fetchFallback() {
  try {
    const resp = await fetch(`${OXY_API}/platform-stats`)
    if (!resp.ok) return
    const json = (await resp.json()) as PlatformStats
    ingest(json)
  } catch (err) {
    console.warn('[platformStatsStore] HTTP fallback failed:', err)
  }
}

/**
 * Reconnect the stream with exponential backoff, mirroring `faircoinStore`.
 * Without this a single network blip left the store permanently disconnected:
 * nothing re-opened the EventSource, and `subscribePlatformStats` only opens on
 * an empty→non-empty listener transition, so a dashboard left open froze.
 *
 * Each attempt also refreshes over plain HTTP, so the numbers keep advancing
 * even where the SSE stream itself is unreachable (a proxy stripping
 * `text/event-stream`, for instance).
 */
function scheduleReconnect() {
  if (reconnectTimer || listeners.size === 0) return
  const delay = Math.min(
    INITIAL_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts++),
    MAX_RECONNECT_DELAY_MS
  )
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (listeners.size === 0) return
    fetchFallback()
    openStream()
  }, delay)
}

function openStream() {
  if (typeof EventSource === 'undefined') {
    fetchFallback()
    return
  }
  if (es) return

  try {
    const source = new EventSource(`${OXY_API}/platform-stats/stream`)
    es = source

    source.onopen = () => {
      reconnectAttempts = 0
    }

    source.onmessage = (event) => {
      try {
        ingest(JSON.parse(event.data) as PlatformStats)
      } catch (err) {
        console.warn('[platformStatsStore] stream parse failed:', err)
      }
    }

    source.onerror = () => {
      setState({ ...state, isConnected: false })
      if (es === source) {
        source.close()
        es = null
      }
      scheduleReconnect()
    }
  } catch (err) {
    console.warn('[platformStatsStore] stream open failed:', err)
    fetchFallback()
    scheduleReconnect()
  }
}

function teardown() {
  if (es) {
    const source = es
    es = null
    source.close()
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = 0
  prevCountries.clear()
}

export function subscribePlatformStats(listener: Listener): () => void {
  const wasEmpty = listeners.size === 0
  listeners.add(listener)
  if (wasEmpty) openStream()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) teardown()
  }
}

export function getPlatformStatsSnapshot(): PlatformStatsState {
  return state
}

export function getPlatformStatsServerSnapshot(): PlatformStatsState {
  return INITIAL_STATE
}
