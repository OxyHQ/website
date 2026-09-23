/**
 * Cost arithmetic for the pricing page's estimator.
 *
 * Every amount in the catalogue is a decimal STRING, and every number here is a
 * `bigint` of nano-dollars (1e-9 USD). That is not defensive style for its own
 * sake: `0.1 + 0.2` is `0.30000000000000004`, and a per-million-token price
 * multiplied by a monthly request count compounds that until the estimate is
 * visibly wrong at the third significant figure. The estimator never authorizes
 * or charges spend — Oxy Console does — but a number on a pricing page is still
 * read as a number, so it is computed exactly and labelled as an estimate.
 */
import type { CatalogEntry, PriceUnit, UnitPrice } from './catalog'

/** 1 USD in the integer unit every computation here uses. */
const NANO_PER_USD = 1_000_000_000n

/** Units quoted per 1,000,000; everything else is quoted per single unit. */
const PER_MILLION_UNITS: readonly PriceUnit[] = [
  'input_token',
  'cached_input_token',
  'output_token',
  'reasoning_token',
  'embedding_token',
]

export function isPerMillionUnit(unit: PriceUnit): boolean {
  return PER_MILLION_UNITS.includes(unit)
}

/**
 * Parse a decimal string into nano-dollars, exactly.
 *
 * Digits beyond the ninth decimal place are truncated rather than rounded: a
 * published price with more precision than the unit carries is an upstream
 * error, and rounding it up would quote more than the price list says.
 */
export function usdStringToNano(amount: string): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount.trim())
  if (!match) throw new Error(`not a decimal amount: ${amount}`)
  const whole = BigInt(match[1] ?? '0')
  const fractionDigits = (match[2] ?? '').slice(0, 9).padEnd(9, '0')
  return whole * NANO_PER_USD + BigInt(fractionDigits)
}

/** Render nano-dollars as a USD string with `decimals` places, truncated. */
export function formatNanoUsd(nano: bigint, decimals = 2): string {
  const negative = nano < 0n
  const absolute = negative ? -nano : nano
  const whole = absolute / NANO_PER_USD
  const fraction = (absolute % NANO_PER_USD).toString().padStart(9, '0').slice(0, decimals)
  const sign = negative ? '-' : ''
  return decimals === 0 ? `${sign}${whole}` : `${sign}${whole}.${fraction}`
}

/**
 * A price as shown in a table: USD per million tokens for token units, USD per
 * unit otherwise. Returned as a string so no float ever exists.
 */
export function displayPrice(price: UnitPrice): string {
  const nano = usdStringToNano(price.amountUsd)
  // Token prices are small enough that two decimals hides the difference
  // between two models; per-request and per-image prices are not.
  const decimals = isPerMillionUnit(price.unit) ? 2 : 4
  return formatNanoUsd(nano, decimals)
}

/** One line of an estimate: how many of a unit, at which price. */
export interface EstimateLine {
  unit: PriceUnit
  /** Units per request. Tokens are counted whole. */
  quantityPerRequest: bigint
}

export interface EstimateInput {
  entry: CatalogEntry
  lines: readonly EstimateLine[]
  monthlyRequests: bigint
  /** Restrict to one deployment's prices when the entry is priced per deployment. */
  deploymentId?: string
}

export interface EstimateLineResult {
  unit: PriceUnit
  /** Undefined when the catalogue publishes no price for this unit. */
  monthlyNanoUsd?: bigint
}

export interface EstimateResult {
  lines: EstimateLineResult[]
  /** Sum of the lines that had a published price. */
  totalNanoUsd: bigint
  /** Units the caller asked about that the catalogue does not price. */
  unpricedUnits: PriceUnit[]
}

/**
 * Monthly cost for a usage shape, in nano-dollars.
 *
 * A unit with no published price contributes NOTHING to the total and is
 * reported in `unpricedUnits` instead. Treating a missing price as zero is how
 * a pricing page ends up quoting a paid feature as free.
 */
export function estimateMonthlyCost(input: EstimateInput): EstimateResult {
  const lines: EstimateLineResult[] = []
  const unpricedUnits: PriceUnit[] = []
  let total = 0n

  for (const line of input.lines) {
    const price = input.entry.prices.find(
      (candidate) =>
        candidate.unit === line.unit &&
        (input.deploymentId === undefined ||
          candidate.deploymentId === undefined ||
          candidate.deploymentId === input.deploymentId),
    )
    if (!price) {
      unpricedUnits.push(line.unit)
      lines.push({ unit: line.unit })
      continue
    }
    const perUnitNano = usdStringToNano(price.amountUsd)
    const totalUnits = line.quantityPerRequest * input.monthlyRequests
    // Divide last: `units * price / 1e6` keeps the whole computation in
    // integers, where `(units / 1e6) * price` would have truncated first.
    const monthly = isPerMillionUnit(line.unit)
      ? (totalUnits * perUnitNano) / 1_000_000n
      : totalUnits * perUnitNano
    total += monthly
    lines.push({ unit: line.unit, monthlyNanoUsd: monthly })
  }

  return { lines, totalNanoUsd: total, unpricedUnits }
}

/** Non-negative integer from a form field, clamped to a sane maximum. */
export function parseQuantity(raw: string, max = 100_000_000_000n): bigint {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits === '') return 0n
  const value = BigInt(digits)
  return value > max ? max : value
}
