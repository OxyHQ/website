import { Link, useLocation } from 'react-router-dom'
import { bloomDemos } from '../../content/bloom-demos/registry'
import { getPackage, getVersion, resolveVersion } from '../../content/docs-loader'

/**
 * Visual hub grid for the Bloom docs overview page. Renders one card per
 * registered Bloom demo with light/dark thumbnails (when generated) and a
 * link to the component's API reference page.
 *
 * Thumbnails live under
 * `src/content/_synced/bloom/<version>/thumbnails/<Name>.{light,dark}.png`
 * and are produced by `scripts/render-bloom-thumbnails.ts`. The grid handles
 * missing thumbnails by showing a placeholder card so a partially-generated
 * batch still renders a usable hub.
 */

// Eager glob — these are PNGs and they're small (400×300 @ 2× DPR ≈ 30-80 KB).
// Vite turns each entry into an asset URL the browser fetches on demand. The
// total payload only matters once the hub mounts, and the network only fetches
// the variant matching `prefers-color-scheme`.
const thumbnails = import.meta.glob<string>(
  '../../content/_synced/bloom/*/thumbnails/*.png',
  { eager: true, query: '?url', import: 'default' },
)

interface ThumbnailEntry {
  light?: string
  dark?: string
}

interface VersionThumbnails {
  /** Map from component name → light/dark image URLs. */
  byName: ReadonlyMap<string, ThumbnailEntry>
}

function buildVersionMap(): ReadonlyMap<string, VersionThumbnails> {
  const out = new Map<string, Map<string, ThumbnailEntry>>()
  for (const [path, url] of Object.entries(thumbnails)) {
    // Path shape:
    //   ../../content/_synced/bloom/<version>/thumbnails/<Name>.<variant>.png
    const match = path.match(/\/bloom\/([^/]+)\/thumbnails\/([^/]+)\.(light|dark)\.png$/)
    if (!match) continue
    const [, version, name, variant] = match
    if (!version || !name || !variant) continue
    let perVersion = out.get(version)
    if (!perVersion) {
      perVersion = new Map<string, ThumbnailEntry>()
      out.set(version, perVersion)
    }
    const existing = perVersion.get(name) ?? {}
    perVersion.set(name, { ...existing, [variant]: url })
  }
  const wrapped = new Map<string, VersionThumbnails>()
  for (const [version, byName] of out) {
    wrapped.set(version, { byName })
  }
  return wrapped
}

const thumbnailsByVersion = buildVersionMap()

/**
 * Resolve which bloom version we're currently rendering under. Reads the
 * current pathname (`/developers/docs/bloom/<version>/...`) and falls back to
 * the resolved latest version from the docs index.
 */
function useBloomVersion(): string {
  const { pathname } = useLocation()
  const match = pathname.match(/\/developers\/docs\/bloom\/([^/]+)/)
  if (match && match[1]) return match[1]
  const pkg = getPackage('bloom')
  if (!pkg) return 'latest'
  const version = resolveVersion(pkg)
  return version?.version ?? pkg.latestVersion
}

interface ThumbnailImageProps {
  light?: string
  dark?: string
  alt: string
}

function ThumbnailImage({ light, dark, alt }: ThumbnailImageProps) {
  if (!light && !dark) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Preview pending
        </span>
      </div>
    )
  }
  // <picture> with a media-matched source for dark mode. Browsers pick the
  // first matching <source>, falling back to <img>. We provide both URLs as
  // fallbacks so a single-variant deploy still renders something usable.
  const lightSrc = light ?? dark
  const darkSrc = dark ?? light
  return (
    <picture>
      <source media="(prefers-color-scheme: dark)" srcSet={darkSrc} />
      <img
        src={lightSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </picture>
  )
}

/**
 * Find which docs slug a demo name actually maps to. Typedoc routes components
 * into `variables/`, `functions/`, `modules/`, or `classes/` depending on how
 * the symbol is exported by Bloom. We scan the version's pages once to build
 * a lookup so each demo card links to the page that actually exists.
 */
function buildSlugMap(version: string): Map<string, string> {
  const map = new Map<string, string>()
  const pkg = getPackage('bloom')
  if (!pkg) return map
  const v = getVersion(pkg, version) ?? resolveVersion(pkg)
  if (!v) return map
  // Build a slug index keyed by the symbol name (last segment, no extension).
  // Iteration order in `version.pages` is alphabetical post-sort; we prefer
  // matches under `variables/` then `functions/` then anywhere else so a
  // demo for `Button` (which Bloom exports as a `const`) lands on the
  // variable page rather than an unrelated namespaced symbol.
  const priority = (slug: string): number => {
    if (slug.startsWith('api/variables/')) return 0
    if (slug.startsWith('api/functions/')) return 1
    if (slug.startsWith('api/modules/')) return 2
    if (slug.startsWith('api/classes/')) return 3
    return 4
  }
  const candidates = new Map<string, { slug: string; rank: number }>()
  for (const page of v.pages) {
    const slug = page.slug
    if (!slug.startsWith('api/')) continue
    const segments = slug.split('/')
    const last = segments[segments.length - 1]
    if (!last || last.includes('.')) continue
    const rank = priority(slug)
    const existing = candidates.get(last)
    if (!existing || rank < existing.rank) {
      candidates.set(last, { slug, rank })
    }
  }
  for (const [name, entry] of candidates) {
    map.set(name, entry.slug)
  }
  return map
}

export function BloomHubGrid() {
  const version = useBloomVersion()
  const versionMap = thumbnailsByVersion.get(version)?.byName
  const slugMap = buildSlugMap(version)
  if (bloomDemos.length === 0) {
    return (
      <div className="not-prose my-6 rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
        No Bloom demos registered. Add files under{' '}
        <code className="font-mono">src/content/bloom-demos/</code> and run{' '}
        <code className="font-mono">bun run render:bloom-thumbnails</code>.
      </div>
    )
  }
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bloomDemos.map((demo) => {
        const thumb = versionMap?.get(demo.name)
        const resolvedSlug = slugMap.get(demo.name) ?? demo.docsSlug
        const href = `/developers/docs/bloom/${version}/${resolvedSlug}`
        return (
          <Link
            key={demo.name}
            to={href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-primary/40 hover:shadow-lg"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-background">
              <ThumbnailImage light={thumb?.light} dark={thumb?.dark} alt={demo.name} />
            </div>
            <div className="flex flex-col gap-1 border-t border-border p-4">
              <span className="text-base font-semibold text-foreground group-hover:text-primary">
                {demo.name}
              </span>
              <span className="text-sm text-muted-foreground line-clamp-2">
                {demo.description}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
