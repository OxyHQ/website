import { Link, NavLink, useLocation } from 'react-router-dom'
import { getPackages } from '../../content/docs-loader'
import type { SyncedPackage } from '../../../scripts/types'
import DocsSearch from '../docs-platform/DocsSearch'
import DocsSubNav from './DocsSubNav'

interface CategoryConfig {
  category: SyncedPackage['category']
  title: string
  description: string
}

const categoryOrder: CategoryConfig[] = [
  { category: 'ui-library', title: 'UI Library', description: 'Cross-platform components and theming primitives.' },
  { category: 'sdk', title: 'SDKs', description: 'TypeScript clients, React hooks, and React Native components.' },
  { category: 'app', title: 'Apps', description: 'Guides for the Oxy product surface: accounts, inbox, console, auth.' },
  { category: 'service', title: 'Services', description: 'Backend services and REST APIs.' },
]

function pageHref(pkg: SyncedPackage): string {
  return `/developers/docs/${pkg.shortName}/${pkg.defaultVersion}`
}

/* ─── Sidebar: synced packages grouped by category ─── */
function DocsSidebar({ packages }: { packages: SyncedPackage[] }) {
  const location = useLocation()
  const sections = categoryOrder
    .map((cfg) => ({
      title: cfg.title,
      items: packages
        .filter((p) => p.category === cfg.category)
        .map((p) => ({ label: p.displayName, href: pageHref(p) })),
    }))
    .filter((s) => s.items.length > 0)

  return (
    <aside className="hidden lg:block w-[19.5rem] shrink-0 border-r border-border">
      <div className="sticky top-[calc(var(--site-header-height,64px)+48px)] h-[calc(100vh-var(--site-header-height,64px)-48px)] overflow-y-auto relative text-sm leading-6 pt-6 pb-10 pl-6 pr-6">
        {sections.map((section, sectionIdx) => (
          <div key={section.title} className={sectionIdx === 0 ? '' : 'mt-8'}>
            <h5 className="mb-2.5 font-semibold text-foreground pl-4">{section.title}</h5>
            <ul className="space-y-px">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.label}>
                    <NavLink
                      className={
                        isActive
                          ? 'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left break-words hyphens-auto rounded-xl w-full outline-offset-[-1px] bg-primary/10 text-primary [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]'
                          : 'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left rounded-xl w-full outline-offset-[-1px] hover:bg-surface text-muted-foreground hover:text-foreground'
                      }
                      to={item.href}
                    >
                      <div className="flex-1 flex items-start space-x-2.5">
                        <div className="break-words [word-break:break-word]">{item.label}</div>
                      </div>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}

/* ─── Main Component ─── */
export default function DocsIntroPage() {
  const packages = getPackages()
  return (
    <div className="relative antialiased">
      <DocsSubNav />

      {/* Sidebar + Content layout */}
      <div className="container flex">
        <DocsSidebar packages={packages} />

        {/* Main content */}
        <div className="relative grow box-border flex-col w-full py-10 px-6 lg:px-12 min-w-0">
          {/* Background image */}
          <div className="absolute -top-14 left-0 right-0 opacity-80">
            <img
              src="/docs/background-light.svg"
              alt=""
              className="object-contain block dark:hidden pointer-events-none w-full h-auto"
              width={1152}
              height={388}
              style={{ aspectRatio: '1152 / 388' }}
              loading="eager"
              decoding="async"
            />
            <img
              src="/docs/background-dark.svg"
              alt=""
              className="object-contain hidden dark:block pointer-events-none w-full h-auto"
              width={1152}
              height={388}
              style={{ aspectRatio: '1152 / 388' }}
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 px-4 py-16 lg:py-32 lg:pb-16 max-w-3xl mx-auto">
            <h1 className="block text-4xl font-medium text-center text-foreground tracking-tight">
              Documentation
            </h1>
            <div className="max-w-xl mx-auto px-4 mt-4 text-lg text-center text-foreground0">
              Everything you need to build on the Oxy platform — open source, no vendor lock-in.
            </div>

            {/* Search */}
            <div className="mt-8 mx-auto max-w-xl relative">
              <DocsSearch variant="inline" />
            </div>
          </div>

          {/* Category sections */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 pb-24 space-y-12">
            {categoryOrder.map((cfg) => {
              const pkgs = packages.filter((p) => p.category === cfg.category)
              if (pkgs.length === 0) return null
              return (
                <section key={cfg.category}>
                  <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-foreground">{cfg.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{cfg.description}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {pkgs.map((pkg) => (
                      <Link
                        key={pkg.shortName}
                        to={pageHref(pkg)}
                        className="group block rounded-2xl border border-border bg-surface p-5 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-foreground">{pkg.displayName}</span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {pkg.defaultVersion}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{pkg.package}</div>
                        {pkg.description ? (
                          <p className="mt-3 text-sm text-muted-foreground">{pkg.description}</p>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}

            {packages.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Docs index is empty. Run <code>bun scripts/sync-docs.ts</code> from the website
                  root.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
