import { Router } from 'express'

/* ──────────────────────────────────────────────
 * /api/homiio/listings
 *
 * Real rental listings for the `/homiio` landing, read from Homiio's own
 * public API. It goes through this server for two reasons: `api.homiio.com`
 * sends no CORS headers, so a browser on oxy.so cannot call it directly, and
 * one shared cache here spares Homiio a request per visitor.
 *
 * Only the fields the cards render are forwarded. Listings without a price or
 * a photo are dropped rather than rendered half empty.
 * ──────────────────────────────────────────── */

const HOMIIO_API = 'https://api.homiio.com/api/properties'
const HOMIIO_SITE = 'https://homiio.com'
const REQUEST_TIMEOUT_MS = 6_000
const CACHE_TTL_MS = 10 * 60_000
/** Enough for the hero wheel and the spiral to never repeat a card. */
const LISTING_COUNT = 12

export interface HomiioListingDto {
  id: string
  /** e.g. "Apartment in Barcelona" — Homiio stores no display title. */
  title: string
  city: string
  monthlyAmount: number
  currency: string
  bedrooms: number | null
  squareFootage: number | null
  imageUrl: string
  href: string
}

interface HomiioImage {
  url?: string
  isPrimary?: boolean
  order?: number
}

interface HomiioProperty {
  _id?: string
  type?: string
  bedrooms?: number
  squareFootage?: number
  coverImageIndex?: number
  images?: HomiioImage[]
  longTermRent?: { monthlyAmount?: number; currency?: string }
  address?: { street?: string; city?: string }
}

/** `apartment` → `Apartment`, `shared_room` → `Shared room`. */
function labelForType(type: string | undefined): string {
  if (!type) return 'Home'
  const spaced = type.replace(/[_-]+/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * The cover image, honouring the property's own choice: an explicit
 * `coverImageIndex`, then the primary flag, then the first one.
 */
function coverImage(property: HomiioProperty): string | null {
  const images = property.images ?? []
  if (images.length === 0) return null
  const chosen =
    images[property.coverImageIndex ?? -1] ?? images.find((image) => image.isPrimary) ?? images[0]
  return chosen?.url ?? null
}

function toDto(property: HomiioProperty): HomiioListingDto | null {
  const id = property._id
  const monthlyAmount = property.longTermRent?.monthlyAmount
  const imageUrl = coverImage(property)
  // Homiio's address `street` holds the city for scraped listings; either field
  // may be missing, and a card with no place name is not worth showing.
  const city = property.address?.city || property.address?.street
  if (!id || !monthlyAmount || !imageUrl || !city) return null

  return {
    id,
    title: `${labelForType(property.type)} in ${city}`,
    city,
    monthlyAmount,
    currency: property.longTermRent?.currency || 'EUR',
    bedrooms: property.bedrooms ?? null,
    squareFootage: property.squareFootage ?? null,
    imageUrl,
    href: `${HOMIIO_SITE}/properties/${id}`,
  }
}

let cached: HomiioListingDto[] | null = null
let cachedAt = 0
let inFlight: Promise<HomiioListingDto[]> | null = null

async function fetchListings(): Promise<HomiioListingDto[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const url = new URL(HOMIIO_API)
    url.searchParams.set('offering', 'long_term_rent')
    url.searchParams.set('hasPhotos', 'true')
    url.searchParams.set('sortBy', 'createdAt')
    url.searchParams.set('sortOrder', 'desc')
    // Over-fetch a little: a few come back without a price or a usable photo.
    url.searchParams.set('limit', String(LISTING_COUNT * 2))

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'OxyWebsite/1.0 (+https://oxy.so/homiio)' },
    })
    if (!response.ok) throw new Error(`Homiio API responded ${response.status}`)

    const body = (await response.json()) as { data?: HomiioProperty[] }
    return (body.data ?? [])
      .map(toDto)
      .filter((listing): listing is HomiioListingDto => listing !== null)
      .slice(0, LISTING_COUNT)
  } finally {
    clearTimeout(timer)
  }
}

/** One upstream request at a time, shared by everyone waiting on it. */
function listings(): Promise<HomiioListingDto[]> {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return Promise.resolve(cached)
  if (inFlight) return inFlight

  inFlight = fetchListings()
    .then((fresh) => {
      cached = fresh
      cachedAt = Date.now()
      return fresh
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

const router = Router()

router.get('/listings', async (_req, res) => {
  try {
    const data = await listings()
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
    res.json({ listings: data })
  } catch (error) {
    // The landing has its own placeholder cards, so an upstream failure is an
    // empty list rather than a broken page.
    console.error('[homiio] listings unavailable:', error instanceof Error ? error.message : error)
    res.set('Cache-Control', 'public, max-age=30')
    res.json({ listings: [] })
  }
})

export default router
