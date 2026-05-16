/**
 * Partner brand logos shown on the homepage and `/partners` page.
 *
 * NOTE: The list below previously contained real third-party companies
 * (Strava, Robinhood, Merck, Polestar, etc.) cloned from another marketing
 * site. None of those are actual Oxy partners, so the list is now empty.
 * Surfaces that render this list are also flag-gated behind
 * `FEATURES.SHOW_TRUSTED_LOGOS` until verified Oxy partner logos exist.
 *
 * To add a real partner: drop an SVG into `public/images/landing/<slug>.svg`,
 * add its slug to `partnerLogos`, and add a display name to
 * `PARTNER_DISPLAY_NAMES` below.
 */
export const partnerLogos: readonly string[] = []

const PARTNER_DISPLAY_NAMES: Record<string, string> = {}

export function getPartnerDisplayName(slug: string): string {
  const explicit = PARTNER_DISPLAY_NAMES[slug]
  if (explicit) return explicit
  return slug
    .split(/[-_\s]/)
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ')
}
