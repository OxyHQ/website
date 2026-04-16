/**
 * FAIR address + amount validation, mirrored to the bridge's zod schema.
 *
 * Keep these regexes in sync with the bridge `QuoteBody` schema in
 * services/bridge/src/api/buy.ts so client-side rejection matches what the
 * bridge would reject server-side. The client check is a UX optimisation —
 * the server is still the source of truth.
 */

/** Bridge enforces 20–64 chars, base58 alphabet, leading FTM. */
const FAIR_ADDRESS_PATTERN = /^[FTM][a-km-zA-HJ-NP-Z1-9]{19,63}$/

/** ≤ 8 fractional digits (FAIR has 8 decimals). */
const FAIR_AMOUNT_PATTERN = /^\d+(\.\d{1,8})?$/

export function isValidFairAddress(value: string): boolean {
  return FAIR_ADDRESS_PATTERN.test(value)
}

export function isWellFormedFairAmount(value: string): boolean {
  return FAIR_AMOUNT_PATTERN.test(value)
}

export interface AmountBounds {
  min: number
  max: number
}

export type AmountValidation =
  | { ok: true; value: number }
  | { ok: false; reason: 'empty' | 'malformed' | 'below_min' | 'above_max' }

export function validateAmount(
  raw: string,
  bounds: AmountBounds,
): AmountValidation {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return { ok: false, reason: 'empty' }
  if (!isWellFormedFairAmount(trimmed)) return { ok: false, reason: 'malformed' }
  const numeric = Number(trimmed)
  if (!Number.isFinite(numeric)) return { ok: false, reason: 'malformed' }
  if (numeric < bounds.min) return { ok: false, reason: 'below_min' }
  if (numeric > bounds.max) return { ok: false, reason: 'above_max' }
  return { ok: true, value: numeric }
}
