import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import indexJson from './_synced/index.json'
import type { SyncedIndex, SyncedPackage, SyncedPage, SyncedVersion } from '../../scripts/types'

const index = indexJson as SyncedIndex

// Vite glob: eager so package landing pages can show whatever exists, lazy so
// big leaf pages don't bloat the initial chunk. We get both: an eager
// metadata map (for sidebars) and a lazy module loader (for rendering).
const lazyMdx = import.meta.glob<{ default: ComponentType<Record<string, unknown>> }>(
  './_synced/**/*.{mdx,md}',
)

// Pre-bound `React.lazy` components, keyed by the MDX file's relative path
// (matching the `file` field on `SyncedPage`). Building the lazy wrappers at
// module init keeps component identities stable across renders — which is
// what `react-hooks/static-components` (and React Compiler) expects.
const lazyComponents = new Map<string, LazyExoticComponent<ComponentType<Record<string, unknown>>>>()
for (const key of Object.keys(lazyMdx)) {
  const loader = lazyMdx[key]
  if (!loader) continue
  // Strip the `./_synced/` prefix to match `SyncedPage.file`.
  const file = key.replace(/^\.\/_synced\//, '')
  lazyComponents.set(file, lazy(loader))
}

export function getIndex(): SyncedIndex {
  return index
}

export function getPackages(): SyncedPackage[] {
  return index.packages
}

export function getPackage(shortName: string): SyncedPackage | undefined {
  return index.packages.find((p) => p.shortName === shortName)
}

export function getVersion(pkg: SyncedPackage, version: string): SyncedVersion | undefined {
  return pkg.versions.find((v) => v.version === version)
}

export function getPage(version: SyncedVersion, slug: string): SyncedPage | undefined {
  const normalized = slug.replace(/\/+$/, '')
  return version.pages.find((p) => p.slug === normalized)
}

export function loadMdx(file: string): (() => Promise<{ default: ComponentType<Record<string, unknown>> }>) | null {
  // The glob keys are prefixed with `./_synced/`. The `file` we store is
  // already relative to `_synced/`, so we prepend.
  const key = `./_synced/${file}`
  const loader = lazyMdx[key]
  return loader ?? null
}

/**
 * Pre-bound `React.lazy` components keyed by MDX file path. Component
 * identities are stable for the lifetime of the module so consumers can read
 * the entry into a local and render it without violating the
 * `react-hooks/static-components` rule (which forbids creating a component
 * inside render).
 */
export type MdxLazyComponent = LazyExoticComponent<ComponentType<Record<string, unknown>>>

export const mdxLazyComponents: ReadonlyMap<string, MdxLazyComponent> = lazyComponents
