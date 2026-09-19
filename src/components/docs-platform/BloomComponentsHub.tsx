import { Suspense, createElement, useState } from 'react'
import { Link } from '../../lib/navigation'
import { ErrorBoundary } from '@oxy.so/bloom/error-boundary'
import { bloomCategories, bloomIndex, bloomVersion } from '../../content/bloom-catalog.generated'
import { getBloomDemo } from '../../content/bloom-demos/registry'
import { defaultValues } from '../../content/bloom-demos/_playground'
import { pascalPath } from '../../content/bloom-catalog'
import { DocsShell } from '../docs/DocsShell'
import PageShell from '../layout/PageShell'

/** Visual discovery and complete API inventory share the generated catalog.
 * Infrastructure and undemonstrated exports remain discoverable without blank
 * tiles pretending to be previews. */
export function BloomComponentsHub() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const entries = bloomIndex.filter(
    (entry) =>
      (category === 'All' || entry.category === category) &&
      `${entry.subpath} ${entry.category} ${entry.components.map((c) => c.name).join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const visual = entries.flatMap((entry) => {
    const demo = getBloomDemo(pascalPath(entry.subpath))
    return demo ? [{ entry, demo }] : []
  })
  const reference = entries.filter((entry) => !getBloomDemo(pascalPath(entry.subpath)))
  return (
    <PageShell
      className="docs-theme bg-background"
      seo={{
        title: 'Bloom components',
        description:
          'Discover Bloom through live component previews, variants and interactive examples.',
        canonicalPath: '/developers/docs/bloom/components',
      }}
      mainAsDiv
    >
      <DocsShell
        sections={null}
        hideSidebar
        wideContent
        eyebrow={`Bloom ${bloomVersion}`}
        title="Components"
        subtitle="Find the building blocks for your next idea."
        versionAgnostic
      >
        <div className="not-prose space-y-10">
          <div className="bloom-toolbar flex flex-wrap items-end gap-4">
            <label className="grid flex-1 gap-2 text-sm">
              Find a component
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search buttons, navigation, forms…"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>All</option>
                {bloomCategories.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
            <Link className="oxy-link" to="/developers/docs/bloom/playground">
              Open playground
            </Link>
            <Link className="oxy-link" to="/developers/docs/bloom/color-system">
              Colour recipes
            </Link>
          </div>
          <p className="text-sm text-muted-foreground" role="status">
            {visual.length} visual examples · {entries.length} matching API entries
          </p>
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visual.map(({ entry, demo }) => (
              <li
                key={entry.subpath}
                className="relative overflow-hidden rounded-3xl border border-border bg-card text-card-foreground"
              >
                <div
                  className="flex min-h-64 items-center justify-center overflow-hidden bg-background p-6"
                  inert
                >
                  <ErrorBoundary fallback={<p className="text-sm">This example could not load.</p>}>
                    <Suspense fallback={<p className="text-sm">Loading example…</p>}>
                      <div className="w-full max-w-full [&>div]:!max-w-full">
                        {demo.Playground
                          ? createElement(demo.Playground, {
                              values: defaultValues(demo.props ?? []),
                            })
                          : createElement(demo.Component)}
                      </div>
                    </Suspense>
                  </ErrorBoundary>
                </div>
                <div className="border-t border-border p-6">
                  <p className="text-sm text-muted-foreground">{entry.category}</p>
                  <h2 className="mt-2 font-display text-2xl">
                    <Link
                      className="after:absolute after:inset-0"
                      to={`/developers/docs/bloom/components/${entry.subpath}`}
                    >
                      {demo.name}
                    </Link>
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {demo.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {!entries.length && (
            <div className="oxy-guide-panel">
              <h2 className="text-xl">No matching components</h2>
              <p className="mt-3">Try a different name or choose another category.</p>
              <button
                className="oxy-link mt-3"
                onClick={() => {
                  setQuery('')
                  setCategory('All')
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          {reference.length > 0 && (
            <section className="border-t border-border pt-10">
              <h2 className="font-display text-3xl">API reference</h2>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                Utilities and additional components. Their reference pages document the exported
                APIs; visual examples are still being added.
              </p>
              <ul className="mt-8 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {reference.map((entry) => (
                  <li key={entry.subpath} className="border-b border-border py-4">
                    <Link
                      className="oxy-link font-mono text-sm"
                      to={`/developers/docs/bloom/components/${entry.subpath}`}
                    >
                      {entry.subpath}
                    </Link>
                    <p className="text-sm text-muted-foreground">{entry.category}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </DocsShell>
    </PageShell>
  )
}
