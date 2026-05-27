import type { HelpCategoryId } from '../../content/help-loader'
import { getHelpProductLogo } from './getHelpProductLogo'

/* ──────────────────────────────────────────────
 * HelpProductBadge
 *
 * Small "logo + label" lockup used in the help listing's category
 * headers, in article eyebrows, and on per-article cards so readers
 * immediately know which Oxy product an article belongs to.
 *
 * Mirrors the docs-sidebar `PackageLogo` letter-fallback when no
 * logo exists yet for a given product.
 * ──────────────────────────────────────────── */

type BadgeSize = 'sm' | 'md' | 'lg'

interface HelpProductBadgeProps {
  category: HelpCategoryId
  label: string
  size?: BadgeSize
  /** Render only the logo (no text). */
  iconOnly?: boolean
  className?: string
}

const LOGO_SIZE: Record<BadgeSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

const FALLBACK_SIZE: Record<BadgeSize, string> = {
  sm: 'size-4 text-[9px]',
  md: 'size-5 text-[10px]',
  lg: 'size-6 text-[11px]',
}

const LABEL_SIZE: Record<BadgeSize, string> = {
  sm: 'text-xs',
  md: 'text-[13px]',
  lg: 'text-sm',
}

export default function HelpProductBadge({
  category,
  label,
  size = 'md',
  iconOnly = false,
  className,
}: HelpProductBadgeProps) {
  const src = getHelpProductLogo(category)
  const logoClass = LOGO_SIZE[size]
  const labelClass = LABEL_SIZE[size]
  const fallbackClass = FALLBACK_SIZE[size]
  const letter = label.charAt(0).toUpperCase() || '?'

  const logo = src ? (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`${logoClass} shrink-0 rounded-md object-contain`}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span
      aria-hidden="true"
      className={`${fallbackClass} shrink-0 inline-flex items-center justify-center rounded-md bg-primary/15 text-primary font-medium leading-none`}
    >
      {letter}
    </span>
  )

  if (iconOnly) {
    return (
      <span className={`inline-flex items-center ${className ?? ''}`} aria-label={label}>
        {logo}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      {logo}
      <span className={`font-medium text-foreground ${labelClass}`}>{label}</span>
    </span>
  )
}
