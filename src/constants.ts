/**
 * Application-wide constants and feature flags.
 *
 * Feature flags here are used to hide sections that currently rely on
 * placeholder / cloned content until real CMS-driven data is wired up.
 * Set a flag to `true` once the section has real, verified data.
 */

export const ADMIN_USERNAMES = ['oxy', 'nate']

/**
 * Canonical company identity. Use these everywhere instead of hardcoding
 * names, taglines, or descriptions in copy. Oxy is an open-source ethical
 * tech ecosystem building AI agents and apps — NOT a CRM (though Oxy CRM
 * is one of the products in the ecosystem).
 */
export const OXY_FOUNDER = 'Nate Isern'
export const OXY_HQ = 'Barcelona, ES'
export const OXY_GITHUB_ORG = 'OxyHQ'
export const OXY_GITHUB_URL = `https://github.com/${OXY_GITHUB_ORG}`

export const OXY_PRODUCTS = [
  'Mention',
  'Allo',
  'Inbox',
  'Codea Studio',
  'Codea AI',
  'Codea VS Code Extension',
  'Oxy AI (Alia)',
  'Oxy CRM',
  'OxyOS',
  'Bloom UI',
  'TNP',
  'FairCoin',
  'Homiio',
] as const

export const OXY_POSITIONING = {
  tagline: 'An independent, open-source ecosystem of ethical technology.',
  short:
    'Oxy is an independent, open-source ecosystem of ethical technology built to empower people, not exploit them.',
  long:
    'Oxy is an independent, open-source ecosystem of ethical technology built to empower people, not exploit them. Apps, AI, an operating system, a browser, identity and more. Mention, Allo, Inbox, Codea, Oxy AI, OxyOS, Astro, TNP, FairCoin and Homiio.',
} as const

/**
 * Feature flags. Default to `false` for any surface that still relies on
 * placeholder/cloned content. Flip to `true` once real data is in place.
 */
export const FEATURES = {
  /** Render the homepage "trusted by" / partner logo walls. */
  SHOW_TRUSTED_LOGOS: false,
  /** Render testimonial sections (cloned/fake people right now). */
  SHOW_TESTIMONIALS: false,
  /** Render the homepage STATS strip with hardcoded numbers. */
  SHOW_HOMEPAGE_STATS: false,
  /** Render the world map / dashboard country-data section. */
  SHOW_DASHBOARD_COUNTRY_METRICS: false,
  /** Render App Store / Play Store / download badges for products that don't ship yet. */
  SHOW_PLACEHOLDER_DOWNLOADS: false,
  /** Render the Astro browser download CTAs (no real downloads yet). */
  SHOW_ASTRO_DOWNLOADS: false,
  /** Render the Codea download CTAs (no real download yet). */
  SHOW_CODEA_DOWNLOADS: false,
  /** Render the Initiative manifesto image carousel (uses Unsplash URLs). */
  SHOW_INITIATIVE_MANIFESTO_IMAGES: false,
  /** Render the static FairCoin price chip in the hero. */
  SHOW_FAIRCOIN_HERO_PRICE_CHIP: false,
  /** Static fallback hero-carousel content (when CMS has no data). */
  SHOW_HERO_CAROUSEL_FALLBACK: false,
  /** Render the "trusted by" pricing logo strip. */
  SHOW_PRICING_LOGOS: false,
  /**
   * Render the newsletter / changelog / careers email subscribe forms.
   * Off until a real subscription API endpoint is wired up; turning it on
   * with a stub form would silently drop user emails.
   */
  SHOW_NEWSLETTER_FORMS: false,
  /**
   * Render the inline "Was this article helpful?" feedback widgets on
   * docs and help pages. Off until the feedback endpoint exists.
   */
  SHOW_ARTICLE_FEEDBACK: false,
  /**
   * Render the in-page job application form on `/company/careers/:slug`.
   * Off until the careers submission endpoint is wired up; until then the
   * page shows a short "Apply via email" block instead.
   */
  SHOW_CAREERS_APPLICATION_FORM: false,
} as const

export type FeatureFlag = keyof typeof FEATURES
