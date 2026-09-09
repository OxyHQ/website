/**
 * Module-level store for the authenticated Oxy platform stats feed.
 * The upstream route is staff-only, so requests go through the Oxy SDK's
 * session-bound client; EventSource cannot carry its Authorization header.
 */

import type { OxyServices } from '@oxyhq/core'

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

export interface PlatformStatsState {
  data: PlatformStats
  isConnected: boolean
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
}
const POLL_INTERVAL_MS = 5_000

type Listener = () => void

let state: PlatformStatsState = INITIAL_STATE
const listeners = new Set<Listener>()
let client: ReturnType<OxyServices['getClient']> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

function emit() {
  listeners.forEach((listener) => listener())
}

function setState(next: PlatformStatsState) {
  state = next
  emit()
}

interface UpstreamPlatformStats {
  totalUsers: number
  activeSessions: number
  totalMessages: number
  totalNotifications: number
  totalFiles: number
  totalTransactions: number
  totalApplications: number
  totalFollows: number
  aiModels: number
  timestamp: string
  topCountries?: Array<{ location: string; count: number }>
  regions?: number
}

function ingest(upstream: UpstreamPlatformStats) {
  const parsed: PlatformStats = {
    ...upstream,
    totalDeveloperApps: upstream.totalApplications,
    topCountries: upstream.topCountries ?? [],
    regions: upstream.regions ?? 0,
  }
  setState({
    data: parsed,
    isConnected: true,
  })
}

async function fetchStats() {
  if (!client) return
  try {
    ingest(await client.request<UpstreamPlatformStats>({
      method: 'GET',
      url: '/platform-stats',
      retry: false,
      deduplicate: false,
    }))
  } catch (err) {
    setState({ ...state, isConnected: false })
    console.warn('[platformStatsStore] authenticated refresh failed:', err)
  }
}

export function setPlatformStatsOxyServices(oxyServices: OxyServices): void {
  client = oxyServices.getClient()
  if (listeners.size > 0) void fetchStats()
}

function teardown() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

export function subscribePlatformStats(listener: Listener): () => void {
  const wasEmpty = listeners.size === 0
  listeners.add(listener)
  if (wasEmpty) {
    void fetchStats()
    pollTimer = setInterval(fetchStats, POLL_INTERVAL_MS)
  }
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
