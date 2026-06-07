import type { ReactNode } from 'react'

/* ──────────────────────────────────────────────
 * PageSection
 *
 * The canonical marketing-page section primitive. Replaces the legacy
 * `section.container > div. > grid grid-cols-12 > col-[2/-2]`
 * pattern. Vertical rhythm, content width, and optional background tone
 * all funnel through here so the whole site stays consistent.
 *
 *   <PageSection spacing="lg" tone="surface" width="narrow">
 *     <SectionHeading title="…" description="…" />
 *   </PageSection>
 *
 * The outer <section> spans the viewport width so `tone` backgrounds go
 * edge-to-edge. The inner wrapper holds max-width and horizontal padding.
 * ──────────────────────────────────────────── */

type Spacing = 'none' | 'sm' | 'md' | 'lg' | 'xl'
type Tone = 'default' | 'surface' | 'muted' | 'inverse'
type Width = 'narrow' | 'prose' | 'wide' | 'full'

const SPACING: Record<Spacing, string> = {
  none: '',
  sm: 'py-12 md:py-16',
  md: 'py-20 md:py-24 lg:py-28',
  lg: 'py-24 md:py-32 lg:py-40',
  xl: 'py-32 md:py-40 lg:py-48',
}

const TONE: Record<Tone, string> = {
  default: '',
  surface: 'bg-surface',
  muted: 'bg-muted/40',
  inverse: 'bg-foreground text-background',
}

/*
 * `wide` is the default: it delegates width + horizontal padding to the
 * site-global `.container` class (Attio-style responsive breakpoints, caps
 * at 1760px on >=1920px viewports). The narrower `prose` and `narrow`
 * variants keep their explicit max-widths so callers can still constrain
 * legibility-critical content (article bodies, sub-headings) below the
 * container width.
 */
const WIDTH: Record<Width, string> = {
  prose: 'mx-auto px-6 lg:px-8 max-w-2xl',
  narrow: 'mx-auto px-6 lg:px-8 max-w-3xl',
  wide: 'container',
  full: '',
}

interface PageSectionProps {
  children: ReactNode
  spacing?: Spacing
  tone?: Tone
  width?: Width
  className?: string
  innerClassName?: string
  id?: string
}

export default function PageSection({
  children,
  spacing = 'md',
  tone = 'default',
  width = 'wide',
  className = '',
  innerClassName = '',
  id,
}: PageSectionProps) {
  const outerClasses = [TONE[tone], className].filter(Boolean).join(' ')
  const innerClasses = [
    WIDTH[width],
    SPACING[spacing],
    innerClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={outerClasses || undefined} id={id}>
      <div className={innerClasses}>{children}</div>
    </section>
  )
}
