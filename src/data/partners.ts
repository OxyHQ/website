/**
 * Partner brand logos shown on the homepage and `/partners` page.
 *
 * Each entry corresponds to an SVG file at
 *   `public/images/landing/<slug>.svg`
 *
 * Logos are rendered with `dark:invert` so a single colorway works in both
 * light and dark themes. When you add a new logo, drop the SVG into the
 * landing folder and append the slug here.
 */
export const partnerLogos: readonly string[] = [
  'strava',
  'piab',
  'robinhood',
  'asics',
  'polestar',
  'voi',
  'brex',
  'apollo.io',
  'b-lab-europe',
  'veoneer',
  'merck',
  'ahlsell',
  'electrolux',
  'swile',
  'truecaller',
  'kearney',
  'foodora',
  'hinge',
]

/**
 * Map from logo slug to a human-friendly display name used as the `alt`
 * attribute and screen-reader label. Falls back to a Title-Cased version of
 * the slug for any logo not listed here.
 */
const PARTNER_DISPLAY_NAMES: Record<string, string> = {
  strava: 'Strava',
  piab: 'Piab',
  robinhood: 'Robinhood',
  asics: 'ASICS',
  polestar: 'Polestar',
  voi: 'Voi',
  brex: 'Brex',
  'apollo.io': 'Apollo.io',
  'b-lab-europe': 'B Lab Europe',
  veoneer: 'Veoneer',
  merck: 'Merck',
  ahlsell: 'Ahlsell',
  electrolux: 'Electrolux',
  swile: 'Swile',
  truecaller: 'Truecaller',
  kearney: 'Kearney',
  foodora: 'Foodora',
  hinge: 'Hinge',
}

export function getPartnerDisplayName(slug: string): string {
  const explicit = PARTNER_DISPLAY_NAMES[slug]
  if (explicit) return explicit
  return slug
    .split(/[-_\s]/)
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ')
}
