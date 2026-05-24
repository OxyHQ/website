import { useParams, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import DocsPageContent from '../components/docs/DocsPage'
import { getPackage, getVersion, getPage } from '../content/docs-loader'

interface DocsRouteMeta {
  title: string
  description: string
  canonicalPath: string
}

function useDocsRouteMeta(): DocsRouteMeta {
  const params = useParams<{ package?: string; version?: string; '*'?: string }>()
  const location = useLocation()
  return useMemo(() => {
    const canonicalPath = location.pathname
    // `/developers/docs/api[/:version]` — the dedicated REST API route.
    if (params.package === undefined && location.pathname.startsWith('/developers/docs/api')) {
      return {
        title: 'Oxy REST API',
        description:
          'REST API reference for the Oxy platform — authentication, accounts, files, billing, and more.',
        canonicalPath,
      }
    }
    const pkg = params.package ? getPackage(params.package) : undefined
    if (!pkg) {
      return {
        title: 'Documentation',
        description: 'Oxy developer documentation: SDKs, UI library, API reference, per-app guides.',
        canonicalPath,
      }
    }
    const version =
      params.version && getVersion(pkg, params.version)
        ? getVersion(pkg, params.version)
        : getVersion(pkg, pkg.defaultVersion)
    const slug = (params['*'] ?? '').replace(/\/+$/, '')
    const page = version ? getPage(version, slug) : undefined
    if (!page) {
      return {
        title: `${pkg.displayName} — Oxy Docs`,
        description: pkg.description ?? `Documentation for ${pkg.displayName}.`,
        canonicalPath,
      }
    }
    return {
      title: `${page.title} — ${pkg.displayName}`,
      description: page.description ?? pkg.description ?? `Documentation for ${pkg.displayName}.`,
      canonicalPath,
    }
  }, [params, location.pathname])
}

export default function DocsPage() {
  const meta = useDocsRouteMeta()
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={meta.title}
        description={meta.description}
        canonicalPath={meta.canonicalPath}
      />
      <Navbar />
      <main className="flex-1 bg-background text-muted-foreground">
        <DocsPageContent />
      </main>
      <Footer />
    </div>
  )
}
