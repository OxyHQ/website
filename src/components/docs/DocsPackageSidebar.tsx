import { useMemo, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { buildDocsHref, getPackages } from '../../content/docs-loader'
import type { SyncedPackage, SyncedPage, SyncedVersion } from '../../../scripts/types'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { getPackageLogo } from './getPackageLogo'
import {
  categoryLabels,
  categoryOrder,
  type SidebarGroup,
  type SidebarNode,
  type SidebarPackage,
  type SidebarSection,
} from './docsTypes'

function pageHref(pkg: SyncedPackage, version: string, slug: string): string {
  return buildDocsHref(pkg, version, slug)
}

/**
 * Map a slug segment to a human-readable label. Split on `-` / `_`,
 * capitalize the first word, lowercase the rest, and join with spaces.
 * Examples: `functions` → `Functions`, `type-aliases` → `Type aliases`.
 */
function formatGroupLabel(segment: string): string {
  const words = segment.split(/[-_]/).filter((w) => w.length > 0)
  if (words.length === 0) return segment
  const head = words[0]
  const headCased = head.charAt(0).toUpperCase() + head.slice(1).toLowerCase()
  if (words.length === 1) return headCased
  const tail = words.slice(1).map((w) => w.toLowerCase()).join(' ')
  return `${headCased} ${tail}`
}

/**
 * Build a tree of `SidebarNode`s from a flat list of synced pages by
 * splitting each slug on `/`. Non-final segments become groups; the page
 * itself is attached as a leaf at the terminal segment.
 *
 * The intermediate tree is built with insertion-order `Map`s so each child
 * segment appears exactly once (no parallel `orderedKeys` array — that was
 * the source of duplicate group rows). When a leaf's segment later turns
 * out to also host children (e.g. an `api` README plus deeper pages under
 * `api/functions/...`), we convert the leaf to a group in-place — the
 * `Map` slot is reused, preserving insertion order.
 */
function buildPageTree(pkg: SyncedPackage, version: SyncedVersion): SidebarNode[] {
  interface TreeGroup {
    /** Raw slug segment (pre-formatting). */
    segment: string
    /** Stable key — `pkg.shortName` + fullPath, or `pkg.shortName` for root. */
    key: string
    /** Insertion-ordered children. */
    children: Map<string, TreeNode>
    /**
     * Optional page anchored at this group's own slug (e.g. the `api`
     * README that sits at the same path as the `api/` group). Rendered as
     * an `Overview` entry when present.
     */
    page?: SyncedPage
  }
  interface TreeLeafEntry {
    label: string
    href: string
    slug: string
  }
  type TreeNode =
    | { kind: 'leaf'; leaf: TreeLeafEntry }
    | { kind: 'group'; group: TreeGroup }

  const root: TreeGroup = {
    segment: '',
    key: pkg.shortName,
    children: new Map(),
  }

  function ensureGroup(parent: TreeGroup, segment: string, fullPath: string): TreeGroup {
    const existing = parent.children.get(segment)
    if (existing && existing.kind === 'group') {
      return existing.group
    }
    const group: TreeGroup = {
      segment,
      key: `${pkg.shortName}/${fullPath}`,
      children: new Map(),
    }
    // If `existing` is a leaf, promote it: the page becomes the new group's
    // anchor (rendered as "Overview" below). `Map.set` on an existing key
    // overwrites the value while keeping the original insertion slot.
    if (existing && existing.kind === 'leaf') {
      const synced = version.pages.find((p) => p.slug === existing.leaf.slug)
      if (synced) group.page = synced
    }
    parent.children.set(segment, { kind: 'group', group })
    return group
  }

  for (const page of version.pages) {
    if (!page.slug) {
      // Index page — anchored at the root group; the package row links to it.
      root.page = page
      continue
    }
    const segments = page.slug.split('/').filter((s) => s.length > 0)
    if (segments.length === 0) continue
    let node: TreeGroup = root
    for (let i = 0; i < segments.length - 1; i += 1) {
      const segment = segments[i]
      const fullPath = segments.slice(0, i + 1).join('/')
      node = ensureGroup(node, segment, fullPath)
    }
    const lastSegment = segments[segments.length - 1]
    const leaf: TreeLeafEntry = {
      label: page.title,
      href: pageHref(pkg, version.version, page.slug),
      slug: page.slug,
    }
    const existing = node.children.get(lastSegment)
    if (existing && existing.kind === 'group') {
      // Deeper pages were processed first — this page sits at the group's
      // own slug. Anchor it as the group's overview page.
      existing.group.page = page
      continue
    }
    // Either no existing entry, or an existing leaf at the same slug
    // (duplicate — last write wins, matching the input order).
    node.children.set(lastSegment, { kind: 'leaf', leaf })
  }

  function materialize(group: TreeGroup): SidebarNode[] {
    const out: SidebarNode[] = []
    for (const [, child] of group.children) {
      if (child.kind === 'leaf') {
        out.push({
          kind: 'leaf',
          label: child.leaf.label,
          href: child.leaf.href,
          slug: child.leaf.slug,
        })
        continue
      }
      const childNodes = materialize(child.group)
      if (childNodes.length === 0 && !child.group.page) continue
      const overview = child.group.page
        ? {
            label: 'Overview',
            href: pageHref(pkg, version.version, child.group.page.slug),
            slug: child.group.page.slug,
          }
        : undefined
      const leafCount = countLeaves(childNodes) + (overview ? 1 : 0)
      out.push({
        kind: 'group',
        label: formatGroupLabel(child.group.segment),
        key: child.group.key,
        children: childNodes,
        leafCount,
        ...(overview ? { overview } : {}),
      })
    }
    return out
  }

  return materialize(root)
}

function countLeaves(nodes: SidebarNode[]): number {
  let total = 0
  for (const node of nodes) {
    if (node.kind === 'leaf') total += 1
    else total += node.leafCount
  }
  return total
}

/**
 * Common-prefix elimination: if a node has exactly one non-leaf child and
 * no leaf children, drop the wrapper and recurse into the child. Applied
 * to the package's children so `api/functions/...` shows up directly as
 * `Functions` under the package row — the `api/` wrapper is redundant
 * when every page sits under it.
 */
function collapseSingleWrapper(nodes: SidebarNode[]): SidebarNode[] {
  let current = nodes
  while (
    current.length === 1 &&
    current[0].kind === 'group' &&
    !current.some((n) => n.kind === 'leaf')
  ) {
    const only = current[0]
    if (only.kind !== 'group') break
    current = only.children
  }
  return current.map((n) =>
    n.kind === 'group'
      ? ({ ...n, children: collapseSingleWrapper(n.children) } as SidebarGroup)
      : n,
  )
}

/**
 * Build a docs sidebar grouped by category. Every package emits its own
 * page-tree (after common-prefix elimination) so any package row can be
 * expanded in place via its chevron without first navigating into the
 * package. The active package's tree is auto-expanded by the renderer
 * via `collectActivePath`; non-active packages stay collapsed until the
 * user clicks their chevron.
 */
// Co-located with the sidebar component because it shares the tree-building
// helpers above. Fast refresh isn't relevant for this pure function — it has
// no React state to preserve across edits.
// eslint-disable-next-line react-refresh/only-export-components
export function buildSidebar(
  activePkg?: SyncedPackage,
  activeVersion?: SyncedVersion,
): SidebarSection[] {
  const sections: SidebarSection[] = []
  const grouped = new Map<SyncedPackage['category'], SyncedPackage[]>()
  for (const pkg of getPackages()) {
    const list = grouped.get(pkg.category) ?? []
    list.push(pkg)
    grouped.set(pkg.category, list)
  }
  for (const cat of categoryOrder) {
    const pkgs = grouped.get(cat)
    if (!pkgs || pkgs.length === 0) continue
    const nodes: SidebarPackage[] = []
    for (const pkg of pkgs) {
      const isActive = activePkg?.shortName === pkg.shortName
      const version =
        isActive && activeVersion
          ? activeVersion
          : pkg.versions.find((v) => v.version === pkg.latestVersion) ??
            pkg.versions.find((v) => v.version === pkg.defaultVersion) ??
            pkg.versions[0]
      if (!version) continue
      const children = collapseSingleWrapper(buildPageTree(pkg, version))
      nodes.push({
        kind: 'package',
        label: pkg.displayName,
        href: pageHref(pkg, version.version, ''),
        shortName: pkg.shortName,
        key: pkg.shortName,
        children,
        leafCount: countLeaves(children),
      })
    }
    if (nodes.length === 0) continue
    sections.push({ category: cat, title: categoryLabels[cat], nodes })
  }
  return sections
}

/**
 * Walk `nodes` and collect the keys of every group/package that lies on
 * the path from the root to a leaf matching `activePath`. Used to seed
 * the initial expand state so the active page is always visible without
 * forcing every group open.
 *
 * When a package row is itself the active path (i.e. user is on the
 * package's overview / landing page rather than a deep page), the whole
 * sub-tree of that package is expanded — every descendant group key is
 * added — so users see the full table of contents on first paint. For
 * deep leaves only the ancestor groups are expanded.
 */
function collectActivePath(nodes: SidebarNode[], activePath: string): Set<string> {
  const out = new Set<string>()
  function addAllGroupKeys(children: SidebarNode[]): void {
    for (const child of children) {
      if (child.kind === 'leaf') continue
      out.add(child.key)
      addAllGroupKeys(child.children)
    }
  }
  function visit(node: SidebarNode): boolean {
    if (node.kind === 'leaf') {
      return node.href === activePath
    }
    const selfMatches = node.kind === 'package' && node.href === activePath
    let containsActive = selfMatches
    for (const child of node.children) {
      if (visit(child)) containsActive = true
    }
    if (containsActive) out.add(node.key)
    // If the package row itself is the active path (overview landing),
    // expand every descendant group so the full TOC is visible. This
    // doesn't apply to inner groups — we want deep-page navigation to
    // only expand the ancestor path, not blow open every sibling group.
    if (selfMatches) addAllGroupKeys(node.children)
    return containsActive
  }
  for (const node of nodes) visit(node)
  return out
}

/* -------------------------- Sidebar UI -------------------------------- */

/** Letter avatar fallback used when no logo asset exists for a package. */
function PackageLogo({ shortName, label }: { shortName: string; label: string }) {
  const src = getPackageLogo(shortName)
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="size-5 shrink-0 rounded-md object-contain"
        loading="lazy"
        decoding="async"
      />
    )
  }
  const letter = label.replace(/^@[^/]+\//, '').charAt(0).toUpperCase() || '?'
  return (
    <span
      aria-hidden="true"
      className="size-5 shrink-0 inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-medium leading-none"
    >
      {letter}
    </span>
  )
}

