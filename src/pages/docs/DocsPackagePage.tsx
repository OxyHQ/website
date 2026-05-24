import { useParams, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useMemo } from 'react'
import { getPackage, getVersion, getPage, loadMdx } from '../../content/docs-loader'
import DocsLayout from '../../components/docs-platform/DocsLayout'
import DocsSidebar from '../../components/docs-platform/DocsSidebar'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from '../../components/docs-platform/MdxComponents'

export default function DocsPackagePage() {
  const params = useParams<{ package?: string; version?: string; '*'?: string }>()
  const location = useLocation()

  const shortName = params.package ?? ''
  const pkg = getPackage(shortName)
  if (!pkg) {
    return <Navigate to="/docs" replace />
  }

  // If only `/docs/:package` was hit, redirect to the default version.
  if (!params.version) {
    return <Navigate to={`/docs/${pkg.shortName}/${pkg.defaultVersion}`} replace />
  }

  const version = getVersion(pkg, params.version)
  if (!version) {
    return <Navigate to={`/docs/${pkg.shortName}/${pkg.defaultVersion}`} replace />
  }

  const slug = (params['*'] ?? '').replace(/\/+$/, '')
  const page = getPage(version, slug)

  const MdxComponent = useMemo(() => {
    if (!page) return null
    const loader = loadMdx(page.file)
    if (!loader) return null
    return lazy(loader)
  }, [page])

  // 404 within a known package → soft-fail to the package landing page.
  if (!page) {
    return <Navigate to={`/docs/${pkg.shortName}/${pkg.defaultVersion}`} replace />
  }

  return (
    <DocsLayout
      pkg={pkg}
      version={version}
      slug={slug}
      sidebar={<DocsSidebar pkg={pkg} version={version} />}
      pageTitle={page.title}
      seoTitle={`${page.title} — ${pkg.displayName}`}
      seoDescription={page.description}
      canonicalPath={location.pathname}
    >
      {MdxComponent ? (
        <MDXProvider components={mdxComponents}>
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
            <MdxComponent />
          </Suspense>
        </MDXProvider>
      ) : (
        <div className="not-prose rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted-foreground">
            Page content unavailable. The synced docs may be out of date — run{' '}
            <code>bun scripts/sync-docs.ts</code> from the website root.
          </p>
        </div>
      )}
    </DocsLayout>
  )
}
