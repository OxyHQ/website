import { useLocation } from 'react-router-dom'
import { docsSidebar } from '../../data/docs'

const introCards = [
  { title: 'Quickstart', description: 'Deploy your first docs site in minutes with our step-by-step guide', href: '#', image: 'rocket' },
  { title: 'CLI installation', description: 'Install the CLI to preview and develop your docs locally', href: '#', image: 'cli' },
  { title: 'Web editor', description: 'Make quick updates and manage content with our browser-based editor', href: '#', image: 'editor' },
  { title: 'Components', description: 'Build rich, interactive documentation with our ready-to-use components', href: '#', image: 'components' },
]

/* ─── Sidebar ─── */
function IntroSidebar() {
  const location = useLocation()

  return (
    <div
      className="z-20 hidden lg:block fixed bottom-0 right-auto w-[16.5rem]"
      id="sidebar"
      style={{ top: 'var(--site-header-height, 64px)' }}
    >
      <div className="absolute inset-0 z-10 overflow-auto pr-8 pb-10 pt-8 pl-6">
        <div className="relative lg:text-sm lg:leading-6">
          {docsSidebar.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx === 0 ? '' : 'mt-8'}>
              <h5 className="mb-3.5 lg:mb-2.5 font-semibold text-secondary-foreground pl-4">
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
                            ? 'group flex items-start pr-3 py-1.5 cursor-pointer gap-x-3 text-left break-words hyphens-auto rounded-xl w-full outline-offset-[-1px] bg-[var(--color-blue-500)]/10 text-[var(--color-blue-500)] [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]'
                            : 'group flex items-start pr-3 py-1.5 cursor-pointer gap-x-3 text-left rounded-xl w-full outline-offset-[-1px] hover:bg-secondary-background text-tertiary-foreground hover:text-secondary-foreground'
                        }
                        style={{ paddingLeft: '1rem' }}
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
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function DocsIntroPage() {
  return (
    <div className="flex rounded-2xl h-[calc(100dvh-var(--site-header-height,64px)-2rem)] mx-4 mb-4 mt-2 lg:mx-6 lg:h-[calc(100dvh-var(--site-header-height,64px)-1rem)]">
      {/* Sidebar */}
      <IntroSidebar />

      {/* Content container - scrollable with rounded border */}
      <div
        className="flex-1 lg:ml-[16.5rem] overflow-y-auto rounded-2xl bg-primary-background border border-subtle-stroke"
        id="content-container"
      >
        <div className="relative" id="content">
          {/* Background image */}
          <div className="relative">
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

        {/* Footer */}
        <footer className="flex flex-col items-center mx-auto border-t border-subtle-stroke w-full">
          <div className="flex w-full flex-col gap-12 justify-between px-8 py-16 md:py-20 lg:py-28 max-w-[984px] z-20">
            <div className="flex flex-col md:flex-row gap-8 justify-between min-h-[76px]">
              <div className="flex md:flex-col justify-between items-center md:items-start min-w-16 md:min-w-20 lg:min-w-48 md:gap-y-24">
                <span className="text-xl font-bold text-primary-foreground">Oxy Docs</span>
                <div className="gap-4 min-w-[140px] flex-wrap h-fit flex justify-end md:justify-start">
                  <a href="#" className="text-tertiary-foreground hover:text-secondary-foreground transition-colors" aria-label="X">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a href="#" className="text-tertiary-foreground hover:text-secondary-foreground transition-colors" aria-label="LinkedIn">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                  <a href="#" className="text-tertiary-foreground hover:text-secondary-foreground transition-colors" aria-label="GitHub">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                  </a>
                </div>
              </div>
              <div className="flex flex-col sm:grid max-md:!grid-cols-2 gap-8 flex-1" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                <div className="flex flex-col gap-4 flex-1 whitespace-nowrap w-full md:items-center">
                  <div className="flex gap-4 flex-col">
                    <p className="text-sm font-semibold text-primary-foreground mb-1">Explore</p>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="#">Startups</a>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="#">Enterprise</a>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="#">Switch</a>
                  </div>
                </div>
                <div className="flex flex-col gap-4 flex-1 whitespace-nowrap w-full md:items-center">
                  <div className="flex gap-4 flex-col">
                    <p className="text-sm font-semibold text-primary-foreground mb-1">Resources</p>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="#">Customers</a>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="/company/news">Blog</a>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="/pricing">Pricing</a>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="#">Contact support</a>
                  </div>
                </div>
                <div className="flex flex-col gap-4 flex-1 whitespace-nowrap w-full md:items-center">
                  <div className="flex gap-4 flex-col">
                    <p className="text-sm font-semibold text-primary-foreground mb-1">Company</p>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="#">About</a>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="/company/careers">Careers</a>
                  </div>
                </div>
                <div className="flex flex-col gap-4 flex-1 whitespace-nowrap w-full md:items-center">
                  <div className="flex gap-4 flex-col">
                    <p className="text-sm font-semibold text-primary-foreground mb-1">Legal</p>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="#">Privacy</a>
                    <a className="text-sm max-w-36 whitespace-normal md:truncate text-tertiary-foreground hover:text-secondary-foreground" href="#">Terms</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center md:justify-between">
              <p className="text-sm text-tertiary-foreground">&copy; Oxy, Inc. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
