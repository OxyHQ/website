import { Link } from 'react-router-dom'

const tabs = [
  { label: 'Overview', to: '/developers/docs', active: true },
  { label: 'App SDK', to: '#' },
  { label: 'REST API', to: '#' },
  { label: 'MCP', to: '#' },
]

export default function DocsSubNav() {
  return (
    <div className="sticky top-[var(--site-header-height,64px)] z-40 border-b border-border bg-background">
      <div className="container">
        <div className="hidden lg:flex h-12 lg:pl-[19.5rem]">
          <div className="h-full flex text-sm gap-x-6">
            {tabs.map((tab) =>
              tab.active ? (
                <Link
                  key={tab.label}
                  className="group relative h-full gap-2 flex items-center font-medium text-foreground [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]"
                  to={tab.to}
                >
                  {tab.label}
                  <div className="absolute bottom-0 h-[1.5px] w-full left-0 bg-primary" />
                </Link>
              ) : (
                <a
                  key={tab.label}
                  className="group relative h-full gap-2 flex items-center font-medium text-muted-foreground hover:text-foreground"
                  href={tab.to}
                >
                  {tab.label}
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
