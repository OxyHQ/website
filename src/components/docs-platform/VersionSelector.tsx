import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SyncedPackage } from '../../../scripts/types'
import { cn } from '../../lib/utils'

interface VersionSelectorProps {
  pkg: SyncedPackage
  currentVersion: string
  /** Slug within the current package — preserved when switching versions. */
  slug?: string
}

export default function VersionSelector({ pkg, currentVersion, slug }: VersionSelectorProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (pkg.versions.length <= 1) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        {currentVersion}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
      >
        {currentVersion}
        <svg width={10} height={10} viewBox="0 0 12 12" aria-hidden>
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-1 w-32 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {pkg.versions.map((v) => {
            const active = v.version === currentVersion
            return (
              <button
                key={v.version}
                type="button"
                className={cn(
                  'block w-full px-3 py-1.5 text-left text-xs',
                  active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface',
                )}
                onClick={() => {
                  setOpen(false)
                  const href = slug
                    ? `/docs/${pkg.shortName}/${v.version}/${slug}`
                    : `/docs/${pkg.shortName}/${v.version}`
                  navigate(href)
                }}
              >
                {v.version}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
