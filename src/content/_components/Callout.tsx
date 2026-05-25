import type { ReactNode } from 'react'
import { Info, AlertTriangle, Lightbulb, OctagonX } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ──────────────────────────────────────────────
 * <Callout type="info|warning|tip|danger" title="…">
 *
 * Inline information block for MDX content. Uses Lucide icons for the type
 * indicator and color-coded borders/backgrounds that respect dark mode.
 *
 *   <Callout type="warning" title="Heads up">
 *     This change is irreversible.
 *   </Callout>
 * ──────────────────────────────────────────── */

type CalloutType = 'info' | 'warning' | 'tip' | 'danger'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: ReactNode
}

const STYLES: Record<CalloutType, { container: string; icon: string }> = {
  info: {
    container: 'border-primary/30 bg-primary/5 text-foreground',
    icon: 'text-primary',
  },
  warning: {
    container: 'border-amber-500/30 bg-amber-500/5 text-foreground',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  tip: {
    container: 'border-emerald-500/30 bg-emerald-500/5 text-foreground',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  danger: {
    container: 'border-red-500/30 bg-red-500/5 text-foreground',
    icon: 'text-red-600 dark:text-red-400',
  },
}

const ICONS: Record<CalloutType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  tip: Lightbulb,
  danger: OctagonX,
}

export default function Callout({ type = 'info', title, children }: CalloutProps) {
  const Icon = ICONS[type]
  const styles = STYLES[type]
  return (
    <aside
      className={cn(
        'not-prose my-6 flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed',
        styles.container,
      )}
      role="note"
    >
      <Icon className={cn('size-5 shrink-0', styles.icon)} aria-hidden="true" />
      <div className="flex-1">
        {title ? <div className="mb-1 font-semibold">{title}</div> : null}
        <div className="opacity-90 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </aside>
  )
}
