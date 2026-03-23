import type { Request, Response, NextFunction } from 'express'
import { Locale } from '../models/Locale.js'

declare global {
  namespace Express {
    interface Request {
      locale?: string
      isDefaultLocale?: boolean
    }
  }
}

let cachedDefault: string | null = null
let cachedEnabled: Set<string> | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

async function getLocaleInfo() {
  const now = Date.now()
  if (cachedDefault && cachedEnabled && now - cacheTime < CACHE_TTL) {
    return { defaultLocale: cachedDefault, enabledLocales: cachedEnabled }
  }

  const locales = await Locale.find({ enabled: true }).lean()
  const defaultLocale = locales.find(l => l.isDefault)?.code ?? 'en'
  const enabledLocales = new Set(locales.map(l => l.code))
  if (!enabledLocales.size) enabledLocales.add(defaultLocale)

  cachedDefault = defaultLocale
  cachedEnabled = enabledLocales
  cacheTime = now
  return { defaultLocale, enabledLocales }
}

/** Invalidate the cached locale list (call after locale CRUD operations). */
export function invalidateLocaleCache() {
  cachedDefault = null
  cachedEnabled = null
  cacheTime = 0
}

/**
 * Reads `?locale=xx` from the query string, validates it, and sets
 * `req.locale` and `req.isDefaultLocale` on the request.
 */
export async function localeMiddleware(req: Request, _res: Response, next: NextFunction) {
  const { defaultLocale, enabledLocales } = await getLocaleInfo()
  const requested = (req.query.locale as string)?.toLowerCase()

  if (requested && enabledLocales.has(requested)) {
    req.locale = requested
    req.isDefaultLocale = requested === defaultLocale
  } else {
    req.locale = defaultLocale
    req.isDefaultLocale = true
  }
  next()
}
