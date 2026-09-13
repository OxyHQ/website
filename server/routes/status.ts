import { Router } from 'express'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { translations } from '../db/schema/index.js'
import { localeMiddleware } from '../middleware/locale.js'
import {
  getStatus,
  type CachedServiceResult,
  type CachedStatusPayload,
  type ServiceResult,
  type ServiceStatus,
} from '../services/statusProbe.js'

const router = Router()

export interface StatusPayload {
  generatedAt: string
  overall: ServiceStatus
  services: ServiceResult[]
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

/**
 * Machine-readable status snapshot for trusted integrations such as Fin.
 * Keep the internal product document id out of the connector response just
 * as the public route does.
 */
export async function getStatusSnapshot(): Promise<StatusPayload> {
  const payload = await getStatus()
  return {
    generatedAt: payload.generatedAt,
    overall: payload.overall,
    services: payload.services.map(stripDocId),
  }
}

export default router
