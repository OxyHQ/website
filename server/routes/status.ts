import { Router } from 'express'
import { Product, type IProduct } from '../models/Product.js'

const router = Router()

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown'

interface ServiceResult {
  id: string
  name: string
  description: string
  section: string
  url: string
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

const PROBE_TIMEOUT_MS = 5_000
const SLOW_LATENCY_MS = 1_500
const CACHE_TTL_MS = 60_000

let cached: StatusPayload | null = null
let cachedAt = 0
let inFlight: Promise<StatusPayload> | null = null

async function probeService(product: IProduct): Promise<ServiceResult> {
  const target = product.healthUrl || product.href
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  const start = Date.now()
  const base: Omit<ServiceResult, 'status' | 'latencyMs' | 'httpStatus' | 'lastChecked'> = {
    id: product.productId,
    name: product.name,
    description: product.tagline || product.description || '',
    section: product.section || 'Other',
    url: product.href,
  }
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
    return { ...base, status, latencyMs, httpStatus, lastChecked: new Date().toISOString() }
  } catch {
    return {
      ...base,
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
  if (services.length === 0) return 'unknown'
  if (services.some(s => s.status === 'down')) return 'down'
  if (services.some(s => s.status === 'degraded')) return 'degraded'
  if (services.every(s => s.status === 'operational')) return 'operational'
  return 'unknown'
}

async function buildPayload(): Promise<StatusPayload> {
  const products = await Product.find({ showOnStatus: true }).sort({ section: 1, order: 1 })
  const services = await Promise.all(products.map(probeService))
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
