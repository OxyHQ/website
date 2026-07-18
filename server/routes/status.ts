import { Router } from 'express'
import { safeFetch } from '@oxyhq/core/server'
import { Product, type IProduct } from '../models/Product.js'
import { Translation } from '../models/Translation.js'
import { localeMiddleware } from '../middleware/locale.js'

const router = Router()

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown'

interface LogoRef {
  url?: string
  thumbnails?: { sm?: string; md?: string; lg?: string }
}

interface ServiceResult {
  id: string
  name: string
  description: string
  section: string
  url: string
  landingUrl: string | null
  brand: string
  brandForeground?: string
  mark: string
  logoUrl: string | null
  status: ServiceStatus
  latencyMs: number | null
  httpStatus: number | null
  lastChecked: string
}

// Internal variant: adds the Mongo document id so the per-locale response
// builder can look up a Translation override for name/description without
// re-probing or re-querying the product collection. The `productDocId` field
// is stripped before the payload is written to the wire.
interface CachedServiceResult extends ServiceResult {
  productDocId: string
}

interface CachedStatusPayload {
  generatedAt: string
  overall: ServiceStatus
  services: CachedServiceResult[]
}

interface StatusPayload {
  generatedAt: string
  overall: ServiceStatus
  services: ServiceResult[]
}

const PROBE_TIMEOUT_MS = 5_000
const SLOW_LATENCY_MS = 1_500
const CACHE_TTL_MS = 60_000

let cached: CachedStatusPayload | null = null
let cachedAt = 0
let inFlight: Promise<CachedStatusPayload> | null = null

function resolveLogoUrl(logo: unknown): string | null {
  if (!logo || typeof logo !== 'object') return null
  const obj = logo as LogoRef
  return obj.url || obj.thumbnails?.lg || obj.thumbnails?.md || obj.thumbnails?.sm || null
}

async function probeService(product: IProduct): Promise<CachedServiceResult> {
  const target = product.healthUrl || product.href
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  const start = Date.now()
  const base: Omit<CachedServiceResult, 'status' | 'latencyMs' | 'httpStatus' | 'lastChecked'> = {
    id: product.productId,
    productDocId: product._id.toString(),
    name: product.name,
    description: product.tagline || product.description || '',
    section: product.section || 'Other',
    url: product.href,
    landingUrl: product.landingUrl || null,
    brand: product.brand,
    brandForeground: product.brandForeground,
    mark: product.mark,
    logoUrl: resolveLogoUrl(product.logo),
  }
  try {
    // healthUrl/href are CMS-supplied, so the probe must be SSRF-safe.
    const result = await safeFetch(target, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'OxyStatusBot/1.0 (+https://oxy.so/status)' },
    })
    const latencyMs = Date.now() - start
    const httpStatus = result.status
    // Only the status line matters for a health probe — discard the body.
    result.response.destroy()
    const status: ServiceStatus = httpStatus >= 200 && httpStatus < 400
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

function computeOverall(services: CachedServiceResult[]): ServiceStatus {
  if (services.length === 0) return 'unknown'
  if (services.some(s => s.status === 'down')) return 'down'
  if (services.some(s => s.status === 'degraded')) return 'degraded'
  if (services.every(s => s.status === 'operational')) return 'operational'
  return 'unknown'
}

async function buildPayload(): Promise<CachedStatusPayload> {
  const products = await Product.find({ showOnStatus: true })
    .sort({ section: 1, order: 1 })
    .populate('logo')
  const services = await Promise.all(products.map(probeService))
  return {
    generatedAt: new Date().toISOString(),
    overall: computeOverall(services),
    services,
  }
}

async function getStatus(): Promise<CachedStatusPayload> {
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

function stripDocId({ productDocId: _docId, ...rest }: CachedServiceResult): ServiceResult {
  void _docId
  return rest
}

/**
 * Strip the internal `productDocId` field and overlay any translated
 * name/description/section for the caller's locale. Returns the public
 * StatusPayload shape.
 */
async function localizePayload(
  payload: CachedStatusPayload,
  locale: string | undefined,
  isDefaultLocale: boolean,
): Promise<StatusPayload> {
  if (isDefaultLocale || !locale) {
    return {
      generatedAt: payload.generatedAt,
      overall: payload.overall,
      services: payload.services.map(stripDocId),
    }
  }

  const docIds = payload.services.map(s => s.productDocId)
  const translations = await Translation.find({
    locale,
    collectionName: 'products',
    documentId: { $in: docIds },
  })

  const overlays = new Map<string, Record<string, unknown>>()
  for (const t of translations) {
    overlays.set(t.documentId, t.fields)
  }

  const services: ServiceResult[] = payload.services.map(({ productDocId, ...base }) => {
    const fields = overlays.get(productDocId)
    if (!fields) return base
    const name = typeof fields.name === 'string' ? fields.name : base.name
    const tagline = typeof fields.tagline === 'string' ? fields.tagline : null
    const description = typeof fields.description === 'string' ? fields.description : null
    // Preserve the same "tagline over description" fallback used when probing.
    const nextDescription = tagline ?? description ?? base.description
    return { ...base, name, description: nextDescription }
  })

  return {
    generatedAt: payload.generatedAt,
    overall: payload.overall,
    services,
  }
}

router.get('/', localeMiddleware, async (req, res) => {
  try {
    const payload = await getStatus()
    const localized = await localizePayload(payload, req.locale, req.isDefaultLocale ?? true)
    res.json(localized)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'status probe failed' })
  }
})

export default router
