import type { SyncedPackage, SyncedVersion } from '../../../scripts/types'

/* ------------------------------ Constants ----------------------------- */

export const categoryLabels: Record<SyncedPackage['category'], string> = {
  'ui-library': 'UI Library',
  sdk: 'SDK',
  app: 'Apps',
  service: 'Services',
}

export const categoryOrder: Array<SyncedPackage['category']> = [
  'ui-library',
  'sdk',
  'app',
  'service',
]

/* ------------------------------ Helpers ------------------------------- */

export interface PackageRoute {
  kind: 'page'
  pkg: SyncedPackage
  version: SyncedVersion
  slug: string
}

/**
 * A leaf in the sidebar tree — a clickable link to a synced docs page.
 */
export interface SidebarLeaf {
  kind: 'leaf'
  /** Display label (page title). */
  label: string
  /** Full router href. */
  href: string
  /**
   * Full page slug. Used to compute the default-expanded set of branches
   * that lead to the active page.
   */
  slug: string
}

/**
 * A group in the sidebar tree — a non-leaf segment (e.g. `functions` or
 * `classes`) that groups one or more child nodes. Renders as a chevron
 * button + child list.
 */
export interface SidebarGroup {
  kind: 'group'
  /** Human-readable label (title-cased segment, e.g. `Functions`). */
  label: string
  /**
   * Stable identifier composed of the package shortName plus the full path
   * from the package root (e.g. `bloom/api/functions`). Doubles as the React
   * key and the expand-state key for `useState<Set<string>>`.
   */
  key: string
  children: SidebarNode[]
  /** Total leaf descendants under this group (recursive). */
  leafCount: number
  /**
   * Optional page that sits at the group's own slug (e.g. an `api` README
   * at `slug='api'` alongside `slug='api/functions/*'` pages). When set,
   * the renderer prepends an `Overview` link as the group's first child.
   * Tracked separately from `children` so common-prefix elimination can
   * discard the wrapper page cleanly without scanning for synthetic leaves.
   */
  overview?: { label: string; href: string; slug: string }
}

/**
 * A package row — always rendered as a `NavLink` with the package logo.
 * When the package is the active one, it owns its sub-tree as nested
 * children rendered indented below the row.
 */
export interface SidebarPackage {
  kind: 'package'
  /** Display label (package displayName, e.g. `@oxyhq/auth`). */
  label: string
  /** Full router href to the package index page. */
  href: string
  /** Owning package shortName — used by `PackageLogo`. */
  shortName: string
  /** Stable identifier (the package shortName). */
  key: string
  /**
   * Sub-tree of the package's pages. Empty for collapsed (non-active)
   * packages. Non-empty for the active package — rendered as nested
   * children of the package row.
   */
  children: SidebarNode[]
  /** Total leaf descendants in `children` (recursive). */
  leafCount: number
}

export type SidebarNode = SidebarPackage | SidebarGroup | SidebarLeaf

export interface SidebarSection {
  /** Stable category id (for tracking expand/collapse independent of label). */
  category: SyncedPackage['category']
  title: string
  /** Top-level package nodes in this section. */
  nodes: SidebarPackage[]
}

export type DocsRouteParams = Record<string, string | undefined> & {
  package?: string
  version?: string
  '*'?: string
}

/**
 * Result of resolving a docs URL.
 *
 * - `PackageRoute` — a real page exists at the requested slug; render it.
 * - `null` — the package itself doesn't exist; 404 to the docs hub.
 * - `'redirect'` — package exists but the URL needs a bounce (missing version,
 *   unknown slug, etc.). Renderer issues a `<Navigate>` to a canonical URL.
 * - `'empty'` — package + version exist but the version has zero published
 *   pages. Render a friendly placeholder inside the shell so the sidebar
 *   still renders. Cannot be expressed as `'redirect'` because the canonical
 *   URL for the package would be the same one we're already on — a redirect
 *   to ourselves causes an infinite render loop.
 */
export type ResolveResult =
  | PackageRoute
  | { kind: 'empty'; pkg: SyncedPackage; version: SyncedVersion }
  | null
  | 'redirect'
