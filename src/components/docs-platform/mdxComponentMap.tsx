import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../lib/utils'
import { BloomDemo } from './BloomDemo'
import { BloomHubGrid } from './BloomHubGrid'
import { Badge, Callout, Code, LiveExample, MdxPre } from './MdxComponents'

/**
 * Default tag map handed to `<MDXProvider components={mdxComponents}>` so
 * plain markdown elements (`<p>`, `<h2>`, `<table>`, …) pick up Bloom-styled
 * typography. Component-named tags (`<Callout>`, `<Code>`, …) are re-exported
 * here so MDX authors can use them by name. This module is intentionally a
 * separate file from `MdxComponents.tsx` to keep that file
 * components-only — required by the `react-refresh/only-export-components`
 * Vite lint rule.
 *
 * Spacing is kept deliberately tight (compact docs); fenced code blocks route
 * through `MdxPre` for a language pill + copy button.
 */
export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1
      {...props}
      className={cn(
        'mt-2 mb-4 text-3xl font-semibold tracking-tight text-foreground',
        props.className,
      )}
    />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      {...props}
      className={cn(
        'mt-8 mb-2.5 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground',
        props.className,
      )}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      {...props}
      className={cn('mt-6 mb-2 scroll-mt-24 text-lg font-semibold text-foreground', props.className)}
    />
  ),
  h4: (props: ComponentPropsWithoutRef<'h4'>) => (
    <h4
      {...props}
      className={cn('mt-5 mb-1.5 scroll-mt-24 text-base font-semibold text-foreground', props.className)}
    />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p {...props} className={cn('my-3 leading-7 text-foreground', props.className)} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul
      {...props}
      className={cn('my-3 list-disc pl-5 space-y-1 text-foreground', props.className)}
    />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol
      {...props}
      className={cn('my-3 list-decimal pl-5 space-y-1 text-foreground', props.className)}
    />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li {...props} className={cn('leading-6 [&>ul]:my-1 [&>ol]:my-1', props.className)} />
  ),
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a
      {...props}
      className={cn('font-medium text-primary underline-offset-4 hover:underline', props.className)}
    />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      {...props}
      className={cn(
        'my-5 border-l-2 border-primary/40 pl-4 text-foreground/90 italic',
        props.className,
      )}
    />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code
      {...props}
      className={cn(
        'rounded bg-surface px-1.5 py-0.5 font-mono text-[0.85em] text-foreground',
        props.className,
      )}
    />
  ),
  pre: MdxPre,
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="not-prose my-5 overflow-x-auto rounded-xl border border-border">
      <table {...props} className={cn('w-full text-sm', props.className)} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th
      {...props}
      className={cn(
        'border-b border-border bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
        props.className,
      )}
    />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td
      {...props}
      className={cn('border-b border-border px-3 py-1.5 align-top text-foreground', props.className)}
    />
  ),
  hr: (props: ComponentPropsWithoutRef<'hr'>) => (
    <hr {...props} className={cn('my-6 border-border', props.className)} />
  ),
  Callout,
  Code,
  Badge,
  LiveExample,
  BloomDemo,
  BloomHubGrid,
}
