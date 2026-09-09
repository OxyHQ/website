import { io, type Socket } from 'socket.io-client'

export interface PlatformActivityEvent {
  region: string
  requests: number
  windowStartedAt: string
  emittedAt: string
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
const listeners = new Set<Listener>()

function emit(): void {
  listeners.forEach((listener) => listener())
}

function connect(): void {
  if (socket) return
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
