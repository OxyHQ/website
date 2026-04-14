import { Router } from 'express'

const router = Router()

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown'

interface ServiceDefinition {
  id: string
  name: string
  description: string
  category: string
  url: string
  healthUrl?: string
}

interface ServiceResult extends ServiceDefinition {
  status: ServiceStatus
  latencyMs: number | null
  httpStatus: number | null
  lastChecked: string
}

interface StatusPayload {
  generatedAt: string
  overall: ServiceStatus
  services: ServiceResult[]
}

// ── Service catalog ────────────────────────────────────────────────
// Each entry is pinged on demand with a 5s timeout. `healthUrl` wins over
// `url` when present so we can ping an unauthenticated health endpoint.
const SERVICES: ServiceDefinition[] = [
  // Oxy Infrastructure
  { id: 'oxy-api', name: 'Oxy API', description: 'Core identity + platform API', category: 'Infrastructure', url: 'https://api.oxy.so', healthUrl: 'https://api.oxy.so/health' },
  { id: 'website-api', name: 'Website API', description: 'Powers oxy.so content and MCP', category: 'Infrastructure', url: 'https://website-api.oxy.so', healthUrl: 'https://website-api.oxy.so/api/newsroom?limit=1' },
  { id: 'oxy-website', name: 'Oxy.so', description: 'Marketing + product site', category: 'Infrastructure', url: 'https://oxy.so' },
  { id: 'accounts', name: 'Accounts', description: 'Sign-in, profile, billing', category: 'Infrastructure', url: 'https://accounts.oxy.so' },
  { id: 'auth', name: 'Auth', description: 'OAuth and SSO flows', category: 'Infrastructure', url: 'https://auth.oxy.so' },
  { id: 'console', name: 'Console', description: 'Developer console', category: 'Infrastructure', url: 'https://console.oxy.so' },
  { id: 'inbox', name: 'Inbox', description: 'Unified messaging hub', category: 'Apps', url: 'https://inbox.oxy.so' },
  { id: 'oxy-os', name: 'Oxy OS', description: 'Desktop environment', category: 'Apps', url: 'https://os.oxy.so' },

  // Oxy Apps
  { id: 'alia', name: 'Alia', description: 'AI-powered assistant', category: 'Apps', url: 'https://alia.onl' },
  { id: 'mention', name: 'Mention', description: 'Decentralized social media', category: 'Apps', url: 'https://mention.earth' },
  { id: 'homiio', name: 'Homiio', description: 'Real estate platform', category: 'Apps', url: 'https://homiio.com' },
  { id: 'clarity', name: 'Clarity', description: 'AI-powered answer engine', category: 'Apps', url: 'https://clarity.surf' },

  // FairCoin
  { id: 'faircoin', name: 'FairCoin', description: 'Ethical digital currency', category: 'FairCoin', url: 'https://fairco.in' },
  { id: 'faircoin-explorer', name: 'FairCoin Explorer', description: 'Blockchain explorer', category: 'FairCoin', url: 'https://explorer.fairco.in', healthUrl: 'https://explorer.fairco.in/api/mining-info?network=mainnet' },

  // Infrastructure namespaces
  { id: 'tnp', name: 'TNP', description: 'Alternative namespace system', category: 'Infrastructure', url: 'https://tnp.network' },
]

const PROBE_TIMEOUT_MS = 5_000
const SLOW_LATENCY_MS = 1_500
const CACHE_TTL_MS = 60_000

let cached: StatusPayload | null = null
let cachedAt = 0
let inFlight: Promise<StatusPayload> | null = null

async function probeService(service: ServiceDefinition): Promise<ServiceResult> {
  const target = service.healthUrl ?? service.url
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  const start = Date.now()
  try {
    const res = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'OxyStatusBot/1.0 (+https://oxy.so/status)' },
    })
    const latencyMs = Date.now() - start
    const httpStatus = res.status
    const ok = res.ok || (httpStatus >= 200 && httpStatus < 400)
    const status: ServiceStatus = ok
      ? (latencyMs > SLOW_LATENCY_MS ? 'degraded' : 'operational')
      : 'down'
    return { ...service, status, latencyMs, httpStatus, lastChecked: new Date().toISOString() }
  } catch {
    return {
      ...service,
      status: 'down',
      latencyMs: null,
      httpStatus: null,
      lastChecked: new Date().toISOString(),
    }
  } finally {
    clearTimeout(timer)
  }
}

function computeOverall(services: ServiceResult[]): ServiceStatus {
  if (services.some(s => s.status === 'down')) return 'down'
  if (services.some(s => s.status === 'degraded')) return 'degraded'
  if (services.every(s => s.status === 'operational')) return 'operational'
  return 'unknown'
}

async function buildPayload(): Promise<StatusPayload> {
  const services = await Promise.all(SERVICES.map(probeService))
  return {
    generatedAt: new Date().toISOString(),
    overall: computeOverall(services),
    services,
  }
}

async function getStatus(): Promise<StatusPayload> {
  const fresh = cached && Date.now() - cachedAt < CACHE_TTL_MS
  if (fresh && cached) return cached
  if (inFlight) return inFlight
  inFlight = buildPayload()
    .then((payload) => {
      cached = payload
      cachedAt = Date.now()
      return payload
    })
    .finally(() => { inFlight = null })
  return inFlight
}

router.get('/', async (_req, res) => {
  try {
    const payload = await getStatus()
    res.json(payload)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'status probe failed' })
  }
})

export default router
