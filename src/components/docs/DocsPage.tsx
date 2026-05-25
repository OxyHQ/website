import { Suspense, createElement, lazy, useMemo, useState } from 'react'
import { Navigate, NavLink, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MDXProvider } from '@mdx-js/react'
import { FEATURES } from '../../constants'
import {
  buildDocsHref,
  mdxLazyComponents,
  getPackage,
  getPage,
  getPackages,
  getVersion,
  resolveVersion,
} from '../../content/docs-loader'
import type { SyncedPackage, SyncedPage, SyncedVersion } from '../../../scripts/types'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { mdxComponents } from '../docs-platform/mdxComponentMap'
import DocsSearch from '../docs-platform/DocsSearch'
import VersionSelector from '../docs-platform/VersionSelector'
import VersionBanner from '../docs-platform/VersionBanner'
import DocsSubNav from './DocsSubNav'

/* ------------------------------ Constants ----------------------------- */

const categoryLabels: Record<SyncedPackage['category'], string> = {
  'ui-library': 'UI Library',
  sdk: 'SDK',
  app: 'Apps',
  service: 'Services',
}

const categoryOrder: Array<SyncedPackage['category']> = ['ui-library', 'sdk', 'app', 'service']

/* ------------------------------ Helpers ------------------------------- */

interface PackageRoute {
  pkg: SyncedPackage
  version: SyncedVersion
  slug: string
}

function pageHref(pkg: SyncedPackage, version: string, slug: string): string {
  return buildDocsHref(pkg, version, slug)
}

/**
 * Map a synced package's shortName to a public asset path. Returning
 * `undefined` triggers the letter-fallback avatar in `DocsSidebar`. Keep this
 * table in sync with the SVG/PNG files committed under
 * `public/images/apps/<shortName>.{svg,png}`.
 */
function getPackageLogo(shortName: string): string | undefined {
  const map: Record<string, string> = {
    accounts: '/images/apps/accounts.png',
    alia: '/images/apps/alia.svg',
    allo: '/images/apps/allo.png',
    astro: '/images/apps/astro.svg',
    auth: '/images/apps/auth.svg',
    clarity: '/images/apps/clarity.png',
    inbox: '/images/apps/inbox.png',
    oxyos: '/images/apps/oxyos.png',
  }
  return map[shortName]
}

/**
 * A leaf in the sidebar tree — a clickable link to a synced docs page or the
 * package's own landing row.
 */
interface SidebarLeaf {
  kind: 'leaf'
  /** Display label (page title, or package displayName for the package row). */
  label: string
  /** Full router href. */
  href: string
  /** Owning package shortName — used by `PackageLogo`. */
  shortName: string
  /** True for the package-name row that opens the active package's tree. */
  isPackageHeader: boolean
  /**
   * Full page slug (only set when this leaf maps to a `SyncedPage`). Used to
   * compute the default-expanded set of branches that lead to the active page.
   * Empty string for the package header (index page).
   */
  slug: string
}

/**
 * A branch in the sidebar tree — a non-leaf segment (e.g. `api` or
 * `functions`) that groups one or more child nodes. Renders as a chevron
 * button + child list.
 */
interface SidebarBranch {
  kind: 'branch'
  /** Display label — the segment string (e.g. `functions`). */
  label: string
  /**
   * Stable identifier composed of the package shortName plus the full path
   * from the package root (e.g. `bloom/api/functions`). Doubles as the React
   * key and the expand-state key for `useState<Set<string>>`.
   */
  key: string
  children: SidebarNode[]
  /** Total leaf descendants under this branch (recursive). */
  leafCount: number
}

type SidebarNode = SidebarBranch | SidebarLeaf

interface SidebarSection {
  /** Stable category id (for tracking expand/collapse independent of label). */
  category: SyncedPackage['category']
  title: string
  /**
   * Top-level nodes for the section. For the active package this is the
   * tree of its synced pages; for collapsed packages it's a single leaf (the
   * package row).
   */
  nodes: SidebarNode[]
}

/**
 * Build a tree of `SidebarNode`s from a flat list of synced pages by
 * splitting each slug on `/`. Non-final segments become branches; the page
 * itself is attached as a leaf at the terminal segment.
 *
 * For packages whose slugs have zero slashes (the typical hand-written
 * docs case, e.g. services/`GETTING_STARTED`) the result is a flat list of
 * leaves and the UI is identical to the pre-tree behavior.
 */
