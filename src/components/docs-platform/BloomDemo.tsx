import { Suspense, createElement } from 'react'
import { ErrorBoundary } from '@oxyhq/bloom/error-boundary'
import { getBloomDemo } from '../../content/bloom-demos/registry'

interface BloomDemoProps {
  /** Capitalized component name, e.g. "Button". Must match a demo file. */
  name: string
}

/**
 * Render a Bloom component demo inside an MDX page.
 *
 * Looks up `name` in the bloom-demos registry. Missing names render a small
 * inline notice instead of throwing so editors get a useful error message.
 *
 * The demo body is rendered inside a bordered preview surface, with the
 * underlying source code shown below in a collapsed `<details>`. The source
 * is read via Vite's `?raw` glob query so authors don't need to keep an
 * in-sync copy of the snippet next to the component.
 */
export function BloomDemo({ name }: BloomDemoProps) {
  const demo = getBloomDemo(name)
  if (!demo) {
    return (
      <div className="not-prose my-6 rounded-2xl border border-warning/30 bg-warning-subtle p-4 text-sm text-foreground">
        Demo <code className="font-mono">{name}</code> not found. Add{' '}
        <code className="font-mono">src/content/bloom-demos/{name}.tsx</code>.
      </div>
    )
  }
  const Component = demo.Component
  return (
    <section className="not-prose my-6 overflow-hidden rounded-2xl border border-border bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span>Preview</span>
        <span className="font-mono normal-case tracking-normal">{name}</span>
      </header>
      <div className="flex min-h-[180px] items-center justify-center p-8">
        {/*
          A demo is live code sitting on a page whose whole point is the example,
          and it is written against one version of Bloom. The next bump can turn
          it into a throw, and without a boundary that throw blanks the entire
          docs page. The message names the failure instead of rendering nothing,
          so a BROKEN example is never mistaken for a MISSING one, and the source
          block below stays available to whoever fixes it.
        */}
        <ErrorBoundary
          fallback={({ error }) => (
            <div className="max-w-md rounded-xl border border-warning/30 bg-warning-subtle p-4 text-center">
              <p className="text-sm font-semibold text-foreground">
                This example failed to render.
              </p>
              <p className="mt-1 text-xs text-foreground">
                A fault in the <code className="font-mono">{name}</code> example, not
                necessarily in the component itself — the reference below is unaffected.
              </p>
              <p className="mt-2 font-mono text-xs text-warning-text">{error.message}</p>
            </div>
          )}
        >
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading demo…</div>}>
            {createElement(Component)}
          </Suspense>
        </ErrorBoundary>
      </div>
      {demo.source ? (
        <details className="group border-t border-border bg-surface">
          <summary className="cursor-pointer select-none px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
            <span className="group-open:hidden">Show source</span>
            <span className="hidden group-open:inline">Hide source</span>
          </summary>
          <pre className="overflow-x-auto border-t border-border bg-background px-4 py-3 text-xs leading-relaxed text-foreground">
            <code className="font-mono">{demo.source}</code>
          </pre>
        </details>
      ) : null}
    </section>
  )
}
