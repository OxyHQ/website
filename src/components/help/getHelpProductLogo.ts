import { getBrandMark } from '../../data/brand-assets'
import type { HelpCategoryId } from '../../content/help-loader'

/* ──────────────────────────────────────────────
 * Map a help category to the Oxy ecosystem product logo it represents.
 * Mirrors `src/components/docs/getPackageLogo.ts` so the help center
 * and the dev docs surface the same brand assets.
 *
 * Returning `undefined` triggers a letter-fallback avatar in
 * `HelpProductBadge`. Keep this in sync with the SVG/PNG files
 * committed under `public/images/apps/<key>.{svg,png}`.
 * ──────────────────────────────────────────── */

const HELP_CATEGORY_LOGO: Record<HelpCategoryId, string | undefined> = {
  account: getBrandMark('accounts'),
  inbox: getBrandMark('inbox'),
  auth: getBrandMark('auth'),
  console: undefined,
  'getting-started': undefined,
}

export function getHelpProductLogo(category: HelpCategoryId): string | undefined {
  return HELP_CATEGORY_LOGO[category]
}
