import type { ReactNode } from 'react'
import type { BloomIconComponent } from '@oxy.so/bloom/icons'
import { RiAlertLine } from '@oxy.so/bloom/icons/RiAlertLine'
import { RiForbidLine } from '@oxy.so/bloom/icons/RiForbidLine'
import { RiInformationLine } from '@oxy.so/bloom/icons/RiInformationLine'
import { RiLightbulbLine } from '@oxy.so/bloom/icons/RiLightbulbLine'
import { cn } from '../../lib/utils'

/* ──────────────────────────────────────────────
 * <Callout type="info|warning|tip|danger" title="…">
 *
 * Inline information block for MDX content. Uses Bloom's Remix icons for the type
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
    container: 'border-info/30 bg-info-subtle text-foreground',
    icon: 'text-info-text',
  },
  warning: {
    container: 'border-warning/30 bg-warning-subtle text-foreground',
    icon: 'text-warning-text',
  },
  tip: {
    container: 'border-success/30 bg-success-subtle text-foreground',
    icon: 'text-success-text',
  },
  danger: {
    container: 'border-error/30 bg-error-subtle text-foreground',
    icon: 'text-error-text',
  },
}

const ICONS: Record<CalloutType, BloomIconComponent> = {
  info: RiInformationLine,
  warning: RiAlertLine,
  tip: RiLightbulbLine,
  danger: RiForbidLine,
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
      <span className={cn('inline-flex shrink-0', styles.icon)} aria-hidden="true">
        <Icon width={20} height={20} fill="currentColor" />
      </span>
      <div className="flex-1">
        {title ? <div className="mb-1 font-semibold">{title}</div> : null}
        <div className="opacity-90 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </aside>
  )
}
