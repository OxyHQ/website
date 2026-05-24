import { NavLink, useLocation } from 'react-router-dom'

interface DocsTab {
  label: string
  to: string
  /**
   * Match function that decides whether the tab is active for the given
   * pathname. Each tab owns its own predicate so we can disambiguate
   * `/developers/docs` (Overview) from `/developers/docs/services` (App SDK)
   * without depending on `NavLink`'s `end` heuristic.
   */
  isActive: (pathname: string) => boolean
}

const tabs: DocsTab[] = [
  {
    label: 'Overview',
    to: '/developers/docs',
    isActive: (pathname) => pathname === '/developers/docs',
  },
  {
    label: 'App SDK',
    to: '/developers/docs/services',
    isActive: (pathname) =>
      pathname.startsWith('/developers/docs/services') ||
      pathname.startsWith('/developers/docs/core') ||
      pathname.startsWith('/developers/docs/auth-sdk') ||
      pathname.startsWith('/developers/docs/bloom'),
  },
  {
    label: 'REST API',
    to: '/developers/docs/api',
    isActive: (pathname) => pathname.startsWith('/developers/docs/api'),
  },
  {
    label: 'MCP',
    to: '/developers/docs/mcp',
    isActive: (pathname) => pathname.startsWith('/developers/docs/mcp'),
  },
]

export default function DocsSubNav() {
  const { pathname } = useLocation()
  return (
    <div className="sticky top-[var(--site-header-height,64px)] z-40 border-b border-border bg-background">
      <div className="container">
        <div className="hidden lg:flex h-12 lg:pl-[19.5rem]">
          <div className="h-full flex text-sm gap-x-6">
            {tabs.map((tab) => {
              const active = tab.isActive(pathname)
              return active ? (
                <NavLink
                  key={tab.label}
                  className="group relative h-full gap-2 flex items-center font-medium text-foreground [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]"
                  to={tab.to}
                >
                  {tab.label}
                  <div className="absolute bottom-0 h-[1.5px] w-full left-0 bg-primary" />
                </NavLink>
              ) : (
                <NavLink
                  key={tab.label}
                  className="group relative h-full gap-2 flex items-center font-medium text-muted-foreground hover:text-foreground"
                  to={tab.to}
                >
                  {tab.label}
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
