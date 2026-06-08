import { useParams, useLocation } from 'react-router-dom'
import { useLayoutEffect, useMemo } from 'react'
import { useBloomTheme } from '@oxyhq/bloom/theme'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import DocsPageContent from '../components/docs/DocsPage'
import { applyPreset, type AppColorName } from '../theme'
import {
  buildDocsHref,
  getPackage,
  getPage,
  getVersion,
  resolveVersion,
} from '../content/docs-loader'

/**
 * Brand-themed docs: render a package's docs in its own Bloom color preset.
 * FairCoin docs adopt the `faircoin` preset (accent + surfaces) while you're on
 * them, then restore the site preset on the way out. Color presets live as CSS
 * vars on :root, so we apply/restore them imperatively here — a nested
 * BloomThemeProvider can't unset them when it unmounts.
 */
const BRAND_PRESETS: Record<string, AppColorName> = { faircoin: 'faircoin' }

function useDocsBrandPreset() {
  const params = useParams<{ package?: string }>()
  const { theme, colorPreset } = useBloomTheme()
  const resolved: 'light' | 'dark' = theme.mode === 'dark' ? 'dark' : 'light'
  const brandPreset = useMemo<AppColorName | null>(() => {
    const pkg = params.package ? getPackage(params.package) : undefined
    return (pkg && BRAND_PRESETS[pkg.shortName]) ?? null
  }, [params.package])
  useLayoutEffect(() => {
    if (!brandPreset) return
    applyPreset(brandPreset, resolved)
    return () => applyPreset(colorPreset, resolved)
  }, [brandPreset, resolved, colorPreset])
}

interface DocsRouteMeta {
  title: string
  description: string
  /**
   * The URL the browser is actually rendering. Used as a fallback for the
   * SEO canonical when we can't resolve a more specific canonical.
   */
  canonicalPath: string
}

function useDocsRouteMeta(): DocsRouteMeta {
  const params = useParams<{ package?: string; version?: string; '*'?: string }>()
  const location = useLocation()
  return useMemo(() => {
    const currentPath = location.pathname
    // `/developers/docs/api[/:version]` — the dedicated REST API route.
    if (params.package === undefined && currentPath.startsWith('/developers/docs/api')) {
      const apiPkg = getPackage('api')
      const canonicalPath = apiPkg
        ? buildDocsHref(apiPkg, apiPkg.latestVersion, '')
        : currentPath
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
        canonicalPath: currentPath,
      }
    }
    // For non-versioned packages, the URL "version" segment is part of the
    // slug — stitch it back onto the splat. Mirrors the resolver in
    // `components/docs/DocsPage.tsx`.
    const splat = (params['*'] ?? '').replace(/^\/+/, '').replace(/\/+$/, '')
    let activeVersion = pkg.versioned
      ? (params.version && getVersion(pkg, params.version)) || resolveVersion(pkg)
      : resolveVersion(pkg)
    const activeSlug = pkg.versioned
      ? splat
      : [params.version ?? '', splat].filter(Boolean).join('/')
    if (!activeVersion) activeVersion = resolveVersion(pkg)

    const page = activeVersion ? getPage(activeVersion, activeSlug) : undefined

    // Canonical: always the latest-version URL for the resolved slug. This
    // de-duplicates old-version pages in search engines without hiding
    // them from crawlers (we deliberately do not set `noIndex`).
    const canonicalPath = buildDocsHref(pkg, pkg.latestVersion, activeSlug)

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
  useDocsBrandPreset()
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
