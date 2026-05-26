import type { SyncedPackage } from '../../../scripts/types'
import { FEATURES } from '../../constants'
import DocsSearch from '../docs-platform/DocsSearch'
import VersionSelector from '../docs-platform/VersionSelector'
import VersionBanner from '../docs-platform/VersionBanner'
import DocsSubNav from './DocsSubNav'
import { DocsCopyPageMenu } from './DocsCopyPageMenu'
import { DocsPackageSidebar } from './DocsPackageSidebar'
import type { SidebarSection } from './docsTypes'

export interface DocsShellProps {
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
  /**
   * Suppress the shell's eyebrow/title/subtitle header. Used by the REST
   * API route — Scalar renders its own H1 ("Oxy REST API") at the top of
   * the content area, so the shell's "API Reference" H1 would be a
   * duplicate.
   */
  hideHeader?: boolean
  children: React.ReactNode
}

export function DocsShell({
  sections,
  sidebar,
  eyebrow,
  title,
  subtitle,
  pkg,
  currentVersion,
  slug,
  activePkg,
  hideHeader,
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
          sections ? <DocsPackageSidebar sections={sections} activePkg={activePkg} /> : null
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

          {hideHeader ? null : (
            <header className="relative leading-none">
              <div className="mt-0.5 space-y-2.5">
                <div className="h-5 text-primary text-sm font-semibold">{eyebrow}</div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center relative gap-2 min-w-0">
                  <h1 className="text-2xl sm:text-3xl text-foreground tracking-tight [overflow-wrap:anywhere] font-bold break-all">
                    {title}
                  </h1>
                  <DocsCopyPageMenu />
                </div>
              </div>
              {subtitle ? (
                <div className="mt-2 text-lg text-muted-foreground">
                  <p>{subtitle}</p>
                </div>
              ) : null}
            </header>
          )}

          <div
            className={
              hideHeader
                ? 'relative mb-14 [contain:inline-size] isolate prose prose-neutral dark:prose-invert text-foreground'
                : 'relative mt-8 mb-14 [contain:inline-size] isolate max-w-3xl prose prose-neutral dark:prose-invert text-foreground'
            }
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
