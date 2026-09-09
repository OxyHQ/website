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
const RECONNECT_DELAY_MS = 500
const MAX_RECONNECT_DELAY_MS = 10_000
const CONNECTION_TIMEOUT_MS = 10_000
const INITIAL_STATE: PlatformActivityState = { events: [], isConnected: false }

type Listener = () => void

let state = INITIAL_STATE
let socket: Socket | null = null
let remoteEvents: PlatformActivityEvent[] = []
const listeners = new Set<Listener>()
type EdgeLocation = { iata: string; city: string; cca2: string; lat: number; lon: number }
let edgeLocations: EdgeLocation[] = []
let edgeLocationsPromise: Promise<EdgeLocation[]> | null = null

function loadEdgeLocations(): Promise<EdgeLocation[]> {
  edgeLocationsPromise ??= fetch('https://speed.cloudflare.com/locations')
    .then((response) => response.ok ? response.json() as Promise<EdgeLocation[]> : [])
    .then((locations) => {
      edgeLocations = locations
      return locations
    })
    .catch(() => [])
  return edgeLocationsPromise
}

function enrichEdgeOrigin(event: PlatformActivityEvent): PlatformActivityEvent {
  if (!event.sourceRegion?.startsWith('edge-') || event.sourceCoordinates) return event
  const iata = event.sourceRegion.slice(5).toLowerCase()
  const edge = edgeLocations.find((location) => location.iata.toLowerCase() === iata)
  if (!edge) return event
  return {
    ...event,
    sourceCoordinates: [edge.lon, edge.lat],
    sourceLabel: edge.city,
    sourceCountry: edge.cca2,
  }
}

function enrichRemoteEvents(): void {
  const enriched = remoteEvents.map(enrichEdgeOrigin)
  if (enriched.some((event, index) => event !== remoteEvents[index])) {
    remoteEvents = enriched
    state = { ...state, events: visibleEvents() }
    emit()
  }
}

function visibleEvents(): PlatformActivityEvent[] {
  return remoteEvents.slice(-MAX_ACTIVITY_EVENTS)
}

function emit(): void {
  listeners.forEach((listener) => listener())
}

function connect(): void {
  if (socket) return
  void loadEdgeLocations().then(enrichRemoteEvents)
  socket = io(`${OXY_API}/platform-activity`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: RECONNECT_DELAY_MS,
    reconnectionDelayMax: MAX_RECONNECT_DELAY_MS,
    randomizationFactor: 0.5,
    timeout: CONNECTION_TIMEOUT_MS,
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
    remoteEvents = [...remoteEvents, enrichEdgeOrigin(event)].slice(-MAX_ACTIVITY_EVENTS)
    state = { isConnected: true, events: visibleEvents() }
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
      remoteEvents = []
      edgeLocations = []
      edgeLocationsPromise = null
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
