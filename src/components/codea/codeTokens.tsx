import { useMemo, type ReactNode } from 'react'
import { tokenColor, tokenizeCode, useCodePalette, type CodePalette } from '@oxy.so/bloom/code'

/**
 * The code palette for the surface the mock-up actually sits on.
 *
 * `useCodePalette()` resolves against Bloom's JS theme, which is the site's
 * toggle mode — but `/codea` is a `.cursor-theme` page, a surface that stays
 * dark whatever the toggle says, and `BrandScope` cannot publish a dark JS
 * theme into it (`BloomSeedScope` always follows its parent's mode). Left
 * alone, the light palette's text tones would land on the dark panel.
 *
 * Bloom's palette draws plain text, strings, comments and punctuation in the
 * theme's `textSecondary` / `textTertiary`, and both of those ARE the
 * `muted-foreground` token (`theme/build-theme.ts`). So those roles read the
 * token through CSS, where the surface's own scope resolves it; wherever the JS
 * theme and the surface agree (every `auto` page) this is the same colour. The
 * hue roles — keyword, class name, constant — are ramp stops that read on
 * either mode and stay exactly as Bloom resolves them.
 */
function useSurfaceCodePalette(): CodePalette {
  const palette = useCodePalette()
  return useMemo(
    () => ({
      ...palette,
      plain: 'var(--muted-foreground)',
      string: 'var(--muted-foreground)',
      punctuation: 'var(--muted-foreground)',
    }),
    [palette],
  )
}

/**
 * A mock-up's source, one highlighted row per line, in the colours Bloom's
 * `CodeBlock` paints — so an editor or diff mock-up and a real code card on
 * the same page cannot disagree about what a keyword looks like.
 *
 * The mock-ups lay the lines out themselves (line numbers, suggestion and diff
 * rows, gutters) because that chrome is the point of them and `CodeLines` has
 * none of it; only the tokenizing and the colouring are Bloom's.
 */
export function useHighlightedLines(source: string): ReactNode[] {
  const palette = useSurfaceCodePalette()
  return useMemo(
    () =>
      tokenizeCode(source, 'tsx').map((line) =>
        line.map((token, i) => (
          <span key={i} style={{ color: tokenColor(token.kind, palette) }}>
            {token.text}
          </span>
        )),
      ),
    [source, palette],
  )
}
