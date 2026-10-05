import { Suspense, createElement, useState } from 'react'
import { Link } from '../../lib/navigation'
import { ErrorBoundary } from '@oxy.so/bloom/error-boundary'
import { Search } from '@oxy.so/bloom/search'
import {
  bloomCategories,
  bloomIndex,
  bloomVersion,
} from '../../content/bloom-catalog.generated'
import { getBloomDemo } from '../../content/bloom-demos/registry'
import { pascalPath } from '../../content/bloom-catalog'
import { DocsShell } from '../docs/DocsShell'
import PageShell from '../layout/PageShell'
import OptionSelect from '../ui/OptionSelect'
import CatalogPreview from '../bloom/CatalogPreview'
import { catalogPreviews } from '../bloom/catalogPreviews'
import { useSiteHeaderBottom } from '../../hooks/useSiteHeaderBottom'

/** The catalog and detail pages share the landing's actual Bloom demos. */
export function BloomComponentsHub() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const railTop = useSiteHeaderBottom() + 72
  const entries = bloomIndex.filter(
    (entry) =>
      (category === 'All' || entry.category === category) &&
      `${entry.subpath} ${entry.category} ${catalogPreviews[entry.subpath]?.title ?? ''} ${entry.components.map((c) => c.name).join(' ')}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  )
  const visual = entries.flatMap((entry) => {
    const demo = getBloomDemo(pascalPath(entry.subpath))
    const preview = catalogPreviews[entry.subpath]
    return demo || preview ? [{ entry, demo, preview }] : []
  })
  const reference = entries.filter(
    (entry) =>
      !getBloomDemo(pascalPath(entry.subpath)) &&
      !catalogPreviews[entry.subpath],
  )
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
        subtitle="Explore Bloom components, live examples and their APIs."
        versionAgnostic
      >
        <div className="not-prose grid items-start gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside
            className="sticky hidden overflow-y-auto rounded-[24px] border border-border bg-card p-4 lg:block"
            style={{
              top: railTop,
              maxHeight: `calc(100dvh - ${railTop + 24}px)`,
            }}
            aria-label="Component categories"
          >
            <Link
              className="mb-5 block text-lg font-semibold text-foreground"
              to="/bloom/"
            >
              Bloom UI
            </Link>
            <nav className="space-y-1">
              {['All', ...bloomCategories.map((c) => c.name)].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  aria-pressed={category === name}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${category === name ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <span>{name === 'All' ? 'All components' : name}</span>
                  <span className="text-xs tabular-nums">
                    {
                      bloomIndex.filter(
                        (entry) => name === 'All' || entry.category === name,
                      ).length
                    }
                  </span>
                </button>
              ))}
            </nav>
            <div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm">
              <Link
                className="oxy-link"
                to="/developers/docs/bloom/color-system/"
              >
                Colour recipes
              </Link>
            </div>
          </aside>
          <div className="min-w-0 space-y-10">
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid min-w-0 flex-1 gap-2 text-sm">
                <span aria-hidden="true">Find a component</span>
                <Search
                  label="Find a component"
                  placeholder="Search buttons, composers, calendars…"
                  value={query}
                  onChangeText={setQuery}
                  onClearText={() => setQuery('')}
                />
              </div>
              <div className="grid gap-2 text-sm lg:hidden">
                <span aria-hidden="true">Category</span>
                <OptionSelect
                  label="Category"
                  value={category}
                  onValueChange={setCategory}
                  options={[
                    { value: 'All', label: 'All' },
                    ...bloomCategories.map((c) => ({
                      value: c.name,
                      label: c.name,
                    })),
                  ]}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground" role="status">
              {visual.length} visual examples · {entries.length} matching API
              entries
            </p>
            {bloomCategories.map((group) => {
              const cards = visual.filter(
                ({ entry }) => entry.category === group.name,
              )
              if (!cards.length) return null
              return (
                <section
                  key={group.name}
                  className="flex scroll-mt-36 flex-col gap-4"
                  aria-label={group.name}
                >
                  <h2 className="flex items-baseline gap-2 text-xl font-medium text-foreground">
                    {group.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      {cards.length}
                    </span>
                  </h2>
                  <div className="grid w-full grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-[repeat(3,304px)]">
                    {cards.map(({ entry, demo, preview }) => (
                      <article
                        key={entry.subpath}
                        data-catalog-card={entry.subpath}
                        className="landing-showcase-card group/card relative h-[332px] overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground [container-type:inline-size] xl:h-[299px]"
                      >
                        <div
                          className="flex h-[230px] items-center justify-center overflow-hidden px-4 xl:h-[197px]"
                          inert
                        >
                          <ErrorBoundary
                            fallback={
                              <p className="text-sm">
                                This example could not load.
                              </p>
                            }
                          >
                            {preview ? (
                              <CatalogPreview preview={preview} thumbnail />
                            ) : demo ? (
                              <Suspense
                                fallback={
                                  <p className="text-sm">Loading example…</p>
                                }
                              >
                                <div className="w-full min-w-0 max-w-full [&>div]:max-w-full!">
                                  {createElement(demo.Component)}
                                </div>
                              </Suspense>
                            ) : null}
                          </ErrorBoundary>
                        </div>
                        <div className="flex flex-col gap-1 px-5 pt-3 pb-5">
                          <h3 className="text-base font-medium leading-[22px]">
                            <Link
                              className="after:absolute after:inset-0 after:rounded-[28px] focus-visible:after:ring-2 focus-visible:after:ring-primary"
                              to={`/developers/docs/bloom/components/${entry.subpath}/`}
                            >
                              {preview?.title ?? demo?.name}
                            </Link>
                          </h3>
                          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                            {preview?.description ?? demo?.description}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
            {!entries.length && (
              <div className="oxy-guide-panel">
                <h2 className="text-xl">No matching components</h2>
                <p className="mt-3">
                  Try a different name or choose another category.
                </p>
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
                <h2 className="text-xl font-medium text-foreground">
                  API reference
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  Browse the props, hooks and exports for the rest of the
                  library.
                </p>
                <ul className="mt-6 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
                  {reference.map((entry) => (
                    <li
                      key={entry.subpath}
                      className="min-w-0 border-b border-border py-4"
                    >
                      <Link
                        className="oxy-link break-words font-mono text-sm"
                        to={`/developers/docs/bloom/components/${entry.subpath}/`}
                      >
                        {entry.subpath}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {entry.category}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </DocsShell>
    </PageShell>
  )
}
