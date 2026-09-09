import { io, type Socket } from 'socket.io-client'

export interface PlatformActivityEvent {
  region: string
  requests: number
  windowStartedAt: string
  emittedAt: string
  direction?: 'inbound' | 'outbound' | 'internal'
  service?: string
  sourceRegion?: string
  targetRegion?: string
  sourceCoordinates?: [number, number]
  sourceLabel?: string
  sourceCountry?: string
}

interface PlatformActivityState {
  events: PlatformActivityEvent[]
  isConnected: boolean
}

const OXY_API =
  (import.meta.env.VITE_OXY_API as string | undefined) || 'https://api.oxy.so'
const MAX_ACTIVITY_EVENTS = 20
const INITIAL_STATE: PlatformActivityState = { events: [], isConnected: false }

type Listener = () => void

let state = INITIAL_STATE
let socket: Socket | null = null
let edgeRefreshTimer: ReturnType<typeof setInterval> | null = null
let localOriginKey = ''
const listeners = new Set<Listener>()

async function addLocalEdgeConnection(): Promise<void> {
  try {
    const [response, locationsResponse] = await Promise.all([
      fetch('/cdn-cgi/trace', { cache: 'no-store' }),
      fetch('https://speed.cloudflare.com/locations'),
    ])
    if (!response.ok) return
    const trace = await response.text()
    // Deliberately read only the serving PoP and country. The trace response
    // also contains an IP; it must never enter application state or telemetry.
    const colo = trace.match(/^colo=([a-z]{3})\r?$/im)?.[1]?.toLowerCase()
    const country = trace.match(/^loc=([a-z]{2})\r?$/im)?.[1]?.toUpperCase()
    if (!colo) return
    const locations = locationsResponse.ok
      ? await locationsResponse.json() as Array<{ iata: string; city: string; cca2: string; lat: number; lon: number }>
      : []
    const servingEdge = locations.find((location) => location.iata.toLowerCase() === colo)
    const edge = servingEdge?.cca2 === country
      ? servingEdge
      : locations.find((location) => location.cca2 === country) ?? servingEdge
    const originKey = `${colo}:${country ?? ''}:${edge?.iata ?? ''}`
    if (originKey === localOriginKey) return
    localOriginKey = originKey
    const emittedAt = new Date().toISOString()
    const event: PlatformActivityEvent = {
      region: 'us-west-2',
      sourceRegion: `edge-${colo}`,
      targetRegion: 'us-west-2',
      requests: 1,
      windowStartedAt: emittedAt,
      emittedAt,
      direction: 'inbound',
      service: 'platform',
      ...(edge ? {
        sourceCoordinates: [edge.lon, edge.lat] as [number, number],
        sourceLabel: edge.city,
        sourceCountry: edge.cca2,
      } : {}),
    }
    state = { ...state, events: [...state.events, event].slice(-MAX_ACTIVITY_EVENTS) }
    emit()
  } catch {
    // Local development and non-Cloudflare mirrors do not expose this route.
  }
}

function emit(): void {
  listeners.forEach((listener) => listener())
}

function connect(): void {
  if (socket) return
  void addLocalEdgeConnection()
  edgeRefreshTimer = setInterval(() => void addLocalEdgeConnection(), 15_000)
  socket = io(`${OXY_API}/platform-activity`, {
    transports: ['websocket'],
    reconnection: true,
  })
  socket.on('connect', () => {
    state = { ...state, isConnected: true }
    emit()
  })
  socket.on('disconnect', () => {
    state = { ...state, isConnected: false }
    emit()
  })
  socket.on('platform_activity', (event: PlatformActivityEvent) => {
    if (
      typeof event?.region !== 'string' ||
      typeof event?.requests !== 'number' ||
      typeof event?.emittedAt !== 'string'
    ) return
    state = {
      isConnected: true,
      events: [...state.events, event].slice(-MAX_ACTIVITY_EVENTS),
    }
    emit()
  })
}

export function subscribePlatformActivity(listener: Listener): () => void {
  listeners.add(listener)
  if (listeners.size === 1) connect()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      socket?.disconnect()
      socket = null
      if (edgeRefreshTimer) clearInterval(edgeRefreshTimer)
      edgeRefreshTimer = null
      localOriginKey = ''
      state = INITIAL_STATE
    }
  }
}

export function getPlatformActivitySnapshot(): PlatformActivityState {
  return state
}

export function getPlatformActivityServerSnapshot(): PlatformActivityState {
  return INITIAL_STATE
}
