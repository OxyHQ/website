import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../lib/utils'
import { Badge, Callout, Code, LiveExample } from './MdxComponents'

/**
 * Default tag map handed to `<MDXProvider components={mdxComponents}>` so
 * plain markdown elements (`<p>`, `<h2>`, `<table>`, …) pick up Bloom-styled
 * typography. Component-named tags (`<Callout>`, `<Code>`, …) are re-exported
 * here so MDX authors can use them by name. This module is intentionally a
 * separate file from `MdxComponents.tsx` to keep that file
 * components-only — required by the `react-refresh/only-export-components`
 * Vite lint rule.
 */
export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1
      {...props}
      className={cn(
        'mt-2 mb-6 text-4xl font-semibold tracking-tight text-foreground',
        props.className,
      )}
    />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      {...props}
      className={cn(
        'mt-10 mb-3 text-2xl font-semibold tracking-tight text-foreground',
        props.className,
      )}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      {...props}
      className={cn('mt-8 mb-2 text-xl font-semibold text-foreground', props.className)}
    />
  ),
  h4: (props: ComponentPropsWithoutRef<'h4'>) => (
    <h4
      {...props}
      className={cn('mt-6 mb-2 text-lg font-semibold text-foreground', props.className)}
    />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p {...props} className={cn('my-4 leading-7 text-foreground', props.className)} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul
      {...props}
      className={cn('my-4 list-disc pl-6 space-y-1.5 text-foreground', props.className)}
    />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol
      {...props}
      className={cn('my-4 list-decimal pl-6 space-y-1.5 text-foreground', props.className)}
    />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li {...props} className={cn('leading-7', props.className)} />
  ),
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a
      {...props}
      className={cn('text-primary underline-offset-4 hover:underline', props.className)}
    />
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
      className={cn(
        'rounded bg-surface px-1.5 py-0.5 font-mono text-[0.875em] text-foreground',
        props.className,
      )}
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
    <td
      {...props}
      className={cn('border-b border-border px-4 py-2 text-foreground', props.className)}
    />
  ),
  hr: (props: ComponentPropsWithoutRef<'hr'>) => (
    <hr {...props} className={cn('my-8 border-border', props.className)} />
  ),
  Callout,
  Code,
  Badge,
  LiveExample,
}
