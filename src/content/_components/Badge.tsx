import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/* ──────────────────────────────────────────────
 * <Badge variant="new|deprecated|preview">
 *
 * Inline label for marking sections, features, or APIs with a status flag.
 * Designed to live inline next to headings or in tables of contents.
 *
 *   ## Service tokens <Badge variant="new">New</Badge>
 *   ## OldApi <Badge variant="deprecated">Deprecated</Badge>
 * ──────────────────────────────────────────── */

type BadgeVariant = 'new' | 'deprecated' | 'preview' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

const STYLES: Record<BadgeVariant, string> = {
  default: 'bg-surface text-muted-foreground border-border',
  new: 'bg-success-subtle text-success-text border-success/30',
  deprecated: 'bg-error-subtle text-error-text border-error/30',
  preview: 'bg-warning-subtle text-warning-text border-warning/30',
}

export default function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={cn(
        'not-prose ml-2 inline-flex items-center rounded-full border px-2 py-0.5 align-middle text-label-sm font-semibold uppercase tracking-wider',
        STYLES[variant],
      )}
    >
      {children}
    </span>
  )
}
