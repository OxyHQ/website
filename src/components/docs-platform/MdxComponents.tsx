import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import CodeBlock from '../../content/_components/CodeBlock'

/* -------------------------------- Code -------------------------------- */

interface CodeProps {
  language?: string
  children: ReactNode
}

export function Code({ language, children }: CodeProps) {
  return (
    <pre className="not-prose my-4 overflow-x-auto rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-foreground">
      {language ? (
        <div className="mb-2 text-label-sm uppercase tracking-wider text-muted-foreground">
          {language}
        </div>
      ) : null}
      <code className="font-mono">{children}</code>
    </pre>
  )
}

/* ------------------------------- Callout ------------------------------ */

interface CalloutProps {
  variant?: 'info' | 'warning' | 'danger' | 'success'
  title?: string
  children: ReactNode
}

const calloutStyles: Record<NonNullable<CalloutProps['variant']>, string> = {
  info: 'border-info/30 bg-info-subtle text-foreground',
  warning: 'border-warning/30 bg-warning-subtle text-foreground',
  danger: 'border-error/30 bg-error-subtle text-foreground',
  success: 'border-success/30 bg-success-subtle text-foreground',
}

export function Callout({ variant = 'info', title, children }: CalloutProps) {
  return (
    <aside
      className={cn(
        'not-prose my-6 rounded-2xl border p-4 text-sm leading-relaxed',
        calloutStyles[variant],
      )}
    >
      {title ? <div className="mb-1 font-semibold">{title}</div> : null}
      <div className="opacity-90">{children}</div>
    </aside>
  )
}

/* -------------------------------- Badge ------------------------------- */

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger'
  children: ReactNode
}

const badgeStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success-subtle text-success-text',
  warning: 'bg-warning-subtle text-warning-text',
  danger: 'bg-error-subtle text-error-text',
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={cn(
        'not-prose inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        badgeStyles[variant],
      )}
    >
      {children}
    </span>
  )
}

/* ----------------------------- LiveExample ---------------------------- */

interface LiveExampleProps {
  /** Optional title shown above the preview. */
  title?: string
  /** Live element to render. Passed in by MDX call-sites. */
  children: ReactNode
  /** Optional source code shown below the preview. */
  source?: string
}

export function LiveExample({ title, children, source }: LiveExampleProps) {
  return (
    <section className="not-prose my-6 overflow-hidden rounded-2xl border border-border">
      {title ? (
        <header className="border-b border-border bg-surface px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </header>
      ) : null}
      <div className="flex min-h-[120px] items-center justify-center bg-background p-6">
        {children}
      </div>
      {source ? (
        <pre className="border-t border-border bg-surface px-4 py-3 overflow-x-auto text-xs leading-relaxed">
          <code>{source}</code>
        </pre>
      ) : null}
    </section>
  )
}

/* -------------------------------- MdxPre ------------------------------ */

/**
 * Fenced code blocks (```lang). The fence's language comes through as the
 * inner `<code className="language-x">`; the block itself is the site's
 * `CodeBlock` (Bloom's code card), so a fenced block and an explicit
 * `<CodeBlock>` look and copy the same. Inline `code` keeps its own pill via
 * the tag map, so this only owns block code.
 */
export function MdxPre({ children }: { children?: ReactNode }) {
  let language: string | undefined
  if (children && typeof children === 'object' && 'props' in children) {
    const className = (children as { props?: { className?: string } }).props?.className ?? ''
    language = /language-([\w-]+)/.exec(className)?.[1]
  }
  return (
    <CodeBlock language={language} className="my-5">
      {children}
    </CodeBlock>
  )
}
