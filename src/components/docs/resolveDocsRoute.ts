import { getPackage, getPage, getVersion, resolveVersion } from '../../content/docs-loader'
import type { DocsRouteParams, ResolveResult } from './docsTypes'

export function resolveDocsRoute(params: DocsRouteParams): ResolveResult {
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
    // Zero-page version — render the empty placeholder regardless of slug.
    if (version.pages.length === 0) return { kind: 'empty', pkg, version }
    const page = getPage(version, stitchedSlug)
    if (page) return { kind: 'page', pkg, version, slug: stitchedSlug }
    // No matching slug — if nothing was requested, fall through to the
    // index page; otherwise bounce to the package root.
    if (!stitchedSlug) {
      const index = getPage(version, '')
      if (index) return { kind: 'page', pkg, version, slug: '' }
    }
    return 'redirect'
  }

  // Versioned package — the URL must include a real version segment.
  if (!requestedVersion) return 'redirect'
  const version = getVersion(pkg, requestedVersion)
  if (!version) return 'redirect'
  // Zero-page version — render the empty placeholder regardless of slug.
  // A redirect would loop because the canonical URL has no slug either.
  if (version.pages.length === 0) return { kind: 'empty', pkg, version }
  const pageExists = getPage(version, splat)
  if (pageExists) return { kind: 'page', pkg, version, slug: splat }
  // No slug requested → render the package's first page as the overview.
  // Without this the route would redirect to itself and loop forever.
  if (!splat) {
    const firstPage = version.pages[0]
    if (firstPage) return { kind: 'page', pkg, version, slug: firstPage.slug }
  }
  return 'redirect'
}
