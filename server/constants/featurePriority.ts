import { z } from 'zod'
import { config } from '../config.js'

/**
 * Priority tiers for the feature board.
 *
 * A tier is applied to the GitHub issue as a label once the combined vote count
 * (site votes + GitHub `+1` reactions) reaches `enterAt`, and is only given up
 * once the count falls below `exitAt`. The gap between the two is the
 * hysteresis band: an issue sitting on a boundary and gaining/losing a single
 * vote does not flip its label back and forth, because leaving a tier takes a
 * real retreat rather than one vote.
 *
 * Tiers are configuration, not constants baked into a handler: set
 * `FEATURE_PRIORITY_TIERS` to a JSON array of the same shape to override the
 * table below without a deploy of new code.
 */
export interface PriorityTier {
  /** Stable identifier exposed in the API and used by the SPA. */
  key: string
  /** GitHub label name. Identical in every tracked repo, in every org. */
  label: string
  /** GitHub label colour, six hex digits, no leading `#`. */
  color: string
  /** GitHub label description. */
  description: string
  /** Combined votes at which an issue enters this tier. */
  enterAt: number
  /** Combined votes below which an issue leaves this tier. */
  exitAt: number
}

/**
 * Ascending by `enterAt`. Anything below the first tier's `enterAt` carries no
 * priority label at all, which is what keeps the labels meaningful: most
 * proposals never earn one.
 */
const DEFAULT_PRIORITY_TIERS: PriorityTier[] = [
  {
    key: 'medium',
    label: 'priority: medium',
    color: 'fbca04',
    description: 'Set from the Oxy feature board vote count. Do not edit by hand.',
    enterAt: 10,
    exitAt: 7,
  },
  {
    key: 'high',
    label: 'priority: high',
    color: 'd93f0b',
    description: 'Set from the Oxy feature board vote count. Do not edit by hand.',
    enterAt: 25,
    exitAt: 18,
  },
  {
    key: 'critical',
    label: 'priority: critical',
    color: 'b60205',
    description: 'Set from the Oxy feature board vote count. Do not edit by hand.',
    enterAt: 50,
    exitAt: 38,
  },
]

const tierSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/, 'color must be six hex digits without a leading #'),
  description: z.string().min(1),
  enterAt: z.number().int().positive(),
  exitAt: z.number().int().nonnegative(),
})

const tierListSchema = z.array(tierSchema).min(1)

/**
 * A tier table is only usable if every tier can actually be entered and left.
 * Rejecting a bad table at boot beats discovering at reconcile time that two
 * tiers overlap and an issue oscillates between them forever.
 */
function assertUsable(tiers: PriorityTier[]): void {
  let previousEnterAt = 0
  for (const tier of tiers) {
    if (tier.exitAt >= tier.enterAt) {
      throw new Error(`priority tier "${tier.key}": exitAt (${tier.exitAt}) must be below enterAt (${tier.enterAt})`)
    }
    if (tier.enterAt <= previousEnterAt) {
      throw new Error(`priority tier "${tier.key}": enterAt (${tier.enterAt}) must be above the previous tier's enterAt (${previousEnterAt})`)
    }
    previousEnterAt = tier.enterAt
  }

  const labels = new Set(tiers.map((tier) => tier.label.toLowerCase()))
  if (labels.size !== tiers.length) {
    throw new Error('priority tiers must not share a label')
  }
  const keys = new Set(tiers.map((tier) => tier.key.toLowerCase()))
  if (keys.size !== tiers.length) {
    throw new Error('priority tiers must not share a key')
  }
}

/**
 * Parse the configured tier table, falling back to the default one.
 *
 * Throws on a malformed override rather than silently reverting to the
 * defaults: a typo in the environment must not quietly relabel every issue in
 * every tracked repo.
 */
function resolvePriorityTiers(raw: string): PriorityTier[] {
  if (!raw.trim()) {
    assertUsable(DEFAULT_PRIORITY_TIERS)
    return DEFAULT_PRIORITY_TIERS
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('FEATURE_PRIORITY_TIERS is not valid JSON')
  }

  const result = tierListSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`FEATURE_PRIORITY_TIERS is invalid: ${result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ')}`)
  }

  const tiers = [...result.data].sort((a, b) => a.enterAt - b.enterAt)
  assertUsable(tiers)
  return tiers
}

let cachedTiers: PriorityTier[] | null = null

/**
 * The tier table this process runs with.
 *
 * Parsed once and reused: it is read per issue during a reconcile and per issue
 * again when the board serialises its response. Call it once at boot so a
 * malformed `FEATURE_PRIORITY_TIERS` fails there rather than on a request.
 */
export function getPriorityTiers(): PriorityTier[] {
  if (!cachedTiers) cachedTiers = resolvePriorityTiers(config.featureBoard.priorityTiers)
  return cachedTiers
}
