import { Router } from 'express'
import { safeFetch } from '@oxyhq/core/server'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { media, products, translations } from '../db/schema/index.js'
import { populate } from '../db/refs.js'
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

/** A product row with its logo already resolved, which is what a probe reads. */
type ProductRow = typeof products.$inferSelect & { logo: unknown }

let cached: CachedStatusPayload | null = null
let cachedAt = 0
let inFlight: Promise<CachedStatusPayload> | null = null

function resolveLogoUrl(logo: unknown): string | null {
  if (!logo || typeof logo !== 'object') return null
  const obj = logo as LogoRef
  return obj.url || obj.thumbnails?.lg || obj.thumbnails?.md || obj.thumbnails?.sm || null
}

async function probeService(product: ProductRow): Promise<CachedServiceResult> {
  const target = product.healthUrl || product.href
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  const start = Date.now()
  const base: Omit<CachedServiceResult, 'status' | 'latencyMs' | 'httpStatus' | 'lastChecked'> = {
    id: product.productId,
    productDocId: product._id,
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
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.showOnStatus, true))
    .orderBy(asc(products.section), asc(products.order), asc(products._id))
  const probed = (await populate(rows, { logo: media })) as unknown as ProductRow[]
  const services = await Promise.all(probed.map(probeService))
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
  const rows = docIds.length > 0
    ? await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.locale, locale),
            eq(translations.collectionName, 'products'),
            inArray(translations.documentId, docIds),
          ),
        )
    : []

  const overlays = new Map<string, Record<string, unknown>>()
  for (const t of rows) {
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