/**
 * Indent class for a tree node at the given depth. Depth 0 (top-level) uses
 * `pl-4`; each additional level adds 4 Tailwind spacing units. Listed
 * explicitly so the Tailwind JIT scanner sees every class string.
 */
const depthPaddingClasses: Record<number, string> = {
  0: 'pl-4',
  1: 'pl-8',
  2: 'pl-12',
  3: 'pl-16',
  4: 'pl-20',
  5: 'pl-24',
  6: 'pl-28',
  7: 'pl-32',
}

function paddingForDepth(depth: number): string {
  const cls = depthPaddingClasses[depth]
  if (cls) return cls
  // Beyond the predefined range, fall back to the deepest known class to
  // avoid generating arbitrary class names the JIT may not pick up.
  return depthPaddingClasses[7] ?? 'pl-4'
}

function childKey(child: SidebarNode): string {
  if (child.kind === 'leaf') return `leaf:${child.href}`
  if (child.kind === 'group') return `group:${child.key}`
  return `package:${child.key}`
}

function SidebarTreeNode({
  node,
  depth,
  expanded,
  toggle,
  activePath,
}: {
  node: SidebarNode
  depth: number
  expanded: ReadonlySet<string>
  toggle: (key: string) => void
  activePath: string
}) {
  if (node.kind === 'leaf') {
    const isActive = activePath === node.href
    const pad = paddingForDepth(depth)
    return (
      <li>
        <NavLink
          className={
            isActive
              ? `group flex items-start pr-3 py-1.5 ${pad} cursor-pointer gap-x-3 text-left break-words hyphens-auto rounded-xl w-full outline-offset-[-1px] bg-primary/10 text-primary [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]`
              : `group flex items-start pr-3 py-1.5 ${pad} cursor-pointer gap-x-3 text-left rounded-xl w-full outline-offset-[-1px] hover:bg-surface text-muted-foreground hover:text-foreground`
          }
          to={node.href}
        >
          <div className="flex-1 flex items-start space-x-2.5">
            <div className="break-words [word-break:break-word]">{node.label}</div>
          </div>
        </NavLink>
      </li>
    )
  }
  if (node.kind === 'package') {
    // The package row is a NavLink (logo + label) that navigates to the
    // package overview, with an optional sibling chevron button that
    // toggles the sub-tree in place. The two are siblings (not nested) so
    // clicking the chevron never triggers navigation. Hover styling is
    // shared across the row via a peer-group pattern using `group/row`.
    const isActive = activePath === node.href
    const pad = paddingForDepth(depth)
    // Show a chevron when the package has any non-leaf descendant, or more
    // than one child total — i.e. anything worth expanding. A single leaf
    // child stands on its own without an extra wrapper toggle.
    const hasGroup = node.children.some((c) => c.kind !== 'leaf')
    const hasChevron = hasGroup || node.children.length > 1
    const isOpen = expanded.has(node.key)
    const showChildren = node.children.length > 0 && (!hasChevron || isOpen)
    return (
      <li>
        <div
          className={
            isActive
              ? `group/row flex items-stretch rounded-xl bg-primary/10 text-primary [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]`
              : `group/row flex items-stretch rounded-xl hover:bg-surface text-muted-foreground hover:text-foreground`
          }
        >
          <NavLink
            to={node.href}
            className={`flex-1 min-w-0 flex items-start ${hasChevron ? 'pr-2' : 'pr-3'} py-1.5 ${pad} cursor-pointer gap-x-3 text-left break-words hyphens-auto rounded-xl outline-offset-[-1px]`}
          >
            <div className="flex-1 flex items-start space-x-2.5">
              <PackageLogo shortName={node.shortName} label={node.label} />
              <div className="break-words [word-break:break-word]">{node.label}</div>
            </div>
          </NavLink>
          {hasChevron ? (
            <button
              type="button"
              onClick={() => toggle(node.key)}
              aria-expanded={isOpen}
              aria-label={`Toggle ${node.label} pages`}
              className="shrink-0 flex items-center justify-center pr-3 pl-2 py-1.5 rounded-xl cursor-pointer"
            >
              <ChevronDownIcon
                className={
                  isOpen
                    ? 'rotate-0 transition-transform text-muted-foreground group-hover/row:text-foreground'
                    : '-rotate-90 transition-transform text-muted-foreground group-hover/row:text-foreground'
                }
              />
            </button>
          ) : null}
        </div>
        {showChildren ? (
          <ul className="space-y-px mt-px">
            {node.children.map((child) => (
              <SidebarTreeNode
                key={childKey(child)}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
                activePath={activePath}
              />
            ))}
          </ul>
        ) : null}
      </li>
    )
  }
  const isOpen = expanded.has(node.key)
  const pad = paddingForDepth(depth)
  return (
    <li>
      <button
        type="button"
        onClick={() => toggle(node.key)}
        aria-expanded={isOpen}
        className={`group flex items-center justify-between pr-3 py-1.5 ${pad} cursor-pointer gap-x-3 text-left rounded-xl w-full outline-offset-[-1px] hover:bg-surface text-muted-foreground hover:text-foreground`}
      >
        <span className="break-words [word-break:break-word]">{node.label}</span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground/70 tabular-nums">({node.leafCount})</span>
          <ChevronDownIcon
            className={
              isOpen
                ? 'rotate-0 transition-transform text-muted-foreground group-hover:text-foreground'
                : '-rotate-90 transition-transform text-muted-foreground group-hover:text-foreground'
            }
          />
        </span>
      </button>
      {isOpen ? (
        <ul className="space-y-px">
          {node.overview ? (
            <SidebarTreeNode
              key={`leaf:${node.overview.href}`}
              node={{
                kind: 'leaf',
                label: node.overview.label,
                href: node.overview.href,
                slug: node.overview.slug,
              }}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              activePath={activePath}
            />
          ) : null}
          {node.children.map((child) => (
            <SidebarTreeNode
              key={childKey(child)}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              activePath={activePath}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function DocsPackageSidebar({
  sections,
  activePkg,
  versionSelector,
}: {
  sections: SidebarSection[]
  activePkg?: SyncedPackage
  versionSelector?: ReactNode
}) {
  const location = useLocation()
  // Default expansion: only the category containing the active package is
  // expanded; all others collapsed. Computed once per `activePkg`/`sections`
  // shape change via `useMemo` — no `useEffect`.
  const initialExpanded = useMemo<Record<SyncedPackage['category'], boolean>>(() => {
    const out: Record<SyncedPackage['category'], boolean> = {
      'ui-library': false,
      sdk: false,
      app: false,
      service: false,
    }
    if (activePkg) {
      out[activePkg.category] = true
    } else if (sections.length > 0) {
      // No active package (e.g. docs hub) — expand the first non-empty section
      // so the sidebar isn't entirely closed on first load.
      out[sections[0].category] = true
    }
    return out
  }, [activePkg, sections])
  const [expanded, setExpanded] =
    useState<Record<SyncedPackage['category'], boolean>>(initialExpanded)

  function toggle(cat: SyncedPackage['category']) {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Independent expand state for tree branches inside each section. The
  // initial set contains every branch on the path from the section root
  // down to the active page, so the active link is visible on first paint
  // without forcing every other branch open.
  const activePathKeys = useMemo<Set<string>>(() => {
    const out = new Set<string>()
    for (const section of sections) {
      for (const key of collectActivePath(section.nodes, location.pathname)) {
        out.add(key)
      }
    }
    return out
  }, [sections, location.pathname])
  const [treeExpanded, setTreeExpanded] = useState<Set<string>>(activePathKeys)
  // Derived-state pattern (no useEffect): on pathname change, merge the new
  // active-path keys into the user's expand set so navigating to a new
  // package auto-expands its tree without clobbering the user's own toggles.
  const [prevPathname, setPrevPathname] = useState<string>(location.pathname)
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    setTreeExpanded((prev) => {
      const next = new Set(prev)
      for (const key of activePathKeys) next.add(key)
      return next
    })
  }

  function toggleTree(key: string) {
    setTreeExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <aside className="hidden lg:block w-[19.5rem] shrink-0 border-r border-border">
      <div className="sticky top-[calc(var(--site-header-height,64px)+48px)] h-[calc(100vh-var(--site-header-height,64px)-48px)] overflow-y-auto relative text-sm leading-6 pt-6 pb-10 pl-6 pr-6">
        {versionSelector ? <div className="mb-5 pl-1">{versionSelector}</div> : null}
        {sections.map((section, sectionIdx) => {
          const isOpen = expanded[section.category]
          return (
            <div key={section.category} className={sectionIdx === 0 ? '' : 'mt-6'}>
              <button
                type="button"
                onClick={() => toggle(section.category)}
                aria-expanded={isOpen}
                className="w-full mb-2.5 flex items-center justify-between pl-4 pr-3 py-1 rounded-lg hover:bg-surface group"
              >
                <span className="font-semibold text-foreground text-left">{section.title}</span>
                <ChevronDownIcon
                  className={
                    isOpen
                      ? 'rotate-0 transition-transform text-muted-foreground group-hover:text-foreground'
                      : '-rotate-90 transition-transform text-muted-foreground group-hover:text-foreground'
                  }
                />
              </button>
              {isOpen ? (
                <ul className="space-y-px">
                  {section.nodes.map((node) => (
                    <SidebarTreeNode
                      key={childKey(node)}
                      node={node}
                      depth={0}
                      expanded={treeExpanded}
                      toggle={toggleTree}
                      activePath={location.pathname}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
