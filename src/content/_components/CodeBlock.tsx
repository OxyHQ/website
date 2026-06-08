import type { ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../../lib/utils'
import { reactNodeToText, useCopyToClipboard } from '../../lib/useCopyToClipboard'

/* ──────────────────────────────────────────────
 * <CodeBlock language="ts" filename="foo.ts">
 *
 * Syntax-aware code surface for MDX. Renders a chrome bar with the filename
 * + language and a one-click "Copy" button. Syntax highlighting itself
 * happens at MDX render time via the standard `<pre><code>` styling — this
 * primitive owns the chrome only.
 *
 *   <CodeBlock language="ts" filename="login.ts">
 *     {`import { OxyServices } from '@oxyhq/core'\nconst oxy = new OxyServices(...)`}
 *   </CodeBlock>
 * ──────────────────────────────────────────── */

interface CodeBlockProps {
  language?: string
  filename?: string
  children: ReactNode
  className?: string
}

export default function CodeBlock({ language, filename, children, className }: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard()

  const showHeader = filename !== undefined || language !== undefined

  return (
    <figure className={cn('not-prose my-6 overflow-hidden rounded-2xl border border-border', className)}>
      {showHeader ? (
        <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            {filename ? (
              <span className="truncate font-mono text-xs text-foreground">{filename}</span>
            ) : null}
            {language ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {language}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => copy(reactNodeToText(children))}
            className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="size-3.5" aria-hidden="true" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden="true" /> Copy
              </>
            )}
          </button>
        </header>
      ) : null}
      <pre className="overflow-x-auto bg-background p-4 text-sm leading-relaxed text-foreground">
        <code className="font-mono">{children}</code>
      </pre>
    </figure>
  )
}
