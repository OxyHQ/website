import type { SyncedPackage } from '../../../scripts/types'
import { FEATURES } from '../../constants'
import VersionSelector from '../docs-platform/VersionSelector'
import VersionBanner from '../docs-platform/VersionBanner'
import TableOfContents from '../ui/TableOfContents'
import { useContentHeadings } from '../../hooks/useContentHeadings'
import { useSiteHeaderBottom } from '../../hooks/useSiteHeaderBottom'
import DocsSubNav from './DocsSubNav'
import { DocsCopyPageMenu } from './DocsCopyPageMenu'
import { DocsPackageSidebar } from './DocsPackageSidebar'
import type { SidebarSection } from './docsTypes'

export interface DocsShellProps {
  /**
   * Pre-built section model for the package sidebar. Pass `null` together
   * with `hideSidebar` to mount the shell without any left rail (used by
   * the Scalar-rendered REST API route, where Scalar ships its own nav).
   */
  sections: SidebarSection[] | null
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
  /**
   * Skip the left rail entirely. Used by the REST API route so the
   * Scalar reference can own the full available width without sitting
   * next to a redundant tag-jump sidebar of our own.
   */
  hideSidebar?: boolean
  /**
   * Let an interactive canvas use the full article column while retaining the
   * package sidebar. The page-level table of contents is omitted because a
   * wide tool owns its own controls and responsive layout.
   */
  wideContent?: boolean
  /**
   * Hide historical docs controls for a tool that always runs the Website's
   * installed Bloom release. Versioned aliases redirect to its canonical URL.
   */
  versionAgnostic?: boolean
  children: React.ReactNode
}

export function DocsShell({
  sections,
  eyebrow,
  title,
  subtitle,
  pkg,
  currentVersion,
  slug,
  activePkg,
  hideHeader,
  hideSidebar,
  wideContent,
  versionAgnostic,
  children,
}: DocsShellProps) {
  const { headings, contentRef } = useContentHeadings()
  // The rail pins under the header AND the docs sub-nav, both of which move
  // while the promo banner scrolls away. Same measured bottom the sub-nav
  // parks on, plus its own 48px row.
  const railTop = useSiteHeaderBottom() + 48
  /*
   * Scalar renders its own nav, its own contents and its own measure, so the
   * REST route mounts the shell bare: no rail, no page cap. Everything else
   * gets the three columns.
   */
  const showRail = !hideSidebar && !wideContent
  // The version selector only makes sense for packages that opted into
  // versioning AND ship more than one version. Non-versioned packages
  // never show it; single-version versioned packages also hide it so the
  // header stays clean until a second version ships.
  const showVersionSelector =
    pkg !== undefined &&
    currentVersion !== undefined &&
    !versionAgnostic &&
    pkg.versioned &&
    pkg.versions.length > 1
  return (
    <div className="docs-theme relative antialiased bg-[color-mix(in_srgb,var(--primary)_4%,var(--background))]">
      <DocsSubNav />

      <div className="flex w-full">
        {hideSidebar
          ? null
          : sections
            ? (
              <DocsPackageSidebar
                sections={sections}
                activePkg={activePkg}
                versionSelector={
                  showVersionSelector && pkg && currentVersion ? (
                    <VersionSelector pkg={pkg} currentVersion={currentVersion} slug={slug} />
                  ) : null
                }
              />
            )
            : null}

        <main className="relative grow box-border flex-col w-full min-w-0 bg-[color-mix(in_srgb,var(--primary)_4%,var(--background))] px-6 py-10 lg:px-12">
        <div
          className={
            showRail
              ? 'mx-auto grid w-full max-w-4xl grid-cols-1 gap-x-12 xl:grid-cols-[minmax(0,1fr)_200px]'
              : wideContent
                ? 'mx-auto w-full max-w-[1480px]'
                : 'w-full'
          }
        >
          {/*
            The contents rail. `col-start-2 row-start-1` puts it beside the
            article rather than after it, so it pins against the whole column
            instead of scrolling away with its own height.
          */}
          {showRail ? (
            <aside
              className="sticky hidden self-start pb-6 xl:col-start-2 xl:row-start-1 xl:block"
              style={{ top: railTop + 24, maxHeight: `calc(100vh - ${railTop + 24}px)` }}
            >
              <div className="min-h-0 overflow-y-auto pr-1">
                <TableOfContents headings={headings} variant="list" sticky={false} />
              </div>
            </aside>
          ) : null}

          <div className="min-w-0 xl:col-start-1 xl:row-start-1">
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
                ? 'relative isolate mb-14 [contain:inline-size] prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-foreground prose-pre:bg-card prose-pre:text-card-foreground'
                : 'relative isolate mt-8 mb-14 [contain:inline-size] prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-foreground prose-pre:bg-card prose-pre:text-card-foreground'
            }
            data-docs-content
            ref={contentRef}
          >
            {/* Below the rail's breakpoint the contents become a jump-to. */}
            {showRail ? (
              <div className="not-prose xl:hidden">
                <TableOfContents headings={headings} variant="select" />
              </div>
            ) : null}
            {pkg && currentVersion && !versionAgnostic ? (
              <VersionBanner pkg={pkg} currentVersion={currentVersion} slug={slug} />
            ) : null}
            {children}
          </div>

          {FEATURES.SHOW_ARTICLE_FEEDBACK ? (
            <div className="pb-16 w-full flex flex-col gap-y-8">
              <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
                <p className="inline-block text-sm text-muted-foreground whitespace-nowrap">
                  Was this page helpful?
                </p>
                <div className="flex flex-wrap flex-grow gap-3 items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <button className="px-3.5 py-2 flex flex-row gap-3 items-center rounded-full text-muted-foreground hover:text-foreground border border-border hover:border-input">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M7 10v12" />
                        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                      </svg>
                      <small className="text-sm font-normal leading-4">Yes</small>
                    </button>
                    <button className="px-3.5 py-2 flex flex-row gap-3 items-center rounded-full text-muted-foreground hover:text-foreground border border-border hover:border-input">
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
        </main>
      </div>
    </div>
  )
}
