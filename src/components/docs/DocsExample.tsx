import { useState, type ReactNode } from 'react'
import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs'
import { RiEyeLine } from '@oxy.so/bloom/icons/RiEyeLine'
import { RiCodeLine } from '@oxy.so/bloom/icons/RiCodeLine'
import CodeBlock from '../../content/_components/CodeBlock'

/** Shared preview/code frame for component pages and examples embedded in prose. */
export function DocsExample({
  children,
  code,
  title = 'Example',
  language = 'tsx',
}: {
  children: ReactNode
  code?: string
  title?: string
  language?: string
}) {
  const [tab, setTab] = useState('preview')
  return (
    <div className="not-prose flex min-w-0 flex-col gap-4" data-docs-example>
      {code ? (
        <div className="flex items-center justify-between gap-3">
          <Tabs
            label={`${title} view`}
            value={tab}
            onValueChange={setTab}
            variant="filled"
          >
            <TabsTrigger
              value="preview"
              label="Preview"
              leadingIcon={RiEyeLine}
            />
            <TabsTrigger value="code" label="Code" leadingIcon={RiCodeLine} />
          </Tabs>
        </div>
      ) : null}
      <div
        hidden={tab !== 'preview'}
        role="tabpanel"
        aria-label={`${title} preview`}
        className="overflow-hidden rounded-3xl border border-border bg-background"
      >
        <div className="flex min-h-[280px] w-full items-center justify-center p-6 sm:min-h-[326px] sm:p-8">
          {children}
        </div>
      </div>
      {tab === 'code' && code ? (
        <div role="tabpanel" aria-label={`${title} code`}>
          <CodeBlock language={language} filename={title} className="my-0">
            {code}
          </CodeBlock>
        </div>
      ) : null}
    </div>
  )
}
