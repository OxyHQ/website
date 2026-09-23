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

/**
 * Bloom's `Select` for the common case: a flat list of `{ value, label }`
 * options and a string value, where '' is either a real choice ("All apps")
 * or — with `emptyIsPlaceholder` — "nothing chosen". The keyboard (focus into
 * the list, arrows, Escape, focus back on the trigger) is Bloom's own.
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
  // An empty value with no empty option is "nothing chosen", which Bloom
  // spells `undefined` — that is what brings its placeholder back.
  const hasEmptyOption = options.some((option) => option.value === '')
  const wrapEmpty = hasEmptyOption && !emptyIsPlaceholder
  const resolved = value === '' && !hasEmptyOption ? undefined : wrapEmpty ? toBloom(value) : value
  const items = wrapEmpty
    ? options.map((option) => ({ ...option, value: toBloom(option.value) }))
    : options

  return (
    <div className={className}>
      <Select
        value={resolved}
        onValueChange={(next) => onValueChange(fromBloom(next))}
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
