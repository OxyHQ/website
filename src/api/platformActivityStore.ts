import { parseInfrastructureSnapshot } from '../../server/contracts/platformInfrastructure'
import { io, type Socket } from 'socket.io-client'
import type { InfraStatusNode } from './hooks'
import { activityWindow } from './platformActivityWindow'

export interface PlatformActivityEvent {
  region: string
  requests: number
  activeClients?: number
  windowStartedAt: string
  emittedAt: string
  direction?: 'inbound' | 'outbound' | 'internal'
  scope?: 'internal' | 'external'
  activityType?: 'identity' | 'ai' | 'communication' | 'media' | 'platform'
  sourceService?: string
  targetService?: string
  targetCoordinates?: [number, number]
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
  infrastructure: InfraStatusNode[] | null
}

const OXY_API =
  (import.meta.env.VITE_OXY_API as string | undefined) || 'https://api.oxy.so'
const RECONNECT_DELAY_MS = 500
const MAX_RECONNECT_DELAY_MS = 10_000
const CONNECTION_TIMEOUT_MS = 10_000
const INITIAL_STATE: PlatformActivityState = { events: [], isConnected: false, infrastructure: null }

type Listener = () => void

let state = INITIAL_STATE
let socket: Socket | null = null
let expiryTimer: ReturnType<typeof setInterval> | null = null
let infrastructureTimestamp = 0
let remoteEvents: PlatformActivityEvent[] = []
const listeners = new Set<Listener>()
type EdgeLocation = { iata: string; city: string; cca2: string; lat: number; lon: number }
let edgeLocations: EdgeLocation[] = []
let edgeLocationsPromise: Promise<EdgeLocation[]> | null = null

function loadEdgeLocations(): Promise<EdgeLocation[]> {
  edgeLocationsPromise ??= fetch('https://speed.cloudflare.com/locations')
    .then((response) => {
      if (!response.ok) throw new Error('Edge locations unavailable')
      return response.json() as Promise<EdgeLocation[]>
    })
    .then((locations) => {
      edgeLocations = locations
      return locations
    })
    .catch(() => {
      edgeLocationsPromise = null
      return []
    })
  return edgeLocationsPromise
}

function enrichEdgeOrigin(event: PlatformActivityEvent): PlatformActivityEvent {
  const source = event.sourceRegion?.startsWith('edge-')
    ? edgeLocations.find(location => location.iata.toLowerCase() === event.sourceRegion!.slice(5).toLowerCase())
    : undefined
  const target = event.targetRegion?.startsWith('edge-')
    ? edgeLocations.find(location => location.iata.toLowerCase() === event.targetRegion!.slice(5).toLowerCase())
    : undefined
  if ((!source || event.sourceCoordinates) && (!target || event.targetCoordinates)) return event
  return {
    ...event,
    ...(source && !event.sourceCoordinates ? {
      sourceCoordinates: [source.lon, source.lat] as [number, number],
      sourceLabel: source.city,
      sourceCountry: source.cca2,
    } : {}),
    ...(target && !event.targetCoordinates ? {
      targetCoordinates: [target.lon, target.lat] as [number, number],
    } : {}),
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
  return activityWindow(remoteEvents)
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
    state = { ...state, isConnected: false, infrastructure: state.infrastructure?.map(node => ({ ...node, status: 'unknown' })) ?? null }
    emit()
  })
  socket.on('platform_infrastructure', (value: unknown) => {
    const snapshot = parseInfrastructureSnapshot(value)
    if (!snapshot || Date.parse(snapshot.emittedAt) < infrastructureTimestamp) return
    infrastructureTimestamp = Date.parse(snapshot.emittedAt)
    state = { ...state, infrastructure: snapshot.nodes }
    emit()
  })
  socket.on('platform_activity', (event: PlatformActivityEvent) => {
    if (
      typeof event?.region !== 'string' ||
      typeof event?.requests !== 'number' || !Number.isFinite(event.requests) || event.requests < 1 ||
      typeof event?.emittedAt !== 'string'
    ) return
    remoteEvents = activityWindow([...remoteEvents, enrichEdgeOrigin(event)])
    state = { ...state, isConnected: true, events: visibleEvents() }
    emit()
  })
  expiryTimer = setInterval(() => {
    if (edgeLocations.length === 0) void loadEdgeLocations().then(enrichRemoteEvents)
    const current = visibleEvents()
    if (current.length === remoteEvents.length) return
    remoteEvents = current
    state = { ...state, events: current }
    emit()
  }, 2_000)
}

export function subscribePlatformActivity(listener: Listener): () => void {
  listeners.add(listener)
  if (listeners.size === 1) connect()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      if (expiryTimer) clearInterval(expiryTimer)
      expiryTimer = null
      socket?.disconnect()
      socket = null
      infrastructureTimestamp = 0
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
