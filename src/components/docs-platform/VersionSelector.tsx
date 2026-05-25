import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SyncedPackage } from '../../../scripts/types'
import { buildDocsHref } from '../../content/docs-loader'
import { cn } from '../../lib/utils'

interface VersionSelectorProps {
  pkg: SyncedPackage
  currentVersion: string
  /** Slug within the current package — preserved when switching versions. */
  slug?: string
}

/**
 * Version dropdown shown in the docs header. Only renders for packages
 * that ship versioned docs (`versioned: true` in their `docs.config.json`)
 * with more than one entry in `versions[]`. Non-versioned packages —
 * end-user apps like Accounts / Console / Inbox — have no need for a
 * version selector and we skip rendering entirely.
 */
export default function VersionSelector({ pkg, currentVersion, slug }: VersionSelectorProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!pkg.versioned || pkg.versions.length <= 1) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Switch version (current: ${currentVersion})`}
        className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
      >
        v{currentVersion}
        {currentVersion === pkg.latestVersion ? (
          <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-semibold text-primary">
            latest
          </span>
        ) : null}
        <svg width={10} height={10} viewBox="0 0 12 12" aria-hidden>
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {pkg.versions.map((v) => {
            const active = v.version === currentVersion
            const isLatest = v.version === pkg.latestVersion
            const isDeprecated = pkg.deprecatedVersions.includes(v.version)
            return (
              <button
                key={v.version}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs',
                  active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface',
                )}
                onClick={() => {
                  setOpen(false)
                  navigate(buildDocsHref(pkg, v.version, slug))
                }}
              >
                <span>v{v.version}</span>
                {isLatest ? (
                  <span className="rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-semibold text-primary">
                    latest
                  </span>
                ) : isDeprecated ? (
                  <span className="rounded-full bg-red-500/15 px-1.5 py-px text-[10px] font-semibold text-red-500">
                    deprecated
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
