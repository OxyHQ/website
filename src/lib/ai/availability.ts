/**
 * The one availability vocabulary for Oxy AI.
 *
 * Every service card, model row, navigation entry and CTA on the site reads
 * this module. The reason it is one module rather than a string per page is the
 * rule it enforces: **availability is supplied by the content or catalogue
 * source, never inferred from a frontend route existing**. A page that invents
 * its own label can show `Start building` next to something nobody can buy;
 * `ctaIntentFor` makes that a type error rather than a copy review.
 *
 * See `docs/AI-CONTENT-ARCHITECTURE.md` §3.
 */

export const AVAILABILITY_STATES = [
  'available',
  'beta',
  'private_preview',
  'coming_soon',
  'internal_only',
  'deprecated',
] as const

export type Availability = (typeof AVAILABILITY_STATES)[number]

/**
 * What a visitor is allowed to be asked to do next, given a state.
 *
 * `none` is the honest answer for `internal_only`: such an object must not
 * reach a public page at all, and a component that somehow receives one renders
 * no call to action rather than a plausible-looking one.
 */
export type CtaIntent =
  | 'start_building'
  | 'try_beta'
  | 'request_access'
  | 'join_waitlist'
  | 'see_replacement'
  | 'none'

const CTA_BY_STATE: Record<Availability, CtaIntent> = {
  available: 'start_building',
  beta: 'try_beta',
  private_preview: 'request_access',
  coming_soon: 'join_waitlist',
  internal_only: 'none',
  deprecated: 'see_replacement',
}

export function ctaIntentFor(availability: Availability): CtaIntent {
  return CTA_BY_STATE[availability]
}

/**
 * Whether an object in this state may appear on a public page, in the sitemap,
 * in Pagefind or in structured data at all.
 *
 * `deprecated` stays public on purpose — a model someone is still calling needs
 * its sunset date and its replacement to remain readable.
 */
export function isPubliclyListable(availability: Availability): boolean {
  return availability !== 'internal_only'
}

/** Whether the state permits a real purchase/checkout call to action. */
export function isPurchasable(availability: Availability): boolean {
  return availability === 'available' || availability === 'beta'
}

/**
 * Colour role for the state's badge, expressed as Bloom token roles rather than
 * raw colour. Never the only carrier of the state — the badge always renders
 * its text label too, so the information is not conveyed by colour alone.
 */
export type AvailabilityTone = 'positive' | 'info' | 'notice' | 'neutral' | 'muted'

const TONE_BY_STATE: Record<Availability, AvailabilityTone> = {
  available: 'positive',
  beta: 'info',
  private_preview: 'notice',
  coming_soon: 'neutral',
  internal_only: 'muted',
  deprecated: 'muted',
}

export function availabilityTone(availability: Availability): AvailabilityTone {
  return TONE_BY_STATE[availability]
}
