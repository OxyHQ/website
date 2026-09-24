import { cloneElement, type CSSProperties, type ReactElement } from 'react'
import { Button } from '@oxy.so/bloom/button'

/**
 * What the bar is sitting on. `page` is the ordinary translucent header; the
 * other two are the transparent header over a hero, dark or light.
 */
export type NavBarInk = 'page' | 'onDark' | 'onLight'

/**
 * How loud a control is at rest. `muted` is a trigger or an icon button: muted
 * ink on the page, full ink over a hero. `soft` is a flat link, which over a
 * hero stays a step quieter than the triggers beside it.
 */
export type NavBarRest = 'muted' | 'soft'

const wash = (percent: number) => `color-mix(in srgb, var(--color-foreground) ${percent}%, transparent)`

function restInk(ink: NavBarInk, rest: NavBarRest): string {
  if (ink === 'page') return 'var(--color-muted-foreground)'
  if (rest === 'muted') return 'var(--color-foreground)'
  return wash(ink === 'onDark' ? 80 : 70)
}

/**
 * The bar's controls — dropdown triggers, flat links, the search / settings /
 * sign-in / menu icon buttons — drawn by Bloom's `Button` (`plain`, `neutral`).
 *
 * Bloom brings the semantics, the focus ring, the press/disabled contract and
 * the reduced-motion rule. What it cannot know is the bar's own geometry (a
 * 40px row on the site's `link-md` type, between Bloom's 36 and 44 rungs) and
 * that the same control sits on three different grounds: the translucent
 * header, a dark hero and a light one. Both arrive the way `Button` takes them
 * — its `--bloom-btn-*` properties — so its own stylesheet still paints every
 * state, and every value is a Bloom token.
 *
 * `asChild` because a trigger needs what `Button` does not forward: a ref (focus
 * is moved back to it), pointer-intent handlers, `onKeyDown` and
 * `aria-controls`. The child is the real `<button>` or `<a>`.
 */
export function NavBarButton({
  ink,
  rest = 'muted',
  open = false,
  square = false,
  size = 40,
  children,
}: {
  ink: NavBarInk
  rest?: NavBarRest
  /** The control's panel is showing: it keeps the hover wash and full ink. */
  open?: boolean
  /** An icon button: a `size`-square circle. */
  square?: boolean
  /** Height (and width, when `square`), in px. */
  size?: number
  children: ReactElement<{ style?: CSSProperties; className?: string }>
}) {
  const hover = wash(ink === 'onDark' ? 10 : 5)
  const fg = open ? 'var(--color-foreground)' : restInk(ink, rest)
  const vars: Record<`--${string}`, string | number> = {
    '--bloom-btn-gap': '6px',
    '--bloom-btn-fg': fg,
    '--bloom-btn-fg-hover': 'var(--color-foreground)',
    '--bloom-btn-fg-active': 'var(--color-foreground)',
    '--bloom-btn-bg': open ? wash(5) : 'transparent',
    '--bloom-btn-bg-hover': open ? wash(5) : hover,
    '--bloom-btn-bg-active': open ? wash(5) : hover,
    // Sign-in is disabled only until the session resolves, a beat after load:
    // greying it out for that beat would flash on every page.
    '--bloom-btn-fg-disabled': fg,
    '--bloom-btn-bg-disabled': 'transparent',
    '--bloom-btn-disabled-opacity': 1,
  }
  const style: CSSProperties = {
    ...vars,
    height: size,
    ...(square ? { width: size, paddingLeft: 0, paddingRight: 0 } : { paddingLeft: 12, paddingRight: 12 }),
    // The label keeps the site's `text-link-md` from its class: Bloom's inline
    // type ramp would otherwise outrank it.
    fontSize: undefined,
    lineHeight: undefined,
    fontWeight: undefined,
    letterSpacing: undefined,
    ...children.props.style,
  }
  return (
    <Button
      asChild
      appearance="plain"
      tone="neutral"
      // Over a dark hero the control takes the `.force-dark` palette, so
      // `foreground` is light ink whatever the theme toggle says.
      className={ink === 'onDark' ? 'force-dark' : undefined}
    >
      {cloneElement(children, { style })}
    </Button>
  )
}
