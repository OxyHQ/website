import { NavLink, useLocation } from 'react-router-dom'
import type { SyncedPackage, SyncedVersion } from '../../../scripts/types'
import { cn } from '../../lib/utils'

interface DocsSidebarProps {
  pkg: SyncedPackage
  version: SyncedVersion
}

function pageHref(shortName: string, version: string, slug: string): string {
  const base = `/docs/${shortName}/${version}`
  return slug ? `${base}/${slug}` : base
}

export default function DocsSidebar({ pkg, version }: DocsSidebarProps) {
  const location = useLocation()
  return (
    <aside className="hidden lg:block w-[19.5rem] shrink-0 border-r border-border">
      <div className="sticky top-[calc(var(--site-header-height,64px)+48px)] h-[calc(100vh-var(--site-header-height,64px)-48px)] overflow-y-auto relative text-sm leading-6 pt-6 pb-10 pl-6 pr-6">
        <div className="mb-4 pl-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            {pkg.category.replace(/-/g, ' ')}
          </div>
          <div className="text-base font-semibold text-foreground">{pkg.displayName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{pkg.package}</div>
        </div>
        <ul className="space-y-px">
          {version.pages.map((page) => {
            const href = pageHref(pkg.shortName, version.version, page.slug)
            const active = location.pathname === href
            return (
              <li key={page.slug || 'index'}>
                <NavLink
                  to={href}
                  className={cn(
                    'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left break-words hyphens-auto rounded-xl w-full outline-offset-[-1px]',
                    active
                      ? 'bg-primary/10 text-primary [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]'
                      : 'hover:bg-surface text-muted-foreground hover:text-foreground',
                  )}
                >
                  <div className="flex-1 flex items-start space-x-2.5">
                    <div className="break-words [word-break:break-word]">{page.title}</div>
                  </div>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
