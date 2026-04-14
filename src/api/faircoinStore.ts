export interface FairCoinStats {
  blocks: number
  networkHashPs: number
  connections: number
  difficulty: number
}

interface FairCoinMiningInfo {
  blocks: number
  difficulty: number
  networkhashps: number
}

interface FairCoinNetworkInfo {
  connections: number
}

const API_BASE = 'https://explorer.fairco.in/api'
const WS_URL = 'wss://explorer.fairco.in/api/ws'
const REFRESH_INTERVAL_MS = 60_000
const MAX_RECONNECT_DELAY_MS = 30_000
const INITIAL_RECONNECT_DELAY_MS = 1_000

type Listener = () => void

const NULL_STATS: FairCoinStats | null = null

let stats: FairCoinStats | null = NULL_STATS
const listeners = new Set<Listener>()

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
let refreshTimer: ReturnType<typeof setInterval> | null = null
let inFlight: Promise<void> | null = null

function emit() {
  listeners.forEach(l => l())
}

function setStats(next: FairCoinStats) {
  stats = next
  emit()
}

function patchStats(updater: (prev: FairCoinStats) => FairCoinStats) {
  if (!stats) return
  setStats(updater(stats))
}

async function refresh(): Promise<void> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const [miningRes, networkRes] = await Promise.all([
        fetch(`${API_BASE}/mining-info?network=mainnet`),
        fetch(`${API_BASE}/network-info?network=mainnet`),
      ])
      if (!miningRes.ok) throw new Error(`mining-info HTTP ${miningRes.status}`)
      if (!networkRes.ok) throw new Error(`network-info HTTP ${networkRes.status}`)
      const mining = (await miningRes.json()) as FairCoinMiningInfo
      const network = (await networkRes.json()) as FairCoinNetworkInfo
      setStats({
        blocks: mining.blocks,
        networkHashPs: mining.networkhashps,
        connections: network.connections,
        difficulty: mining.difficulty,
      })
    } catch (err) {
      console.warn('[faircoinStore] REST refresh failed:', err)
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

function handleMessage(raw: string) {
  let msg: { type?: string; data?: Record<string, unknown> }
  try {
    msg = JSON.parse(raw)
  } catch {
    return
  }
  if (msg.type === 'block-count' && msg.data && typeof msg.data.height === 'number') {
    const height = msg.data.height
    patchStats(prev => ({ ...prev, blocks: height }))
    return
  }
  if (msg.type === 'network-stats' && msg.data) {
    const d = msg.data
    const rawRate = d.hashrate
    const hashNum = typeof rawRate === 'number' ? rawRate : parseFloat(String(rawRate))
    patchStats(prev => ({
      ...prev,
      connections: typeof d.connections === 'number' ? d.connections : prev.connections,
      difficulty: typeof d.difficulty === 'number' ? d.difficulty : prev.difficulty,
      networkHashPs: Number.isFinite(hashNum) ? hashNum : prev.networkHashPs,
    }))
  }
}

function openWs() {
  if (typeof WebSocket === 'undefined') return
  if (ws) return
  const socket = new WebSocket(WS_URL)
  ws = socket

  socket.onopen = () => {
    reconnectAttempts = 0
    socket.send(JSON.stringify({ type: 'change-network', network: 'mainnet' }))
    socket.send(JSON.stringify({ type: 'subscribe', events: ['block-count', 'network-stats'] }))
  }

  socket.onmessage = (ev) => {
    handleMessage(ev.data)
  }

  socket.onerror = () => {
    socket.close()
  }

  socket.onclose = () => {
    if (ws === socket) ws = null
    if (listeners.size === 0) return
    const delay = Math.min(INITIAL_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts++), MAX_RECONNECT_DELAY_MS)
    reconnectTimer = setTimeout(openWs, delay)
  }
}

function teardown() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = 0
  if (ws) {
    const socket = ws
    ws = null
    try { socket.close(1000, 'no-subscribers') } catch { /* noop */ }
  }
}

export function subscribeFairCoinStats(listener: Listener): () => void {
  const wasEmpty = listeners.size === 0
  listeners.add(listener)
  if (wasEmpty) {
    refresh()
    openWs()
    refreshTimer = setInterval(refresh, REFRESH_INTERVAL_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) teardown()
  }
}

export function getFairCoinStatsSnapshot(): FairCoinStats | null {
  return stats
}

export function getFairCoinStatsServerSnapshot(): FairCoinStats | null {
  return NULL_STATS
}
