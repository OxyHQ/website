/**
 * Application-wide constants and feature flags.
 *
 * Feature flags here are used to hide sections that currently rely on
 * placeholder / cloned content until real CMS-driven data is wired up.
 * Set a flag to `true` once the section has real, verified data.
 */

/**
 * Feature flags. Default to `false` for any surface that still relies on
 * placeholder/cloned content. Flip to `true` once real data is in place.
 */
export const FEATURES = {
  /** Render the "trusted by" pricing logo strip. */
  SHOW_PRICING_LOGOS: false,
  /**
   * Render the newsletter / changelog / careers email subscribe forms.
   * Off until a real subscription API endpoint is wired up; turning it on
   * with a stub form would silently drop user emails.
   */
  SHOW_NEWSLETTER_FORMS: false,
} as const

export type FeatureFlag = keyof typeof FEATURES
