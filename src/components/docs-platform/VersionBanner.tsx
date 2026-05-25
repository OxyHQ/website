import { Link } from 'react-router-dom'
import type { SyncedPackage } from '../../../scripts/types'
import { buildDocsHref, isVersionDeprecated, isVersionOutdated } from '../../content/docs-loader'

interface VersionBannerProps {
  pkg: SyncedPackage
  currentVersion: string
  /** Slug within the current package — preserved when linking to the latest version. */
  slug?: string
}

/**
 * "You're viewing an older version" / "this version is deprecated" banner.
 * Renders nothing for the latest version or for non-versioned packages.
 * Always links to the same slug under the latest version so readers can
 * jump to the corresponding up-to-date page in one click.
 */
export default function VersionBanner({ pkg, currentVersion, slug = '' }: VersionBannerProps) {
  if (!pkg.versioned) return null
  const deprecated = isVersionDeprecated(pkg, currentVersion)
  const outdated = isVersionOutdated(pkg, currentVersion)
  if (!deprecated && !outdated) return null

  const latestHref = buildDocsHref(pkg, pkg.latestVersion, slug)

  if (deprecated) {
    return (
      <div
        role="alert"
        className="not-prose mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm"
      >
        <div className="flex items-start gap-2 flex-1">
          <svg
            aria-hidden
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 size-4 shrink-0 text-red-500"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-foreground">
            <span className="font-semibold">
              {pkg.displayName} {currentVersion} is deprecated.
            </span>{' '}
            Upgrade to the latest release for security fixes and new features.
          </p>
        </div>
        <Link
          to={latestHref}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
        >
          View v{pkg.latestVersion}
        </Link>
      </div>
    )
  }

  return (
    <div
      role="status"
      className="not-prose mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <div className="flex items-start gap-2 flex-1">
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 size-4 shrink-0 text-amber-500"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-foreground">
          You{"’"}re viewing <span className="font-semibold">{pkg.displayName} {currentVersion}</span>.
          The latest version is <span className="font-semibold">{pkg.latestVersion}</span>.
        </p>
      </div>
      <Link
        to={latestHref}
        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
      >
        View v{pkg.latestVersion}
      </Link>
    </div>
  )
}
