import { useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'

/**
 * The keyboard half of the ARIA tab and radio-group patterns, around Bloom's
 * `Tabs` strip or `SegmentedControl`.
 *
 * Both render their options as react-native-web `Pressable`s with the right
 * role and state (`tab` + `aria-selected`, `radio` + `aria-checked`), but:
 * every option is its own tab stop, arrow keys do nothing, and Space does
 * nothing either — react-native-web only activates Space on button-like roles,
 * so a `radio` or `tab` answers Enter alone. Bloom's `Tabs` also renders no
 * `tablist` at all.
 *
 * This supplies the rest: a roving tab stop on the selected option (set on the
 * DOM after each render, since react-native-web exposes no `tabIndex`), arrow
 * keys moving and selecting, Home/End on a tab list, Space selecting, and — for
 * `item="tab"` — the named `tablist` itself. Selection still goes through Bloom:
 * a key activates the option with a click, which is the press Bloom's own
 * `onValueChange` already hears.
 */
export function BloomSelectionKeys({
  item,
  label,
  className,
  style,
  children,
}: {
  /** Which Bloom control this wraps: `tab` for `Tabs`, `radio` for a radio `SegmentedControl`. */
  item: 'tab' | 'radio'
  /** The tablist's accessible name (`item="tab"`; a SegmentedControl names its own group). */
  label?: string
  /** Layout only. A radio wrapper defaults to `display: contents`, leaving layout to the control. */
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const selectedAttr = item === 'tab' ? 'aria-selected' : 'aria-checked'

  useLayoutEffect(() => {
    const options = Array.from(ref.current?.querySelectorAll<HTMLElement>(`[role="${item}"]`) ?? [])
    // A group with nothing selected keeps its first option reachable.
    const anySelected = options.some((option) => option.getAttribute(selectedAttr) === 'true')
    options.forEach((option, index) => {
      option.tabIndex = option.getAttribute(selectedAttr) === 'true' || (!anySelected && index === 0) ? 0 : -1
    })
  })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const options = Array.from(
      ref.current?.querySelectorAll<HTMLElement>(
        `[role="${item}"]:not([aria-disabled="true"]):not(:disabled)`,
      ) ?? [],
    )
    const index = options.indexOf(event.target as HTMLElement)
    if (index < 0) return
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      options[index].click()
      return
    }
    const forward = event.key === 'ArrowRight' || (item === 'radio' && event.key === 'ArrowDown')
    const back = event.key === 'ArrowLeft' || (item === 'radio' && event.key === 'ArrowUp')
    const next = forward ? (index + 1) % options.length
      : back ? (index - 1 + options.length) % options.length
        : item === 'tab' && event.key === 'Home' ? 0
          : item === 'tab' && event.key === 'End' ? options.length - 1
            : null
    if (next === null) return
    event.preventDefault()
    options[next].focus()
    options[next].click()
  }

  return (
    <div
      ref={ref}
      role={item === 'tab' ? 'tablist' : undefined}
      aria-label={item === 'tab' ? label : undefined}
      className={className ?? (item === 'radio' ? 'contents' : undefined)}
      style={style}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  )
}