function buildPageTree(pkg: SyncedPackage, version: SyncedVersion): SidebarNode[] {
  interface TreeBranch {
    label: string
    key: string
    children: Map<string, TreeNode>
    orderedKeys: string[]
    page?: SyncedPage
  }
  interface TreeLeaf {
    label: string
    href: string
    slug: string
    page: SyncedPage
  }
  type TreeNode =
    | { kind: 'leaf'; leaf: TreeLeaf }
    | { kind: 'branch'; branch: TreeBranch }

  const root: TreeBranch = {
    label: '',
    key: pkg.shortName,
    children: new Map(),
    orderedKeys: [],
  }

  function ensureBranch(parent: TreeBranch, segment: string, fullPath: string): TreeBranch {
    const existing = parent.children.get(segment)
    if (existing && existing.kind === 'branch') {
      return existing.branch
    }
    const branch: TreeBranch = {
      label: segment,
      key: `${pkg.shortName}/${fullPath}`,
      children: new Map(),
      orderedKeys: [],
    }
    parent.children.set(segment, { kind: 'branch', branch })
    parent.orderedKeys.push(segment)
    return branch
  }

  for (const page of version.pages) {
    if (!page.slug) {
      // Index page — anchor it at the root branch itself so the package
      // header can still link to it.
      root.page = page
      continue
    }
    const segments = page.slug.split('/')
    let node: TreeBranch = root
    for (let i = 0; i < segments.length - 1; i += 1) {
      const segment = segments[i]
      if (!segment) continue
      const fullPath = segments.slice(0, i + 1).join('/')
      node = ensureBranch(node, segment, fullPath)
    }
    const lastSegment = segments[segments.length - 1]
    if (!lastSegment) continue
    const leaf: TreeLeaf = {
      label: page.title,
      href: pageHref(pkg, version.version, page.slug),
      slug: page.slug,
      page,
    }
    // If a branch already exists with this segment (e.g. a node with both
    // children AND a leaf page at the same slug, like `api` having children
    // under it and `api` itself being a page), attach the leaf as the
    // branch's own page — render the branch header as a link.
    const existing = node.children.get(lastSegment)
    if (existing && existing.kind === 'branch') {
      existing.branch.page = page
      continue
    }
    if (existing) {
      // Duplicate slug — overwrite (last write wins, matches array order).
      node.children.set(lastSegment, { kind: 'leaf', leaf })
      continue
    }
    node.children.set(lastSegment, { kind: 'leaf', leaf })
    node.orderedKeys.push(lastSegment)
  }

  function materialize(branch: TreeBranch): SidebarNode[] {
    const out: SidebarNode[] = []
    for (const segment of branch.orderedKeys) {
      const node = branch.children.get(segment)
      if (!node) continue
      if (node.kind === 'leaf') {
        out.push({
          kind: 'leaf',
          label: node.leaf.label,
          href: node.leaf.href,
          shortName: pkg.shortName,
          isPackageHeader: false,
          slug: node.leaf.slug,
        })
        continue
      }
      const childNodes = materialize(node.branch)
      if (childNodes.length === 0) {
        // Branch ended up with no children — only possible when its only
        // page is its own (anchored at `page`). Render as a plain leaf.
        if (node.branch.page) {
          out.push({
            kind: 'leaf',
            label: node.branch.page.title,
            href: pageHref(pkg, version.version, node.branch.page.slug),
            shortName: pkg.shortName,
            isPackageHeader: false,
            slug: node.branch.page.slug,
          })
        }
        continue
      }
      // If the branch ALSO has a page at its own slug, prepend it as the
      // first child so users can navigate to the branch overview while
      // still seeing its subtree.
      let children = childNodes
      if (node.branch.page) {
        children = [
          {
            kind: 'leaf' as const,
            label: 'Overview',
            href: pageHref(pkg, version.version, node.branch.page.slug),
            shortName: pkg.shortName,
            isPackageHeader: false,
            slug: node.branch.page.slug,
          },
          ...childNodes,
        ]
      }
      const leafCount = children.reduce(
        (acc, c) => acc + (c.kind === 'leaf' ? 1 : c.leafCount),
        0,
      )
      out.push({
        kind: 'branch',
        label: node.branch.label,
        key: node.branch.key,
        children,
        leafCount,
      })
    }
    return out
  }

  return materialize(root)
}

