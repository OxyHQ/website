import type { ReactNode } from 'react'

interface AiSectionProps {
  /** Anchor target. Every section has one so `/ai#enterprise` can be linked. */
  id: string
  eyebrow?: string
  heading: string
  description?: ReactNode
  /** Rendered beside the heading — usually an availability badge. */
  meta?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * One section of an AI page: anchor, eyebrow, heading, lead paragraph, body.
 *
 * Sections are addressable on purpose. Managed and dedicated inference have no
 * pages of their own yet, so `/ai#managed` and `/ai/enterprise#dedicated` are
 * the stable places navigation and sales conversations point at — and a stable
 * anchor survives the day they do get pages, where a `?tab=` would not.
 */
export default function AiSection({
  id,
  eyebrow,
  heading,
  description,
  meta,
  children,
  className = '',
}: AiSectionProps) {
  return (
    <section id={id} className={`scroll-mt-24 py-16 sm:py-24 ${className}`}>
      <div className="container">
        <header className="flex max-w-3xl flex-col gap-3">
          {eyebrow && (
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-heading-responsive-md text-pretty text-foreground">{heading}</h2>
            {meta}
          </div>
          {description && (
            <div className="text-pretty text-lg text-muted-foreground">{description}</div>
          )}
        </header>
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  )
}
