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
  new: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  deprecated: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  preview: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
}

export default function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={cn(
        'not-prose ml-2 inline-flex items-center rounded-full border px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider',
        STYLES[variant],
      )}
    >
      {children}
    </span>
  )
}
