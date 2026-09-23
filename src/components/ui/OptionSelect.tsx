import { useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
  type SelectSize,
} from '@oxy.so/bloom/select'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface OptionSelectProps {
  /** The trigger's accessible name — the chosen value is not one. */
  label: string
  value: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  /** Shown while `value` matches no option. */
  placeholder?: string
  size?: SelectSize
  disabled?: boolean
  /** Layout classes for the wrapper around the trigger; Bloom paints the field itself. */
  className?: string
  /** A fixed width for the dropdown list instead of Bloom's trigger-width floor. */
  listWidth?: number
  /**
   * The '' option means "nothing chosen" ("Select", "—") rather than a real
   * choice like "All apps": the trigger shows it in the placeholder colour.
   * It stays choosable, so an optional field can be cleared again.
   */
  emptyIsPlaceholder?: boolean
}

/**
 * Bloom stands for "nothing chosen" with a falsy value — its trigger paints an
 * empty string in the placeholder colour. An option whose value is '' ("All
 * apps", "Any provider") is usually a real choice, so it travels through Bloom
 * under this key instead and comes back out as ''.
 */
const EMPTY = '\u0000empty'

const toBloom = (value: string) => (value === '' ? EMPTY : value)
const fromBloom = (value: string) => (value === EMPTY ? '' : value)

const OPTION = '[role="radio"]:not([aria-disabled="true"])'

/** Focus the chosen option once the panel has measured itself and rendered (a few frames). */
function focusOption(panelClass: string) {
  let attempts = 0
  const tick = () => {
    const list = Array.from(document.querySelectorAll<HTMLElement>(`.${panelClass} ${OPTION}`))
    if (list.length > 0) {
      ;(list.find((option) => option.getAttribute('aria-checked') === 'true') ?? list[0]).focus()
      return
    }
    if (++attempts < 30) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

/**
 * Bloom's `Select` for the common case: a flat list of `{ value, label }`
 * options and a string value.
 *
 * It also carries the keyboard a native `<select>` had. Bloom's web dropdown
 * (4.5) opens on Enter/Space but never moves focus into its list and handles
 * no arrow keys, so a keyboard user could open it and choose nothing — Tab
 * walked on through the page while the list sat open. Here opening from the
 * keyboard focuses the chosen option, arrows/Home/End move between options,
 * Enter/Space choose, and Tab/Escape close back onto the trigger.
 */
export default function OptionSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  size,
  disabled,
  className,
  listWidth,
  emptyIsPlaceholder = false,
}: OptionSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelClass = `option-select-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // An empty value with no empty option is "nothing chosen", which Bloom
  // spells `undefined` — that is what brings its placeholder back.
  const hasEmptyOption = options.some((option) => option.value === '')
  const wrapEmpty = hasEmptyOption && !emptyIsPlaceholder
  const resolved = value === '' && !hasEmptyOption ? undefined : wrapEmpty ? toBloom(value) : value
  const items = wrapEmpty
    ? options.map((option) => ({ ...option, value: toBloom(option.value) }))
    : options

  const trigger = () => wrapperRef.current?.querySelector<HTMLElement>('[aria-haspopup]') ?? null

  // Keys inside the open list. On the document because the list is portalled
  // out of this component's DOM subtree; capture phase so Tab is handled before
  // the browser moves focus.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const panel = active?.closest(`.${panelClass}`)
      if (!panel || !active) return
      const list = Array.from(panel.querySelectorAll<HTMLElement>(OPTION))
      const index = list.indexOf(active)
      const move = (next: number) => {
        event.preventDefault()
        list[Math.max(0, Math.min(list.length - 1, next))]?.focus()
      }
      switch (event.key) {
        case 'ArrowDown':
          return move(index + 1)
        case 'ArrowUp':
          return move(index - 1)
        case 'Home':
          return move(0)
        case 'End':
          return move(list.length - 1)
        case 'Enter':
        case ' ':
          if (index < 0) return
          // Stopped here so the option's own pressable does not press it twice.
          event.preventDefault()
          event.stopPropagation()
          active.click()
          return
        case 'Tab':
          // A native select closes on Tab and focus carries on from it.
          event.preventDefault()
          trigger()?.click()
          trigger()?.focus({ preventScroll: true })
          return
        case 'Escape':
          // Closes the list and nothing else. Bloom's own Escape listener sits
          // beside a Dialog's, so inside one it closed the dialog too — a
          // native select swallows this key. Focus returns to the trigger
          // instead of falling to <body>.
          event.preventDefault()
          event.stopPropagation()
          trigger()?.click()
          trigger()?.focus({ preventScroll: true })
          return
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [panelClass])

  // Keys on the closed trigger. Enter/Space already open it (Bloom's
  // pressable); the arrows are added here. The open itself is watched on
  // `aria-expanded` rather than assumed from the key, and only a
  // keyboard-initiated one moves focus into the list — a pointer user's focus
  // stays where they clicked.
  const keyboardOpen = useRef(false)
  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
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
  useEffect(() => {
    const node = wrapperRef.current?.querySelector<HTMLElement>('[aria-haspopup]')
    if (!node) return
    const observer = new MutationObserver(() => {
      if (node.getAttribute('aria-expanded') !== 'true') return
      if (keyboardOpen.current) focusOption(panelClass)
      keyboardOpen.current = false
    })
    observer.observe(node, { attributes: true, attributeFilter: ['aria-expanded'] })
    return () => observer.disconnect()
  }, [panelClass])

  return (
    <div ref={wrapperRef} className={className} onKeyDownCapture={onTriggerKeyDown}>
      <Select
        value={resolved}
        onValueChange={(next) => {
          onValueChange(fromBloom(next))
          // Like a native select, focus stays on the control once a choice is
          // made instead of falling to <body> with the closed list.
          requestAnimationFrame(() => trigger()?.focus({ preventScroll: true }))
        }}
        size={size}
        disabled={disabled}
      >
        <SelectTrigger label={label}>
          <SelectValue placeholder={placeholder} />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent
          label={label}
          items={items}
          width={listWidth}
          className={panelClass}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label} disabled={item.disabled}>
              <SelectItemText>{item.label}</SelectItemText>
              <SelectItemIndicator />
            </SelectItem>
          )}
        />
      </Select>
    </div>
  )
}
