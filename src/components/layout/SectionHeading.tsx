import type { ReactNode } from 'react'

/* ──────────────────────────────────────────────
 * SectionHeading
 *
 * Opinionated heading block: optional eyebrow + title + optional
 * description. Apple/Meta/Google-style. Used inside a PageSection.
 *
 *   <SectionHeading
 *     eyebrow="The numbers"
 *     title="Live funding status"
 *     description="Updated every minute."
 *     align="center"
 *   />
 *
 * The default heading element is <h2>. For hero blocks (h1), render
 * markup inline instead — this primitive is for section heads, not hero.
 * ──────────────────────────────────────────── */

type Align = 'left' | 'center'
type Size = 'md' | 'lg'

const SIZE: Record<Size, string> = {
  md: 'text-2xl tracking-tight md:text-3xl lg:text-4xl',
  lg: 'text-3xl tracking-tight md:text-4xl lg:text-5xl',
}

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: Align
  size?: Size
  className?: string
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  size = 'lg',
  className = '',
}: SectionHeadingProps) {
  const alignClasses =
    align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left'
  const classes = ['flex max-w-3xl flex-col gap-4', alignClasses, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className={`text-balance font-medium text-foreground ${SIZE[size]}`}>
        {title}
      </h2>
      {description ? (
        <p className="text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          {description}
        </p>
      ) : null}
    </div>
  )
}
