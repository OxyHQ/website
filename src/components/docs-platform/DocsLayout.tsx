import type { ReactNode } from 'react'
import Navbar from '../layout/Navbar'
import Footer from '../layout/Footer'
import SEO from '../SEO'
import DocsSearch from './DocsSearch'
import VersionSelector from './VersionSelector'
import Breadcrumbs from './Breadcrumbs'
import type { SyncedPackage, SyncedVersion } from '../../../scripts/types'

interface DocsLayoutProps {
  pkg?: SyncedPackage
  version?: SyncedVersion
  /** Slug within the package — used by the version selector to preserve location. */
  slug?: string
  /** Optional override for the rendered sidebar (e.g. category list on the docs hub). */
  sidebar?: ReactNode
  pageTitle?: string
  seoTitle?: string
  seoDescription?: string
  canonicalPath: string
  children: ReactNode
}

export default function DocsLayout({
  pkg,
  version,
  slug,
  sidebar,
  pageTitle,
  seoTitle,
  seoDescription,
  canonicalPath,
  children,
}: DocsLayoutProps) {
  const title = seoTitle ?? (pageTitle ? `${pageTitle} — Oxy Docs` : 'Documentation')
  const description = seoDescription ?? 'Oxy developer documentation: SDKs, UI library, API reference, and per-app guides.'

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO title={title} description={description} canonicalPath={canonicalPath} />
      <Navbar />
      <main className="flex-1 bg-background text-muted-foreground">
        <div className="sticky top-[var(--site-header-height,64px)] z-40 border-b border-border bg-background">
          <div className="container flex items-center gap-4 py-3 lg:pl-[19.5rem]">
            <div className="relative flex-1 max-w-xl">
              <DocsSearch variant="inline" />
            </div>
            {pkg && version ? (
              <VersionSelector pkg={pkg} currentVersion={version.version} slug={slug} />
            ) : null}
          </div>
        </div>
        <div className="container flex">
          {sidebar}
          <div className="relative grow box-border flex-col w-full py-10 px-6 lg:px-12 min-w-0">
            {pkg ? (
              <div className="mb-6">
                <Breadcrumbs pkg={pkg} version={version?.version ?? pkg.defaultVersion} pageTitle={pageTitle} />
              </div>
            ) : null}
            <article className="prose prose-neutral dark:prose-invert max-w-3xl text-foreground">
              {children}
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
