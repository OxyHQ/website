import type { ReactNode } from 'react'
import { CodeBlock as BloomCodeBlock } from '@oxy.so/bloom/code'
import { cn } from '../../lib/utils'
import { useTranslation } from '../../lib/i18n'
import { reactNodeToText, useCopyToClipboard } from '../../lib/useCopyToClipboard'

/* ──────────────────────────────────────────────
 * <CodeBlock language="ts" filename="foo.ts">
 *
 * The site's code card, for MDX and for fenced blocks (`MdxPre`). Bloom's
 * `CodeBlock` draws it: a header with the language chip, the file name and a
 * copy button, then real `<pre><code>` lines — highlighted when `language` is
 * a JavaScript/TypeScript dialect, plain otherwise. The copy goes through the
 * site's clipboard flow, so it toasts like every other copy on the site.
 *
 *   <CodeBlock language="ts" filename="login.ts">
 *     {`import { OxyServices } from '@oxy.so/core'\nconst oxy = new OxyServices(...)`}
 *   </CodeBlock>
 * ──────────────────────────────────────────── */

interface CodeBlockProps {
  language?: string
  filename?: string
  children: ReactNode
  className?: string
}

export default function CodeBlock({ language, filename, children, className }: CodeBlockProps) {
  const { t } = useTranslation()
  const { copy } = useCopyToClipboard()
  // A fenced block's text ends in its closing newline, which would render as
  // an empty numbered line.
  const code = reactNodeToText(children).replace(/\n+$/, '')

  return (
    <div className={cn('not-prose my-6', className)}>
      <BloomCodeBlock
        code={code}
        language={language}
        filename={filename}
        // A one-line command reads as a command; a "1" beside it is noise.
        lineNumbers={code.includes('\n')}
        labels={{ copy: t('common.copyCode'), copied: t('common.codeCopied') }}
        onCopy={async (text) => {
          // Rejecting leaves Bloom's glyph as it was; the hook has toasted why.
          if (!(await copy(text, t('common.codeCopied')))) throw new Error('copy failed')
        }}
      />
    </div>
  )
}
