import { useCallback, useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'

const ROW =
  ':is([role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],[role="checkbox"],[role="radio"]):not([aria-disabled="true"])'

/** Focus the checked row (or the first) once the panel has measured itself and rendered its rows. */
function focusRow(panelClass: string) {
  let attempts = 0
  const tick = () => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>(`.${panelClass} ${ROW}`))
    if (rows.length > 0) {
      ;(rows.find((row) => row.getAttribute('aria-checked') === 'true') ?? rows[0]).focus()
      return
    }
    if (++attempts < 60) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

/**
 * The keyboard half of a menu button, around Bloom's web `DropdownMenu`.
 *
 * Bloom 4.5 opens the menu from the keyboard (its trigger is a real button)
 * but portals the rows to the end of <body> and never moves focus into them,
 * so Tab walks on through the page behind the open menu and a keyboard user
 * can open it and choose nothing. This supplies the rest of the ARIA menu
 * button pattern: opening from the keyboard (Enter/Space/arrows) focuses the
 * checked row or the first, arrows/Home/End move between rows, Enter/Space
 * activate, and Tab/Escape close back onto the trigger. When the menu closes
 * with focus stranded on <body> (the row that had it unmounted), focus
 * returns to the trigger. Selection still goes through Bloom: a key activates
 * a row with a click.
 *
 * Spread `wrapperProps` on an element around the `DropdownMenu` and pass
 * `panelClass` to its `DropdownMenuContent`'s `className`.
 */
export function useBloomMenuKeys() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelClass = `menu-keys-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const keyboardOpen = useRef(false)

  const trigger = useCallback(
    () => wrapperRef.current?.querySelector<HTMLElement>('[aria-haspopup]') ?? null,
    [],
  )

  // Keys inside the open menu. On the document because the rows are portalled
  // out of this subtree; capture phase so Tab is handled before the browser
  // moves focus, and Enter/Space before the row's own pressable sees them.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const panel = active?.closest(`.${panelClass}`)
      if (!panel || !active) return
      const rows = Array.from(panel.querySelectorAll<HTMLElement>(ROW))
      const index = rows.indexOf(active)
      const move = (next: number) => {
        event.preventDefault()
        rows[(next + rows.length) % rows.length]?.focus()
      }
      const close = () => {
        event.preventDefault()
        event.stopPropagation()
        trigger()?.click()
        trigger()?.focus({ preventScroll: true })
      }
      switch (event.key) {
        case 'ArrowDown':
          return move(index + 1)
        case 'ArrowUp':
          return move(index < 0 ? -1 : index - 1)
        case 'Home':
          return move(0)
        case 'End':
          return move(rows.length - 1)
        case 'Enter':
        case ' ':
          if (index < 0) return
          event.preventDefault()
          event.stopPropagation()
          active.click()
          return
        case 'Tab':
        case 'Escape':
          return close()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [panelClass, trigger])

  // Open and close are watched on the trigger's `aria-expanded` rather than
  // assumed from a key. Only a keyboard-initiated open moves focus into the
  // menu — a pointer user's focus stays where they clicked.
  useEffect(() => {
    const node = trigger()
    if (!node) return
    const observer = new MutationObserver(() => {
      if (node.getAttribute('aria-expanded') === 'true') {
        if (keyboardOpen.current) focusRow(panelClass)
        keyboardOpen.current = false
        return
      }
      // The panel animates out, so a row can hold focus for a few frames
      // before it unmounts and drops focus to <body>. Wait that out; stop as
      // soon as focus has gone somewhere real outside the menu.
      let frames = 0
      const settle = () => {
        const active = document.activeElement
        if (!active || active === document.body || !active.isConnected) {
          node.focus({ preventScroll: true })
          return
        }
        if (active.closest(`.${panelClass}`) && ++frames < 60) requestAnimationFrame(settle)
      }
      requestAnimationFrame(settle)
    })
    observer.observe(node, { attributes: true, attributeFilter: ['aria-expanded'] })
    return () => observer.disconnect()
  }, [panelClass, trigger])

  const onKeyDownCapture = (event: ReactKeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target !== trigger() || target.getAttribute('aria-expanded') === 'true') return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      keyboardOpen.current = true
      target.click()
    } else if (event.key === 'Enter' || event.key === ' ') {
      keyboardOpen.current = true
    }
  }

  return { panelClass, wrapperProps: { ref: wrapperRef, onKeyDownCapture } }
}
