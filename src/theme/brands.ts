/**
 * Every colour this site paints, as a seed.
 *
 * A surface is one colour. Bloom's engine derives the rest of the ramp from it —
 * surface, card, border, muted, the status and chart families — and
 * `scripts/generate-theme-css.ts` writes the result into
 * `src/styles/theme.generated.css`. Nothing else may hardcode a colour for these
 * surfaces: a hand-picked hex is a value the engine cannot keep in step with the
 * palette every other Oxy app shows the same user.
 *
 * The two site-wide palettes are named presets rather than seeds, so their
 * colour lives in Bloom and not in this repo. `src/theme/index.ts` (runtime) and
 * the generator (build time) both read them from here, so a page cannot boot
 * with one palette and hydrate into another.
 */

import { APP_COLOR_PRESETS, type AppColorName } from '@oxyhq/bloom/color-presets'

/** The palette on oxy.so, and the floor every other surface sits on. */
export const SITE_PRESET: AppColorName = 'oxy'

/** The palette on the FairCoin apex, where the Oxy purple never appears. */
export const FAIRCOIN_PRESET: AppColorName = 'faircoin'

/**
 * `<html data-brand>` values. `index.html` stamps one from the hostname before
 * first paint, so the apex paints its own brand instead of flashing Oxy's.
 */
export const HOST_BRANDS: Readonly<Record<string, AppColorName>> = {
  faircoin: FAIRCOIN_PRESET,
}

/** How a surface answers the site's light/dark toggle. */
export type BrandMode =
  /** Follows the toggle: a light block, plus a dark one under `.dark`. */
  | 'auto'
  /** Stays dark whatever the toggle says — a product page designed dark. */
  | 'dark'

export interface BrandSurface {
  /** The class the page's root element carries. */
  selector: string
  /** The brand colour, `#rrggbb`. */
  seed: string
  mode: BrandMode
  /** What the surface is, for whoever reads the generated file. */
  label: string
}

/**
 * Order matters, and `.cursor-theme` must stay first.
 *
 * The product pages compose two classes on one element (`cursor-theme
 * oxyos-theme`): the first carries that surface's type scale and rhythm, the
 * second its palette. Both blocks then declare the same custom properties at the
 * same specificity, so the LATER one in the stylesheet wins — which is what
 * makes the sibling's palette take, and what leaves Codea's in place on the page
 * that uses `.cursor-theme` alone.
 */
export const BRAND_SURFACES: readonly BrandSurface[] = [
  { selector: '.cursor-theme', seed: '#7c5aed', mode: 'dark', label: 'Codea' },
  { selector: '.oxyos-theme', seed: '#8b6fc0', mode: 'dark', label: 'OxyOS' },
  { selector: '.tnp-theme', seed: '#10b981', mode: 'dark', label: 'TNP' },
  { selector: '.astro-theme', seed: '#1d9bf0', mode: 'auto', label: 'Astro' },
  {
    selector: '.faircoin-theme',
    seed: APP_COLOR_PRESETS[FAIRCOIN_PRESET].hex,
    mode: 'auto',
    label: 'FairCoin sections on oxy.so',
  },
  {
    // The device frame in `PhoneMockup.tsx` reproduces the FAIRWallet home
    // screen, and the real app is always dark — so it stays dark whatever the
    // site's toggle says, rather than following the page around it.
    selector: '.phone-mockup-dark',
    seed: APP_COLOR_PRESETS[FAIRCOIN_PRESET].hex,
    mode: 'dark',
    label: 'FAIRWallet phone mockup',
  },
]