/**
 * Build a docs sidebar grouped by category. Each package appears under its
 * category, with its index page first and other slugs after. This is the
 * cross-package "everything" sidebar shown on every docs detail page so the
 * reader can jump between packages without going back to the hub.
 *
 * For the active package the inner list is a tree (see `buildPageTree`) so
 * large typedoc-generated packages (bloom, core, auth-sdk) don't render as
 * unmanageable 500-row flat lists.
 */
function buildSidebar(activePkg?: SyncedPackage, activeVersion?: SyncedVersion): SidebarSection[] {
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
    const nodes: SidebarNode[] = []
    for (const pkg of pkgs) {
      const expanded = activePkg?.shortName === pkg.shortName
      const version =
        expanded && activeVersion
          ? activeVersion
          : pkg.versions.find((v) => v.version === pkg.latestVersion) ??
            pkg.versions.find((v) => v.version === pkg.defaultVersion) ??
            pkg.versions[0]
      if (!version) continue
      if (expanded) {
        // Render the package header itself first, then the synced page tree
        // beneath. The header acts as the link back to the package index.
        nodes.push({
          kind: 'leaf',
          label: pkg.displayName,
          href: pageHref(pkg, version.version, ''),
          shortName: pkg.shortName,
          isPackageHeader: true,
          slug: '',
        })
        for (const node of buildPageTree(pkg, version)) {
          // The package's own index page is already shown as the header
          // row above — skip it if it shows up at the root of the tree.
          if (node.kind === 'leaf' && node.slug === '') continue
          nodes.push(node)
        }
      } else {
        nodes.push({
          kind: 'leaf',
          label: pkg.displayName,
          href: pageHref(pkg, version.version, ''),
          shortName: pkg.shortName,
          isPackageHeader: true,
          slug: '',
        })
      }
    }
    if (nodes.length === 0) continue
    sections.push({ category: cat, title: categoryLabels[cat], nodes })
  }
  return sections
}

/**
 * Walk `nodes` and collect the keys of every branch that lies on the path
 * from the root to a leaf matching `activePath`. Used to seed the initial
 * expand state so the active page is always visible without forcing every
 * branch open.
 */
