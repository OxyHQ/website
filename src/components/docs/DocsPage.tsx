import { Suspense, createElement, lazy, useState } from 'react'
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
import type { SyncedPackage, SyncedVersion } from '../../../scripts/types'
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

interface SidebarSection {
  title: string
  items: Array<{ label: string; href: string }>
}

/**
 * Build a docs sidebar grouped by category. Each package appears under its
 * category, with its index page first and other slugs after. This is the
 * cross-package "everything" sidebar shown on every docs detail page so the
 * reader can jump between packages without going back to the hub.
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
    const items: SidebarSection['items'] = []
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
        for (const page of version.pages) {
          items.push({
            label: page.title,
            href: pageHref(pkg, version.version, page.slug),
          })
        }
      } else {
        items.push({
          label: pkg.displayName,
          href: pageHref(pkg, version.version, ''),
        })
      }
    }
    if (items.length === 0) continue
    sections.push({ title: categoryLabels[cat], items })
  }
  return sections
}

/* -------------------------- Sidebar UI -------------------------------- */

function DocsSidebar({
  sections,
  activePkg,
}: {
  sections: SidebarSection[]
  activePkg?: SyncedPackage
}) {
  const location = useLocation()
  return (
    <aside className="hidden lg:block w-[19.5rem] shrink-0 border-r border-border">
      <div className="sticky top-[calc(var(--site-header-height,64px)+48px)] h-[calc(100vh-var(--site-header-height,64px)-48px)] overflow-y-auto relative text-sm leading-6 pt-6 pb-10 pl-6 pr-6">
        {sections.map((section, sectionIdx) => (
          <div key={section.title} className={sectionIdx === 0 ? '' : 'mt-8'}>
            <h5 className="mb-2.5 font-semibold text-foreground pl-4">{section.title}</h5>
            <ul className="space-y-px">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href
                const isActivePackageHeader =
                  activePkg !== undefined &&
                  !isActive &&
                  item.href.startsWith(`/developers/docs/${activePkg.shortName}/`)
                return (
                  <li key={item.label + item.href}>
                    <NavLink
                      className={
                        isActive
                          ? 'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left break-words hyphens-auto rounded-xl w-full outline-offset-[-1px] bg-primary/10 text-primary [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]'
                          : isActivePackageHeader
                            ? 'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left rounded-xl w-full outline-offset-[-1px] hover:bg-surface text-foreground'
                            : 'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left rounded-xl w-full outline-offset-[-1px] hover:bg-surface text-muted-foreground hover:text-foreground'
                      }
                      to={item.href}
                    >
                      <div className="flex-1 flex items-start space-x-2.5">
                        <div className="break-words [word-break:break-word]">{item.label}</div>
                      </div>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
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

interface OpenApiSpec {
  openapi?: string
  info?: { title?: string }
}

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
  if (!pageExists) return 'redirect'
  return { pkg, version, slug: splat }
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
    const sections = buildSidebar(apiPkg ?? undefined)
    return (
      <DocsShell
        sections={sections}
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
  sections: SidebarSection[]
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
        <DocsSidebar sections={sections} activePkg={activePkg} />

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

