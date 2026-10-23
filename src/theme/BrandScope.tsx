import { useSyncExternalStore, type ReactNode } from 'react';
import { BloomColorScope, BloomSeedScope, useTheme } from '@oxy.so/bloom/theme';
import { BRAND_SURFACES, type BrandSurface } from './brands';

/**
 * The brand surface a page root's classes select, if any.
 *
 * `scripts/generate-theme-css.ts` writes the surfaces' blocks in
 * `BRAND_SURFACES` order, so where a root carries two (`cursor-theme
 * astro-theme`) the later block is the one the cascade paints — and the one
 * returned here.
 */
function brandSurfaceFor(className: string): BrandSurface | undefined {
  const classes = new Set(className.split(/\s+/));
  return BRAND_SURFACES.findLast((surface) => classes.has(surface.selector.slice(1)));
}

const subscribeNever = () => () => {
  // Nothing was subscribed, so nothing to remove.
};

/**
 * Carries a brand surface's palette to the Bloom components inside it.
 *
 * The generated CSS already paints a `.docs-theme` or `.astro-theme` subtree,
 * but Bloom's components colour themselves from the JS theme on context, not
 * from CSS variables — so without this a Bloom dialog or code block on the
 * Astro page is Oxy purple. Named recipes use `BloomColorScope`; custom seeds
 * use `BloomSeedScope` (context reaches portalled dialogs and menus too).
 *
 * Client-only, on purpose: the scope also writes the palette inline for the
 * CURRENT mode, and the prerendered HTML cannot know the visitor's mode — an
 * inline light palette would outrank the `.dark` block until the app booted.
 * The app mounts with `createRoot`, so there is no hydration to mismatch.
 * Named recipes support an explicit local mode, including fixed dark surfaces.
 * `BloomSeedScope` builds its theme in the PARENT's mode, so a seed surface is
 * scoped only where that mode is the surface's own: an `auto` surface always,
 * and a `light` one while the site is light. In dark mode a light surface is
 * left unscoped rather than handed a dark JS theme (and a dark inline palette
 * that would outrank its generated light block). `dark` surfaces keep their
 * old rule and are never scoped through the seed path.
 */
export function BrandScope({ className, children }: { className: string; children: ReactNode }) {
  const onClient = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const { isDark } = useTheme();
  const surface = brandSurfaceFor(className);
  if (onClient && surface?.preset) {
    return (
      <BloomColorScope
        colorPreset={surface.preset}
        mode={surface.mode === 'auto' ? undefined : surface.mode}
        style={{ display: 'contents' }}
      >
        {children}
      </BloomColorScope>
    );
  }
  const scoped = surface?.mode === 'auto' || (surface?.mode === 'light' && !isDark);
  if (!onClient || !surface || surface.preset || !scoped) return children;
  return (
    <BloomSeedScope
      seed={surface.seed}
      secondarySeed={surface.secondarySeed}
      tertiarySeed={surface.tertiarySeed}
      style={{ display: 'contents' }}
    >
      {children}
    </BloomSeedScope>
  );
}