function collectActivePath(nodes: SidebarNode[], activePath: string): Set<string> {
  const out = new Set<string>()
  function visit(node: SidebarNode): boolean {
    if (node.kind === 'leaf') {
      return node.href === activePath
    }
    let containsActive = false
    for (const child of node.children) {
      if (visit(child)) containsActive = true
    }
    if (containsActive) out.add(node.key)
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
            {node.isPackageHeader ? (
              <PackageLogo shortName={node.shortName} label={node.label} />
            ) : null}
            <div className="break-words [word-break:break-word]">{node.label}</div>
          </div>
        </NavLink>
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
          {node.children.map((child) => (
            <SidebarTreeNode
              key={child.kind === 'leaf' ? `leaf:${child.href}` : `branch:${child.key}`}
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

function DocsSidebar({
  sections,
  activePkg,
}: {
  sections: SidebarSection[]
  activePkg?: SyncedPackage
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
  const initialTreeExpanded = useMemo<Set<string>>(() => {
    const out = new Set<string>()
    for (const section of sections) {
      for (const key of collectActivePath(section.nodes, location.pathname)) {
        out.add(key)
      }
    }
    return out
  }, [sections, location.pathname])
  const [treeExpanded, setTreeExpanded] = useState<Set<string>>(initialTreeExpanded)

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
                      key={node.kind === 'leaf' ? `leaf:${node.href}` : `branch:${node.key}`}
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

/* ------------------------- Page header UI ---------------------------- */

function CopyPageMenu() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyPage() {
    const content = document.querySelector('[data-docs-content]')?.textContent
    if (content) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className="relative items-center shrink-0 min-w-[156px] justify-end ml-auto sm:flex hidden"
      id="page-context-menu"
    >
      <button
        className="rounded-l-xl px-3 text-foreground py-1.5 border border-border bg-surface hover:bg-surface border-r-0"
        aria-label="Copy page"
        onClick={copyPage}
      >
        <div className="flex items-center gap-2 text-sm text-center font-medium">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
            <path d="M14.25 5.25H7.25C6.14543 5.25 5.25 6.14543 5.25 7.25V14.25C5.25 15.3546 6.14543 16.25 7.25 16.25H14.25C15.3546 16.25 16.25 15.3546 16.25 14.25V7.25C16.25 6.14543 15.3546 5.25 14.25 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.80103 11.998L1.77203 5.07397C1.61003 3.98097 2.36403 2.96397 3.45603 2.80197L10.38 1.77297C11.313 1.63397 12.19 2.16297 12.528 3.00097" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{copied ? 'Copied!' : 'Copy page'}</span>
        </div>
      </button>
      <button
        className="group disabled:pointer-events-none [&>span]:line-clamp-1 overflow-hidden flex items-center py-0.5 gap-1 text-sm text-white/50 group-hover:text-white/70 rounded-none rounded-r-xl border px-3 border-border aspect-square bg-surface hover:bg-surface"
        aria-label="More actions"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen(!open)}
      >
        <svg width="8" height="24" viewBox="0 -9 3 24" className="transition-transform text-muted-foreground overflow-visible group-hover:text-foreground rotate-90">
          <path d="M0 0L3 3L0 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-xl border border-border bg-surface shadow-[0px_4px_16px_rgba(0,0,0,0.4),0px_1px_4px_rgba(0,0,0,0.3)] py-1">
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface rounded-lg mx-1"
              style={{ width: 'calc(100% - 8px)' }}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setOpen(false)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Copy link
            </button>
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface rounded-lg mx-1"
              style={{ width: 'calc(100% - 8px)' }}
              onClick={() => {
                copyPage()
                setOpen(false)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Copy as Markdown
            </button>
            <div className="my-1 mx-3 h-px bg-white/[0.07]" />
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface rounded-lg mx-1"
              style={{ width: 'calc(100% - 8px)' }}
              onClick={() => {
                window.open(window.location.href, '_blank')
                setOpen(false)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open in new tab
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

/* -------------------------- API page body ----------------------------- */

/**
 * Minimal typed subset of the OpenAPI 3.x document. We only read the fields
 * needed to drive the REST API sidebar — Scalar parses the full document on
 * its own. Keep this type narrow and additive (`?` everywhere) so new
 * OpenAPI fields don't accidentally break the build.
 */
interface OpenApiOperation {
  tags?: string[]
  operationId?: string
  summary?: string
  description?: string
  deprecated?: boolean
}

interface OpenApiPathItem {
  get?: OpenApiOperation
  post?: OpenApiOperation
  put?: OpenApiOperation
  patch?: OpenApiOperation
  delete?: OpenApiOperation
  head?: OpenApiOperation
  options?: OpenApiOperation
  trace?: OpenApiOperation
}

interface OpenApiTag {
  name: string
  description?: string
}

interface OpenApiSpec {
  openapi?: string
  info?: { title?: string }
  paths?: Record<string, OpenApiPathItem>
  tags?: OpenApiTag[]
}

/** HTTP methods rendered as operations in the API sidebar. */
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const
type HttpMethod = (typeof HTTP_METHODS)[number]

// Eager glob: every synced OpenAPI doc gets compiled into the SPA chunk so
// version switches don't trigger a network round-trip.
const specLoaders = import.meta.glob<{ default: OpenApiSpec }>(
  '../../content/_synced/api/*/openapi.json',
)

function loaderFor(version: string): (() => Promise<{ default: OpenApiSpec }>) | null {
  const key = `../../content/_synced/api/${version}/openapi.json`
  return specLoaders[key] ?? null
}

const ApiReferenceReact = lazy(() =>
  import('@scalar/api-reference-react').then((m) => ({ default: m.ApiReferenceReact })),
)

function ApiBody({ version }: { version: string }) {
  const specQuery = useQuery({
    queryKey: ['docs-api-spec', version],
    queryFn: async () => {
      const loader = loaderFor(version)
      if (!loader) throw new Error(`No OpenAPI document for version "${version}".`)
      const mod = await loader()
      return mod.default
    },
    staleTime: Infinity,
  })

  const spec = specQuery.data ?? null
  const error = specQuery.error instanceof Error ? specQuery.error.message : null

  if (error) {
    return (
      <div className="not-prose rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">API reference unavailable</h2>
        <p className="text-sm text-muted-foreground">
          Run <code>bun scripts/sync-docs.ts</code> from the website root after generating the
          OpenAPI document inside <code>packages/api</code>.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Detail: {error}</p>
      </div>
    )
  }
  if (!spec) {
    return <div className="text-sm text-muted-foreground">Loading API reference…</div>
  }
  return (
    <div className="-mx-6 lg:-mx-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <ApiReferenceReact configuration={{ spec: { content: spec } }} />
      </Suspense>
    </div>
  )
}

/* -------------------------- API sidebar ------------------------------ */

interface ApiOperationEntry {
  method: HttpMethod
  path: string
  /** Tag used to group this operation. Falls back to `'Misc'` when absent. */
  tag: string
  summary?: string
  /**
   * Slugified anchor that matches the IDs Scalar generates for operations.
   * Format: `tag/{tag-slug}/{METHOD}{path}`. See
   * `node_modules/@scalar/workspace-store/dist/navigation/get-navigation-options.js`.
   */
  anchor: string
}

interface ApiTagGroup {
  /** Tag display name. */
  name: string
  /** Slugified anchor for the tag header itself. */
  anchor: string
  description?: string
  operations: ApiOperationEntry[]
}

/**
 * Minimal Scalar-compatible slugifier. Scalar uses
 * `@scalar/helpers/string/slugify` which lowercases the input and replaces
 * any sequence of whitespace, underscores or hyphens with a single `-`,
 * dropping anything that is not a Unicode letter/number. Reimplementing
 * that subset here keeps us off the dep graph and produces identical
 * anchors for the tag names we care about (all plain ASCII).
 */
function slugifyTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Build the OpenAPI-driven sidebar model from a parsed spec. Operations
 * are grouped by `op.tags[0]`; tags declared in the spec's top-level
 * `tags` array preserve their declared order, and any extra tags
 * referenced by operations but not declared come last alphabetically.
 */
function buildApiSidebar(spec: OpenApiSpec): ApiTagGroup[] {
  const groups = new Map<string, ApiTagGroup>()

  function ensureGroup(name: string, description?: string): ApiTagGroup {
    const existing = groups.get(name)
    if (existing) {
      if (!existing.description && description) existing.description = description
      return existing
    }
    const created: ApiTagGroup = {
      name,
      anchor: `tag/${slugifyTag(name)}`,
      description,
      operations: [],
    }
    groups.set(name, created)
    return created
  }

  // Seed the declared tag order first so Authentication / Users / Profiles
  // surface at the top instead of in operation-discovery order.
  if (spec.tags) {
    for (const tag of spec.tags) {
      if (typeof tag.name === 'string' && tag.name.length > 0) {
        ensureGroup(tag.name, tag.description)
      }
    }
  }

  const paths = spec.paths ?? {}
  for (const [path, item] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const op = item[method]
      if (!op) continue
      const tagName = op.tags?.[0] ?? 'Misc'
      const group = ensureGroup(tagName)
      const tagSlug = slugifyTag(tagName)
      group.operations.push({
        method,
        path,
        tag: tagName,
        summary: op.summary,
        anchor: `tag/${tagSlug}/${method.toUpperCase()}${path}`,
      })
    }
  }

  // Drop empty tag groups (declared in `tags` but referenced by no
  // operation) and sort operations inside each group by path so the
  // sidebar reads in stable order regardless of `paths` key iteration.
  const result: ApiTagGroup[] = []
  for (const group of groups.values()) {
    if (group.operations.length === 0) continue
    group.operations.sort((a, b) => {
      if (a.path === b.path) return a.method.localeCompare(b.method)
      return a.path.localeCompare(b.path)
    })
    result.push(group)
  }
  return result
}

/**
 * Tailwind text-color classes for each HTTP method label in the sidebar.
 * Listed inline so the JIT scanner picks them up at build time.
 */
const httpMethodColor: Record<HttpMethod, string> = {
  get: 'text-emerald-500',
  post: 'text-sky-500',
  put: 'text-amber-500',
  patch: 'text-amber-500',
  delete: 'text-rose-500',
  head: 'text-muted-foreground',
  options: 'text-muted-foreground',
  trace: 'text-muted-foreground',
}

function ApiSidebar({ version }: { version: string }) {
  const location = useLocation()
  // Matches the existing pattern at `ApiBody` — cache the parsed spec per
  // version so flipping between operations doesn't re-parse it.
  const specQuery = useQuery({
    queryKey: ['api-sidebar', version],
    queryFn: async () => {
      const loader = loaderFor(version)
      if (!loader) throw new Error(`No OpenAPI document for version "${version}".`)
      const mod = await loader()
      return buildApiSidebar(mod.default)
    },
    staleTime: Infinity,
  })

  const groups = specQuery.data ?? null

  // Default-expand only the active tag (matched against the URL hash). If no
  // hash is present, expand the first group so the sidebar doesn't open
  // completely closed.
  const initialExpanded = useMemo<Set<string>>(() => {
    const out = new Set<string>()
    if (!groups) return out
    const hash = location.hash.replace(/^#/, '')
    let matched = false
    for (const group of groups) {
      if (hash.startsWith(group.anchor)) {
        out.add(group.name)
        matched = true
      }
    }
    if (!matched && groups[0]) out.add(groups[0].name)
    return out
  }, [groups, location.hash])
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded)

  function toggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const activeHash = location.hash.replace(/^#/, '')
  const hubHref = '/developers/docs'

  return (
    <aside className="hidden lg:block w-[19.5rem] shrink-0 border-r border-border">
      <div className="sticky top-[calc(var(--site-header-height,64px)+48px)] h-[calc(100vh-var(--site-header-height,64px)-48px)] overflow-y-auto relative text-sm leading-6 pt-6 pb-10 pl-6 pr-6">
        <NavLink
          to={hubHref}
          className="group flex items-center gap-x-2 mb-4 pr-3 py-1.5 pl-4 cursor-pointer text-left rounded-xl w-full outline-offset-[-1px] hover:bg-surface text-muted-foreground hover:text-foreground"
        >
          <ChevronDownIcon className="rotate-90 text-muted-foreground group-hover:text-foreground" />
          <span>Switch to package docs</span>
        </NavLink>

        {specQuery.isLoading ? (
          <div className="pl-4 text-sm text-muted-foreground">Loading API reference…</div>
        ) : null}
        {specQuery.error instanceof Error ? (
          <div className="pl-4 text-sm text-muted-foreground">
            API reference unavailable: {specQuery.error.message}
          </div>
        ) : null}
        {groups
          ? groups.map((group) => {
              const isOpen = expanded.has(group.name)
              return (
                <div key={group.name} className="mt-2">
                  <button
                    type="button"
                    onClick={() => toggle(group.name)}
                    aria-expanded={isOpen}
                    className="w-full mb-1 flex items-center justify-between pl-4 pr-3 py-1 rounded-lg hover:bg-surface group"
                  >
                    <span className="font-semibold text-foreground text-left">{group.name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground/70 tabular-nums">
                        ({group.operations.length})
                      </span>
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
                      {group.operations.map((op) => {
                        const href = `/developers/docs/api/${version}#${op.anchor}`
                        const isActive = activeHash === op.anchor
                        return (
                          <li key={`${op.method}:${op.path}`}>
                            <NavLink
                              to={href}
                              className={
                                isActive
                                  ? 'group flex items-center gap-x-2 pr-3 py-1.5 pl-8 cursor-pointer text-left rounded-xl w-full outline-offset-[-1px] bg-primary/10 text-primary [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]'
                                  : 'group flex items-center gap-x-2 pr-3 py-1.5 pl-8 cursor-pointer text-left rounded-xl w-full outline-offset-[-1px] hover:bg-surface text-muted-foreground hover:text-foreground'
                              }
                            >
                              <span
                                className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide w-12 ${httpMethodColor[op.method]}`}
                              >
                                {op.method}
                              </span>
                              <span className="font-mono text-xs break-all [word-break:break-word]">
                                {op.path}
                              </span>
                            </NavLink>
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </div>
              )
            })
          : null}
      </div>
    </aside>
  )
}

/* ------------------------- MDX page body ------------------------------ */

function MdxBody({ file }: { file: string }) {
  const lazyComponent = mdxLazyComponents.get(file)

  if (!lazyComponent) {
    return (
      <div className="not-prose rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted-foreground">
          Page content unavailable. The synced docs may be out of date — run{' '}
          <code>bun scripts/sync-docs.ts</code> from the website root.
        </p>
      </div>
    )
  }
  // `createElement` keeps the lazy component out of the JSX namespace, which
  // satisfies `react-hooks/static-components`. The components themselves are
  // built at module init in `docs-loader.ts` so identities stay stable across
  // renders.
  return (
    <MDXProvider components={mdxComponents}>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        {createElement(lazyComponent)}
      </Suspense>
    </MDXProvider>
  )
}

/* ---------------------------- Main page ------------------------------ */

type DocsRouteParams = Record<string, string | undefined> & {
  package?: string
  version?: string
  '*'?: string
}

function resolveRoute(params: DocsRouteParams): PackageRoute | null | 'redirect' {
  const shortName = params.package ?? ''
  if (!shortName) return null
  const pkg = getPackage(shortName)
  if (!pkg) return null

  const requestedVersion = params.version ?? ''
  const splat = (params['*'] ?? '').replace(/^\/+/, '').replace(/\/+$/, '')

  if (!pkg.versioned) {
    // Non-versioned package. React Router still binds `params.version` for
    // the `:package/:version` route, but for these packages that segment is
    // really part of the slug. Stitch it back onto the splat so a URL like
    // `/developers/docs/accounts/security/activity` resolves to the
    // `security/activity` slug under the package's lone version.
    const stitchedSlug = [requestedVersion, splat].filter(Boolean).join('/')
    const version = resolveVersion(pkg)
    if (!version) return null
    const page = getPage(version, stitchedSlug)
    if (page) return { pkg, version, slug: stitchedSlug }
    // No matching slug — if nothing was requested, fall through to the
    // index page; otherwise bounce to the package root.
    if (!stitchedSlug) {
      const index = getPage(version, '')
      if (index) return { pkg, version, slug: '' }
    }
    return 'redirect'
  }

  // Versioned package — the URL must include a real version segment.
  if (!requestedVersion) return 'redirect'
  const version = getVersion(pkg, requestedVersion)
  if (!version) return 'redirect'
  const pageExists = getPage(version, splat)
  if (pageExists) return { pkg, version, slug: splat }
  // No slug requested → render the package's first page as the overview.
  // Without this the route would redirect to itself and loop forever.
  if (!splat) {
    const firstPage = version.pages[0]
    if (firstPage) return { pkg, version, slug: firstPage.slug }
  }
  return 'redirect'
}

export default function DocsPage() {
  const params = useParams<DocsRouteParams>()
  const location = useLocation()

  // `/developers/docs/api[/:version]` — Scalar-rendered REST reference.
  const onApiRoute = location.pathname.startsWith('/developers/docs/api')

  if (onApiRoute) {
    const apiPkg = getPackage('api')
    const requestedVersion = typeof params.version === 'string' ? params.version : ''
    const resolvedVersion = apiPkg ? resolveVersion(apiPkg, requestedVersion) : undefined
    const version = resolvedVersion?.version ?? apiPkg?.latestVersion ?? 'main'
    return (
      <DocsShell
        sections={null}
        sidebar={<ApiSidebar version={version} />}
        eyebrow="REST API"
        title="API Reference"
        subtitle="Browse the OpenAPI-rendered reference for the Oxy platform REST API."
        pkg={apiPkg}
        currentVersion={version}
        slug=""
        activePkg={apiPkg ?? undefined}
      >
        <ApiBody version={version} />
      </DocsShell>
    )
  }

  const resolved = resolveRoute(params)

  if (resolved === null) {
    // Unknown package → 404 within docs surfaces; bounce to the hub.
    return <Navigate to="/developers/docs" replace />
  }
  if (resolved === 'redirect') {
    const fallbackPkg = params.package ? getPackage(params.package) : undefined
    const dest = fallbackPkg
      ? buildDocsHref(fallbackPkg, fallbackPkg.latestVersion, '')
      : '/developers/docs'
    return <Navigate to={dest} replace />
  }

  const { pkg, version, slug } = resolved
  const page = getPage(version, slug)
  if (!page) {
    // Defensive — resolveRoute guards this, but keep TypeScript narrowing happy.
    return <Navigate to={buildDocsHref(pkg, pkg.latestVersion, '')} replace />
  }
  const sections = buildSidebar(pkg, version)
  return (
    <DocsShell
      sections={sections}
      eyebrow={pkg.displayName}
      title={page.title}
      subtitle={page.description}
      pkg={pkg}
      currentVersion={version.version}
      slug={slug}
      activePkg={pkg}
    >
      <MdxBody file={page.file} />
    </DocsShell>
  )
}

/* --------------------------- Shared shell ----------------------------- */

interface DocsShellProps {
  /**
   * Pre-built section model for the package sidebar. Pass `null` together
   * with a `sidebar` element to render a custom sidebar (e.g. the
   * OpenAPI-driven REST API nav).
   */
  sections: SidebarSection[] | null
  /**
   * Optional sidebar override. When provided, replaces the default
   * `DocsSidebar` rendering — `sections` is ignored.
   */
  sidebar?: React.ReactNode
  eyebrow: string
  title: string
  subtitle?: string
  pkg?: SyncedPackage
  currentVersion?: string
  slug?: string
  activePkg?: SyncedPackage
  children: React.ReactNode
}

function DocsShell({
  sections,
  sidebar,
  eyebrow,
  title,
  subtitle,
  pkg,
  currentVersion,
  slug,
  activePkg,
  children,
}: DocsShellProps) {
  // The version selector only makes sense for packages that opted into
  // versioning AND ship more than one version. Non-versioned packages
  // never show it; single-version versioned packages also hide it so the
  // header stays clean until a second version ships.
  const showVersionSelector =
    pkg !== undefined &&
    currentVersion !== undefined &&
    pkg.versioned &&
    pkg.versions.length > 1
  return (
    <div className="relative antialiased">
      <DocsSubNav />

      <div className="container flex">
        {sidebar ?? (
          sections ? <DocsSidebar sections={sections} activePkg={activePkg} /> : null
        )}

        <div className="relative grow box-border flex-col w-full py-10 px-6 lg:px-12 min-w-0">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <DocsSearch variant="inline" />
            </div>
            {showVersionSelector && pkg && currentVersion ? (
              <VersionSelector pkg={pkg} currentVersion={currentVersion} slug={slug} />
            ) : null}
          </div>

          <header className="relative leading-none">
            <div className="mt-0.5 space-y-2.5">
              <div className="h-5 text-primary text-sm font-semibold">{eyebrow}</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center relative gap-2 min-w-0">
                <h1 className="text-2xl sm:text-3xl text-foreground tracking-tight [overflow-wrap:anywhere] font-bold break-all">
                  {title}
                </h1>
                <CopyPageMenu />
              </div>
            </div>
            {subtitle ? (
              <div className="mt-2 text-lg text-muted-foreground">
                <p>{subtitle}</p>
              </div>
            ) : null}
          </header>

          <div
            className="relative mt-8 mb-14 [contain:inline-size] isolate max-w-3xl prose prose-neutral dark:prose-invert text-foreground"
            data-docs-content
          >
            {pkg && currentVersion ? (
              <VersionBanner pkg={pkg} currentVersion={currentVersion} slug={slug} />
            ) : null}
            {children}
          </div>

          {FEATURES.SHOW_ARTICLE_FEEDBACK ? (
            <div className="pb-16 w-full flex flex-col gap-y-8 max-w-3xl">
              <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
                <p className="inline-block text-sm text-muted-foreground whitespace-nowrap">
                  Was this page helpful?
                </p>
                <div className="flex flex-wrap flex-grow gap-3 items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <button className="px-3.5 py-2 flex flex-row gap-3 items-center rounded-xl text-muted-foreground hover:text-foreground border border-border hover:border-input">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M7 10v12" />
                        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                      </svg>
                      <small className="text-sm font-normal leading-4">Yes</small>
                    </button>
                    <button className="px-3.5 py-2 flex flex-row gap-3 items-center rounded-xl text-muted-foreground hover:text-foreground border border-border hover:border-input">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M17 14V2" />
                        <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
                      </svg>
                      <small className="text-sm font-normal leading-4">No</small>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

