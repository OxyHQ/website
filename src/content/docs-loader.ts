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

/**
 * Resolve the "active" version for a package given a (possibly absent) user-
 * requested version. Always returns a `SyncedVersion` if the package has
 * any versions at all — falls back to `latestVersion`, then `defaultVersion`,
 * then the first listed version. Callers can rely on this to never throw.
 */
export function resolveVersion(
  pkg: SyncedPackage,
  requested?: string,
): SyncedVersion | undefined {
  if (requested) {
    const match = getVersion(pkg, requested)
    if (match) return match
  }
  const latest =
    getVersion(pkg, pkg.latestVersion) ?? getVersion(pkg, pkg.defaultVersion)
  return latest ?? pkg.versions[0]
}

/**
 * Build a docs URL for a given package + version + slug. Versioned packages
 * carry the version segment; non-versioned packages use the flat form. Pass
 * `'latest'` as `version` to render the canonical path with no version
 * segment (always points at the resolved latest version).
 */
export function buildDocsHref(
  pkg: SyncedPackage,
  version: string | 'latest',
  slug = '',
): string {
  const base = '/developers/docs'
  const cleanSlug = slug.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!pkg.versioned || version === 'latest') {
    return cleanSlug ? `${base}/${pkg.shortName}/${cleanSlug}` : `${base}/${pkg.shortName}`
  }
  return cleanSlug
    ? `${base}/${pkg.shortName}/${version}/${cleanSlug}`
    : `${base}/${pkg.shortName}/${version}`
}

export function getPage(version: SyncedVersion, slug: string): SyncedPage | undefined {
  const normalized = slug.replace(/\/+$/, '')
  return version.pages.find((p) => p.slug === normalized)
}

/** True when `version` is listed in the package's `deprecatedVersions`. */
export function isVersionDeprecated(pkg: SyncedPackage, version: string): boolean {
  return pkg.deprecatedVersions.includes(version)
}

/** True when `version` is older than `latestVersion` (string compare on the version slug). */
export function isVersionOutdated(pkg: SyncedPackage, version: string): boolean {
  if (!pkg.versioned) return false
  return version !== pkg.latestVersion
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
