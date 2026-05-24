import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../../lib/utils'

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

/* ---------------------------- MDX defaults ---------------------------- */

/** Map of default tags. Used by MDXProvider so plain MD elements look nice. */
export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1 {...props} className={cn('mt-2 mb-6 text-4xl font-semibold tracking-tight text-foreground', props.className)} />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 {...props} className={cn('mt-10 mb-3 text-2xl font-semibold tracking-tight text-foreground', props.className)} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 {...props} className={cn('mt-8 mb-2 text-xl font-semibold text-foreground', props.className)} />
  ),
  h4: (props: ComponentPropsWithoutRef<'h4'>) => (
    <h4 {...props} className={cn('mt-6 mb-2 text-lg font-semibold text-foreground', props.className)} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p {...props} className={cn('my-4 leading-7 text-foreground', props.className)} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul {...props} className={cn('my-4 list-disc pl-6 space-y-1.5 text-foreground', props.className)} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol {...props} className={cn('my-4 list-decimal pl-6 space-y-1.5 text-foreground', props.className)} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li {...props} className={cn('leading-7', props.className)} />
  ),
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a {...props} className={cn('text-primary underline-offset-4 hover:underline', props.className)} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      {...props}
      className={cn(
        'my-6 border-l-4 border-primary/40 bg-surface/40 px-4 py-2 text-foreground italic',
        props.className,
      )}
    />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code
      {...props}
      className={cn('rounded bg-surface px-1.5 py-0.5 font-mono text-[0.875em] text-foreground', props.className)}
    />
  ),
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre
      {...props}
      className={cn(
        'not-prose my-4 overflow-x-auto rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-foreground',
        props.className,
      )}
    />
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-border">
      <table {...props} className={cn('w-full text-sm', props.className)} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th
      {...props}
      className={cn(
        'border-b border-border bg-surface px-4 py-2 text-left font-semibold text-foreground',
        props.className,
      )}
    />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td {...props} className={cn('border-b border-border px-4 py-2 text-foreground', props.className)} />
  ),
  hr: (props: ComponentPropsWithoutRef<'hr'>) => (
    <hr {...props} className={cn('my-8 border-border', props.className)} />
  ),
  Callout,
  Code,
  Badge,
  LiveExample,
}
