import { Suspense, createElement } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { mdxLazyComponents } from '../../content/docs-loader'
import { mdxComponents } from '../docs-platform/mdxComponentMap'

export function DocsMdxBody({ file }: { file: string }) {
  const lazyComponent = mdxLazyComponents.get(file)

  if (!lazyComponent) {
    return (
      <div className="not-prose rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted-foreground">
          Page content unavailable. The synced docs may be out of date. Run{' '}
          <code>bun scripts/sync-docs.ts</code> from the website root.
        </p>
      </div>
    )
  }
  // `createElement` keeps the lazy component out of the JSX namespace, which
  // satisfies `react-hooks/static-components`. The components themselves are
  // built at module init in `docs-loader.ts` so identities stay stable across
  // renders.
  return (
    <MDXProvider components={mdxComponents}>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        {createElement(lazyComponent)}
      </Suspense>
    </MDXProvider>
  )
}
