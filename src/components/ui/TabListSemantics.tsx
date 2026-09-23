import { useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'

/**
 * The ARIA tab pattern around Bloom's `Tabs` strip.
 *
 * Bloom's strip is the triggers and the indicator only: each trigger is a
 * `role="tab"` with `aria-selected`, but nothing is a `tablist`, every trigger
 * sits in the tab order, and arrow keys do nothing. This supplies the rest —
 * the `tablist` role and name, a roving tab stop on the selected trigger,
 * and ArrowLeft/ArrowRight/Home/End moving and selecting.
 *
 * Bloom renders through react-native-web, which exposes no `tabIndex` on a
 * trigger, so the roving tab stop is set on the DOM after each render.
 * Selection itself still goes through Bloom: a key press activates the trigger
 * with a click, which is the press Bloom's `onValueChange` already hears.
 */
export function TabListSemantics({
  label,
  className,
  style,
  children,
}: {
  /** The tablist's accessible name. */
  label: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const tabs = ref.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []
    tabs.forEach((tab) => {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1
    })
  })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      ref.current?.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"]):not(:disabled)') ?? [],
    )
    const index = tabs.indexOf(event.target as HTMLElement)
    if (index < 0) return
    const next =
      event.key === 'ArrowRight' ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
          : event.key === 'Home' ? 0
            : event.key === 'End' ? tabs.length - 1
              : null
    if (next === null) return
    event.preventDefault()
    tabs[next].focus()
    tabs[next].click()
  }

  return (
    <div ref={ref} role="tablist" aria-label={label} className={className} style={style} onKeyDown={onKeyDown}>
      {children}
    </div>
  )
}
