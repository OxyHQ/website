import { Suspense, createElement } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@oxyhq/bloom/badge'
import { Card } from '@oxyhq/bloom/card'
import { ErrorBoundary } from '@oxyhq/bloom/error-boundary'
import { bloomCategories, bloomIndex, bloomVersion } from '../../content/bloom-catalog.generated'
import { getBloomDemo, type BloomDemo } from '../../content/bloom-demos/registry'
import { pascalPath } from '../../content/bloom-catalog'
import { getPackage, resolveVersion } from '../../content/docs-loader'
import { DocsShell } from '../docs/DocsShell'
import { buildSidebar } from '../docs/DocsPackageSidebar'
import PageShell from '../layout/PageShell'
import { BloomGridSearch, type BloomGridEntry } from './BloomGridSearch'

/**
 * The Bloom component index at `/developers/docs/bloom/components`: every
 * surface Bloom publishes, grouped by the category its README puts it in, each
 * linking to its component page.
 *
 * Everything here is derived from `bloom-catalog.generated.ts`, so a surface
 * added upstream appears the next time the catalog is regenerated — there is no
 * list to maintain. A surface without a demo still gets a card: the reader needs
 * to know the component exists, and that only its example is missing.
 *
 * Page and grid are one component because the route is the only thing that
 * mounts either. The grid used to be injected into a synced MDX page that
 * supplied the chrome; with that injection gone, a separate bare-grid component
 * would have exactly one caller, which is a wrapper rather than a seam.
 */

/** Providers, tokens and fonts — infrastructure, with nothing to look at. */
const utilityCategories = new Set(
  bloomCategories.filter((category) => category.utility).map((category) => category.name),
)

const entries: readonly BloomGridEntry[] = bloomIndex
  .filter((surface) => !utilityCategories.has(surface.category))
  .map((surface) => ({
    surface,
    // The `components` segment is load-bearing, not decoration: `bloom/:version`
    // already serves the versioned docs, and a static segment outranks a dynamic
    // one at the same depth — without it `/developers/docs/bloom/0.72.1` would
    // match as a component named `0.72.1`.
    href: `/developers/docs/bloom/components/${surface.subpath}`,
    demo: getBloomDemo(pascalPath(surface.subpath)),
  }))

/** Grouped in Bloom's README order, which reads from most to least prominent. */
const groups = bloomCategories
  .filter((category) => !category.utility)
  .map((category) => ({
    name: category.name,
    entries: entries.filter((entry) => entry.surface.category === category.name),
  }))
  .filter((group) => group.entries.length > 0)

/**
 * The demo, laid out at twice the card's width and drawn at half size. The two
 * halves of that are one decision: a demo is written for a page, not for a
 * card, so it needs the room — and `200%` paired with `scale-50` lands it back
 * at exactly the card's width, whatever the breakpoint.
 *
 * `inert` takes the whole preview out of the pointer, focus and accessibility
 * trees. A demo is a real component — it has buttons that open dialogs and
 * inputs that take focus — and inside a link none of that should be reachable;
 * the card's own link overlay paints above it and takes the click.
 *
 * The boundary is what keeps the index complete: a demo is live code, and one
 * that throws would otherwise take every other card down with it. This way its
 * own card says so and the rest still render. It is not a licence to leave a
 * demo broken — `scripts/bloom-demos.browser.test.ts` renders every demo
 * WITHOUT a boundary and fails the build if one throws.
 */
function BloomGridPreview({ demo }: { demo: BloomDemo }) {
  return (
    <ErrorBoundary
      fallback={
        <Badge content="Example unavailable" variant="subtle" color="warning" size="small" />
      }
    >
      <Suspense fallback={null}>
        <div inert className="w-[200%] shrink-0 scale-50 text-center">
          {createElement(demo.Component)}
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}

function BloomGridCard({ entry }: { entry: BloomGridEntry }) {
  const { surface, href, demo } = entry
  const names = surface.components.map((component) => component.name)
  return (
    <li className="relative">
      <Card variant="outlined" style={{ height: '100%', overflow: 'hidden' }}>
        <div className="flex h-36 items-center justify-center overflow-hidden border-b border-border bg-background px-4">
          {demo ? (
            <BloomGridPreview demo={demo} />
          ) : (
            <Badge content="Example pending" variant="subtle" color="default" size="small" />
          )}
        </div>
        <div className="flex flex-col gap-1 p-4">
          {/*
            The link stretches over the whole card via its own `::after`, so the
            card is one target with one accessible name and the preview under it
            stays inert.
          */}
          <Link
            to={href}
            className="font-mono text-sm font-semibold text-foreground after:absolute after:inset-0 after:content-[''] hover:text-primary"
          >
            {surface.subpath}
          </Link>
          {names.length > 0 ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{names.join(' · ')}</p>
          ) : null}
        </div>
      </Card>
    </li>
  )
}

export function BloomComponentsHub() {
  const pkg = getPackage('bloom')
  const version = pkg ? resolveVersion(pkg) : undefined
  return (
    <PageShell
      className="docs-theme bg-background"
      seo={{
        title: 'Bloom components',
        description: 'Explore every component surface published by Bloom and the props it declares.',
        canonicalPath: '/developers/docs/bloom/components',
      }}
      mainClassName="flex-1 bg-background text-muted-foreground"
      mainAsDiv
    >
      <DocsShell
        sections={pkg && version ? buildSidebar(pkg, version) : null}
        eyebrow={`Bloom ${bloomVersion}`}
        title="Components"
        subtitle="Every surface Bloom publishes, and the props it declares."
        activePkg={pkg ?? undefined}
      >
        <nav aria-label="Bloom components" className="not-prose flex flex-col gap-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {entries.length} component surfaces across {groups.length} categories.
            </p>
            <BloomGridSearch entries={entries} />
          </div>
          {groups.map((group) => (
            <section key={group.name} className="flex flex-col gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.name}
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.entries.map((entry) => (
                  <BloomGridCard key={entry.surface.subpath} entry={entry} />
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </DocsShell>
    </PageShell>
  )
}
