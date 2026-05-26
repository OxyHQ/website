import { Navigate, useLocation, useParams } from 'react-router-dom'
import { buildDocsHref, getPackage, getPage, resolveVersion } from '../../content/docs-loader'
import { DocsApiBody } from './DocsApiBody'
import { DocsApiSidebar } from './DocsApiSidebar'
import { DocsMdxBody } from './DocsMdxBody'
import { buildSidebar } from './DocsPackageSidebar'
import { DocsShell } from './DocsShell'
import type { DocsRouteParams } from './docsTypes'
import { resolveDocsRoute } from './resolveDocsRoute'

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
        sidebar={<DocsApiSidebar version={version} />}
        eyebrow="REST API"
        title="API Reference"
        pkg={apiPkg}
        currentVersion={version}
        slug=""
        activePkg={apiPkg ?? undefined}
        hideHeader
      >
        <DocsApiBody version={version} />
      </DocsShell>
    )
  }

  const resolved = resolveDocsRoute(params)

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
  if (resolved.kind === 'empty') {
    // Package + version exist but no docs have been published yet. Render
    // the shell with a friendly placeholder so the sidebar (and active
    // package highlight) still appears. Slug intentionally left blank so
    // the package row matches `activePath === node.href` and highlights.
    const { pkg, version } = resolved
    const sections = buildSidebar(pkg, version)
    return (
      <DocsShell
        sections={sections}
        eyebrow={pkg.displayName}
        title={`${pkg.displayName} docs`}
        pkg={pkg}
        currentVersion={version.version}
        slug=""
        activePkg={pkg}
      >
        <div className="not-prose rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted-foreground">
            Documentation for this version isn't published yet. Check back soon.
          </p>
        </div>
      </DocsShell>
    )
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
      <DocsMdxBody file={page.file} />
    </DocsShell>
  )
}
