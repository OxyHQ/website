import { safeFetch } from '@oxyhq/core/server'
import { Router } from 'express'
import type { IncomingMessage } from 'node:http'
import { z } from 'zod'
import { config } from '../config.js'

const router = Router()

const UPSTREAM_TIMEOUT_MS = 5_000
const CACHE_TTL_MS = 60_000
const MAX_RESPONSE_BYTES = 16 * 1024

const fundingProgressSchema = z.object({
  targetAmount: z.number().finite().nonnegative(),
  raisedAmount: z.number().finite().nonnegative(),
  currency: z.string().min(1).max(16),
  sustainable: z.boolean(),
  breakdown: z.object({
    subscriptions: z.number().finite().nonnegative(),
    donations: z.number().finite().nonnegative(),
    partnerships: z.number().finite().nonnegative(),
    services: z.number().finite().nonnegative(),
  }),
  supporters: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
})

type FundingProgress = z.infer<typeof fundingProgressSchema>

const fallbackFundingProgress = (): FundingProgress => ({
  targetAmount: 2500000,
  raisedAmount: 0,
  currency: 'usd',
  sustainable: false,
  breakdown: { subscriptions: 0, donations: 0, partnerships: 0, services: 0 },
  supporters: 0,
  updatedAt: new Date().toISOString(),
})

let cached: FundingProgress | null = null
let cachedAt = 0
let inFlight: Promise<FundingProgress> | null = null

async function readResponseJson(response: IncomingMessage): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0

    response.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length
      if (totalBytes > MAX_RESPONSE_BYTES) {
        response.destroy()
        reject(new Error(`Funding progress response exceeds ${MAX_RESPONSE_BYTES} bytes`))
        return
      }
      chunks.push(chunk)
    })

    response.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (err) {
        reject(err)
      }
    })

    response.on('error', reject)
  })
}

async function fetchFundingProgress(): Promise<FundingProgress> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const result = await safeFetch(`${config.oxyApiBase}/funding-progress`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'OxyWebsiteFundingBot/1.0 (+https://oxy.so/sustain)' },
    })

    if (result.status < 200 || result.status >= 300) {
      result.response.destroy()
      throw new Error(`Oxy API returned ${result.status}`)
    }

    const payload = await readResponseJson(result.response)
    return fundingProgressSchema.parse(payload)
  } finally {
    clearTimeout(timer)
  }
}

async function getFundingProgress(): Promise<FundingProgress> {
  const fresh = cached && Date.now() - cachedAt < CACHE_TTL_MS
  if (fresh && cached) return cached
  if (inFlight) return inFlight

  inFlight = fetchFundingProgress()
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
    res.json(await getFundingProgress())
  } catch (err) {
    console.error('Funding progress proxy failed', err)
    res.json(cached ?? fallbackFundingProgress())
  }
})

export default router
