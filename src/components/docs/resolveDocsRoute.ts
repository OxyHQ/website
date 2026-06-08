import { getPackage, getPage, getVersion, resolveVersion } from '../../content/docs-loader'
import type { SyncedVersion } from '../../../scripts/types'
import type { DocsRouteParams, ResolveResult } from './docsTypes'

/**
 * Heuristic: does this URL segment look like a semver-ish version number?
 *
 * Matches `1.2.3`, `2.0.6`, `v3.0.0-beta.1`, `0.1.0`, etc. Used to decide
 * whether an unknown URL segment under `:package/:version` should:
 *   - be treated as a published-but-undocumented VERSION → render the
 *     "documentation isn't published yet" placeholder, or
 *   - be treated as a stray SLUG / typo → redirect to the package root.
 *
 * The match is intentionally tight enough to avoid eating regular slugs:
 * a leading digit followed by at least one `.` and another digit. Slug-shaped
 * URLs like `security/activity` or `getting-started` never satisfy this.
 */
function looksLikeVersionSegment(segment: string): boolean {
  return /^v?\d+\.\d+(?:\.\d+)?(?:[-+][\w.]+)?$/.test(segment)
}

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
    // index page; otherwise show the empty-version placeholder when the
    // failed segment looks like a version (`tnp/0.1.0` → "not published
    // yet"), or redirect to the package root for typo-shaped slugs.
    if (!stitchedSlug) {
      const index = getPage(version, '')
      if (index) return { kind: 'page', pkg, version, slug: '' }
    }
    if (requestedVersion && !splat && looksLikeVersionSegment(requestedVersion)) {
      const placeholder: SyncedVersion = { version: requestedVersion, pages: [] }
      return { kind: 'empty', pkg, version: placeholder }
    }
    return 'redirect'
  }

  // Versioned package — the URL must include a real version segment.
  if (!requestedVersion) return 'redirect'
  const version = getVersion(pkg, requestedVersion)
  if (!version) {
    // The requested version doesn't exist in the synced index. If it looks
    // like a real version number (e.g. `2.0.6` published to npm but not yet
    // tagged in git, so sync-docs skipped it), surface the empty-version
    // placeholder so the URL stays stable and the user gets a clear message
    // instead of being silently rewritten to `latestVersion`.
    if (looksLikeVersionSegment(requestedVersion)) {
      const placeholder: SyncedVersion = { version: requestedVersion, pages: [] }
      return { kind: 'empty', pkg, version: placeholder }
    }
    // Not a real version and not version-shaped: this is the canonical
    // no-version form (`buildDocsHref(pkg, 'latest', slug)`, used by search and
    // SEO canonicals) where React Router bound the first slug segment to
    // `:version`. Fold it back onto the splat and resolve against the latest
    // version so deep links like `/developers/docs/bloom/api/functions/select`
    // land on the actual page instead of redirecting to the package root.
    const latest = resolveVersion(pkg)
    if (latest && latest.pages.length > 0) {
      const slug = [requestedVersion, splat].filter(Boolean).join('/')
      const page = getPage(latest, slug)
      if (page) return { kind: 'page', pkg, version: latest, slug }
    }
    return 'redirect'
  }
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
