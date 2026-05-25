import type { ReactNode } from 'react'

/* ──────────────────────────────────────────────
 * Card
 *
 * Single card primitive used in grids and feature lists. Variants
 * mirror modern marketing-site conventions (Apple, Meta, Google):
 *
 *   default   solid surface tint, default for content cards
 *   gradient  relative wrapper for absolutely-positioned gradient layer
 *             (caller is responsible for the gradient layer itself)
 *   outline   thin border, transparent background
 *   ghost     transparent until hover, then surface tint
 *
 * Pass `href` to render as an <a>; otherwise renders as <div>.
 * ──────────────────────────────────────────── */

type Variant = 'default' | 'gradient' | 'outline' | 'ghost'

const BASE = 'block rounded-3xl p-8 lg:p-10'

const VARIANT: Record<Variant, string> = {
  default: 'bg-surface',
  gradient: 'relative overflow-hidden',
  outline: 'border border-border bg-background',
  ghost: 'transition-colors hover:bg-surface',
}

const INTERACTIVE = 'transition-transform duration-200 hover:-translate-y-0.5'

interface CardProps {
  children: ReactNode
  variant?: Variant
  href?: string
  target?: string
  rel?: string
  className?: string
  id?: string
}

export default function Card({
  children,
  variant = 'default',
  href,
  target,
  rel,
  className = '',
  id,
}: CardProps) {
  const classes = [BASE, VARIANT[variant], href ? INTERACTIVE : '', className]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <a className={classes} href={href} target={target} rel={rel} id={id}>
        {children}
      </a>
    )
  }
  return (
    <div className={classes} id={id}>
      {children}
    </div>
  )
}
