import { Badge } from '@oxy.so/bloom/badge'
import { Button } from '@oxy.so/bloom/button'
import { Chip } from '@oxy.so/bloom/chip'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oxy.so/bloom/dropdown-menu'
import { RiArrowDownSLine } from '@oxy.so/bloom/icons/RiArrowDownSLine'
import { RiArrowUpDownLine } from '@oxy.so/bloom/icons/RiArrowUpDownLine'
import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine'
import { RiEqualizerLine } from '@oxy.so/bloom/icons/RiEqualizerLine'
import { useTheme } from '@oxy.so/bloom/theme'
import { useTranslation } from '../../lib/i18n'

/*
 * The article-list toolbar pieces shared by /newsroom (NewsroomIndex) and the
 * category-scoped grid on /company/news (ArticleGridSection). Labels come in
 * from the caller because both read them from the `newsroom` CMS page.
 */

export function NewsroomFilterMenu<T extends string>({
  label,
  clearAllLabel,
  categories,
  active,
  onToggle,
  onClear,
}: {
  label: string
  clearAllLabel: string
  categories: readonly T[]
  active: readonly T[]
  onToggle: (category: T) => void
  onClear: () => void
}) {
  const { colors } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild label={label} className="inline-flex">
        <Button
          size="sm"
          appearance="plain"
          tone="neutral"
          leadingIcon={RiEqualizerLine}
          trailing={active.length > 0
            ? <Badge content={active.length} color="primary" variant="subtle" />
            : undefined}
          trailingIcon={RiArrowDownSLine}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" label={label}>
        {categories.map((category) => (
          <DropdownMenuCheckboxItem
            key={category}
            checked={active.includes(category)}
            onCheckedChange={() => onToggle(category)}
            indicator={<RiCheckLine size="sm" fill={colors.textSecondary} />}
            indicatorPosition="trailing"
            keepOpen
          >
            {category}
          </DropdownMenuCheckboxItem>
        ))}
        {active.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onPress={onClear}>{clearAllLabel}</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NewsroomSortMenu<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  /** The trigger's visible text: a fixed "Sort", or the chosen option's label. */
  label: string
  options: Record<T, string>
  value: T
  onChange: (value: T) => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const accessibleLabel = t('newsroom.sortLabel', { option: options[value] })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild label={accessibleLabel} className="inline-flex">
        <Button
          size="sm"
          appearance="plain"
          tone="neutral"
          accessibilityLabel={accessibleLabel}
          leadingIcon={RiArrowUpDownLine}
          trailingIcon={RiArrowDownSLine}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" label={label}>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
          {(Object.keys(options) as T[]).map((option) => (
            <DropdownMenuRadioItem
              key={option}
              value={option}
              indicator={<RiCheckLine size="sm" fill={colors.textSecondary} />}
              indicatorPosition="trailing"
            >
              {options[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The chosen filters as removable chips, plus "Clear all". Renders nothing when none are chosen. */
export function NewsroomActiveFilters<T extends string>({
  active,
  clearAllLabel,
  onRemove,
  onClear,
  className = '',
}: {
  active: readonly T[]
  clearAllLabel: string
  onRemove: (category: T) => void
  onClear: () => void
  className?: string
}) {
  const { t } = useTranslation()
  if (active.length === 0) return null
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {active.map((category) => (
        <Chip
          key={category}
          size="large"
          onClose={() => onRemove(category)}
          closeLabel={t('newsroom.removeFilter', { category })}
        >
          {category}
        </Chip>
      ))}
      <Button size="sm" appearance="plain" tone="neutral" onPress={onClear}>
        {clearAllLabel}
      </Button>
    </div>
  )
}
