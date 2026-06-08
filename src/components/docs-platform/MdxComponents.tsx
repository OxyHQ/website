import type { ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../../lib/utils'
import { reactNodeToText, useCopyToClipboard } from '../../lib/useCopyToClipboard'

/* -------------------------------- Code -------------------------------- */

interface CodeProps {
  language?: string
  children: ReactNode
}

export function Code({ language, children }: CodeProps) {
  return (
    <pre className="not-prose my-4 overflow-x-auto rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-foreground">
      {language ? (
        <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
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
  info: 'border-primary/30 bg-primary/5 text-foreground',
  warning: 'border-amber-500/30 bg-amber-500/5 text-foreground',
  danger: 'border-red-500/30 bg-red-500/5 text-foreground',
  success: 'border-emerald-500/30 bg-emerald-500/5 text-foreground',
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
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  danger: 'bg-red-500/15 text-red-700 dark:text-red-300',
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
 * Fenced code blocks (```lang). Renders the code in a compact card with a
 * language pill and a hover copy button. Inline `code` keeps its own pill via
 * the tag map, so this only owns block code.
 */
export function MdxPre({ children }: { children?: ReactNode }) {
  const { copied, copy } = useCopyToClipboard()
  const text = reactNodeToText(children)
  let language: string | undefined
  if (children && typeof children === 'object' && 'props' in children) {
    const className = (children as { props?: { className?: string } }).props?.className ?? ''
    language = /language-([\w-]+)/.exec(className)?.[1]
  }
  return (
    <figure className="not-prose group relative my-5 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {language ? (
          <span className="rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {language}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => copy(text)}
          aria-label="Copy code to clipboard"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3" aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3" aria-hidden /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-foreground">
        <code className="font-mono">{text}</code>
      </pre>
    </figure>
  )
}

