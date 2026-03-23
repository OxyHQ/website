import { useLocation } from 'react-router-dom'
import { docsSidebar } from '../../data/docs'

const introCards = [
  { title: 'Quickstart', description: 'Deploy your first docs site in minutes with our step-by-step guide', href: '#', image: 'rocket' },
  { title: 'CLI installation', description: 'Install the CLI to preview and develop your docs locally', href: '#', image: 'cli' },
  { title: 'Web editor', description: 'Make quick updates and manage content with our browser-based editor', href: '#', image: 'editor' },
  { title: 'Components', description: 'Build rich, interactive documentation with our ready-to-use components', href: '#', image: 'components' },
]

/* ─── Sidebar (same as overview page) ─── */
function DocsSidebar() {
  const location = useLocation()

  return (
    <aside className="hidden lg:block w-[19.5rem] shrink-0 border-r border-subtle-stroke">
      <div className="sticky top-[calc(var(--site-header-height,64px)+48px)] h-[calc(100vh-var(--site-header-height,64px)-48px)] overflow-y-auto relative text-sm leading-6 pt-6 pb-10 pl-6 pr-6">
        {docsSidebar.map((section, sectionIdx) => (
          <div key={section.title} className={sectionIdx === 0 ? '' : 'mt-8'}>
            <h5 className="mb-2.5 font-semibold text-secondary-foreground pl-4">
              {section.title}
            </h5>
            <ul className="space-y-px">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.label}>
                    <a
                      className={
                        isActive
                          ? 'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left break-words hyphens-auto rounded-xl w-full outline-offset-[-1px] bg-[var(--color-blue-500)]/10 text-[var(--color-blue-500)] [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]'
                          : 'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left rounded-xl w-full outline-offset-[-1px] hover:bg-secondary-background text-tertiary-foreground hover:text-secondary-foreground'
                      }
                      href={item.href}
                    >
                      <div className="flex-1 flex items-start space-x-2.5">
                        <div className="break-words [word-break:break-word]">{item.label}</div>
                      </div>
                    </a>
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
  return (
    <div className="relative antialiased">
      {/* Docs sub-navbar with tabs - sticky below main navbar */}
      <div className="sticky top-[var(--site-header-height,64px)] z-40 border-b border-subtle-stroke bg-primary-background">
        <div className="container">
          <div className="hidden lg:flex h-12 lg:pl-[19.5rem]">
            <div className="h-full flex text-sm gap-x-6">
              <a className="group relative h-full gap-2 flex items-center font-medium text-secondary-foreground [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]" href="/developers/docs">
                Overview
                <div className="absolute bottom-0 h-[1.5px] w-full left-0 bg-[var(--color-blue-500)]" />
              </a>
              <a className="group relative h-full gap-2 flex items-center font-medium text-tertiary-foreground hover:text-secondary-foreground" href="#">
                App SDK
              </a>
              <a className="group relative h-full gap-2 flex items-center font-medium text-tertiary-foreground hover:text-secondary-foreground" href="#">
                REST API
              </a>
              <a className="group relative h-full gap-2 flex items-center font-medium text-tertiary-foreground hover:text-secondary-foreground" href="#">
                MCP
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar + Content layout */}
      <div className="container flex">
        <DocsSidebar />

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
            />
            <img
              src="/docs/background-dark.svg"
              alt=""
              className="object-contain hidden dark:block pointer-events-none w-full h-auto"
              width={1152}
              height={388}
              style={{ aspectRatio: '1152 / 388' }}
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 px-4 py-16 lg:py-48 lg:pb-24 max-w-3xl mx-auto">
            <h1 className="block text-4xl font-medium text-center text-zinc-50 tracking-tight">
              Documentation
            </h1>
            <div className="max-w-xl mx-auto px-4 mt-4 text-lg text-center text-zinc-500">
              Meet the next generation of documentation. AI-native, beautiful out-of-the-box, and
              built for developers and teams.
            </div>

            {/* 2x2 Card grid */}
            <div className="px-6 lg:px-0 mt-12 lg:mt-24 grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {introCards.map((card) => (
                <a key={card.title} className="group cursor-pointer pb-8" href={card.href}>
                  <img
                    src={`/docs/${card.image}.png`}
                    alt={card.title}
                    className="rounded block dark:hidden pointer-events-none group-hover:scale-105 transition-all duration-100"
                  />
                  <img
                    src={`/docs/${card.image}-dark.png`}
                    alt={card.title}
                    className="rounded pointer-events-none group-hover:scale-105 transition-all duration-100 hidden dark:block"
                  />
                  <h3 className="mt-5 text-zinc-50 font-medium">{card.title}</h3>
                  <span className="mt-1.5">{card.description}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
