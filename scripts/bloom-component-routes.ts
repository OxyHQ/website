/**
 * The prerender routes for Bloom's component hub and its per-surface pages.
 *
 * ## Why this is derived and not a list
 *
 * `prerender.ts` walks six sources — curated marketing routes, help MDX,
 * academy MDX, the newsroom API, the careers API, and the synced docs index.
 * The component pages were a seventh nobody walked, so all 87 of them plus the
 * hub shipped with no prerendered `<head>`: no title, no description, no
 * canonical, no sitemap row. Cloudflare's SPA fallback serves them to a human,
 * which is exactly why nobody noticed — they do not exist for a crawler.
 *
 * Eighty-eight hand-written entries would be the map this catalog exists to
 * end, and would go stale the first time Bloom adds a surface. So the routes
 * come from `bloomIndex`, and `validate:bloom-catalog` fails when a surface has
 * no route, which makes a new Bloom component impossible to ship invisible.
 *
 * ## Why the titles agree with the page by construction
 *
 * `BloomComponentPage` titles itself `pascalPath(subpath)` and subtitles itself
 * with the principal component's JSDoc, falling back to the category. This
 * calls the same `pascalPath` from the same contract module and reads the same
 * `description` off the same index. Two implementations would drift, and a
 * drifting `<title>` is visible only to a crawler.
 */

import { bloomIndex } from '../src/content/bloom-catalog.generated'
import { pascalPath, type BloomSurfaceEntry } from '../src/content/bloom-catalog'

/** Where the hub lives; every surface hangs off it. */
export const BLOOM_COMPONENTS_BASE = '/developers/docs/bloom/components'

export interface BloomComponentRoute {
  url: string
  seo: {
    title: string
    description: string
    canonicalPath: string
  }
}

/** The URL a surface's page is served at. */
export function bloomComponentUrl(subpath: string): string {
  return `${BLOOM_COMPONENTS_BASE}/${subpath}`
}

/**
 * A surface's meta description.
 *
 * Bloom documents 33 of its 189 exports, so most surfaces have no JSDoc to use
 * and fall back to their category — the same fallback the page's subtitle
 * takes. A bare category ("Actions") is a true subtitle but a useless meta
 * description, so the fallback composes a sentence from the same two facts the
 * page shows: what group it belongs to, and what you import.
 */
function describe(entry: BloomSurfaceEntry, name: string): string {
  const principal = entry.components.find((component) => component.name === name)
  if (principal?.description) return principal.description
  return `${name} from Bloom, the Oxy UI library — every prop it takes, with types and `
    + `descriptions. Part of ${entry.category}, imported from ${entry.importPath}.`
}

/**
 * The hub route plus one per surface, in `bloomIndex` order.
 *
 * Every surface gets a page, including the twelve in the utility groups the hub
 * does not card. They are real routes that render, and a route that renders
 * without a head is the thing being fixed here.
 */
export function bloomComponentRoutes(
  index: readonly BloomSurfaceEntry[] = bloomIndex,
): BloomComponentRoute[] {
  const routes: BloomComponentRoute[] = [
    {
      url: BLOOM_COMPONENTS_BASE,
      seo: {
        title: 'Bloom components, Oxy Docs',
        description:
          `Every one of the ${index.length} surfaces Bloom publishes, grouped the way its own `
          + 'README groups them, with the props each one takes.',
        canonicalPath: BLOOM_COMPONENTS_BASE,
      },
    },
  ]

  for (const entry of index) {
    const name = pascalPath(entry.subpath)
    const url = bloomComponentUrl(entry.subpath)
    routes.push({
      url,
      seo: {
        title: `${name}, Bloom`,
        description: describe(entry, name),
        canonicalPath: url,
      },
    })
  }

  return routes
}
