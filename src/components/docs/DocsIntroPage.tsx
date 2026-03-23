import { useLocation } from 'react-router-dom'
import { docsSidebar } from '../../data/docs'

const docsTopLinks = [
  { label: 'Developer dashboard', icon: 'terminal' },
  { label: 'Support', icon: 'headphones' },
]

const introCards = [
  {
    title: 'Quickstart',
    description: 'Deploy your first docs site in minutes with our step-by-step guide',
    href: '#',
    gradient: 'from-purple-500/20 to-blue-500/20',
  },
  {
    title: 'CLI installation',
    description: 'Install the CLI to preview and develop your docs locally',
    href: '#',
    gradient: 'from-cyan-500/20 to-emerald-500/20',
  },
  {
    title: 'Web editor',
    description: 'Make quick updates and manage content with our browser-based editor',
    href: '#',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    title: 'Components',
    description: 'Build rich, interactive documentation with our ready-to-use components',
    href: '#',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
]

const footerColumns = [
  {
    title: 'Explore',
    links: [
      { label: 'Startups', href: '#' },
      { label: 'Enterprise', href: '#' },
      { label: 'Switch', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Customers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact support', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '/company/careers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
]

/* ─── Sidebar ─── */
function IntroSidebar() {
  const location = useLocation()

  return (
    <div
      className="z-20 hidden lg:block fixed bottom-0 right-auto w-[16.5rem]"
      id="sidebar"
      style={{ top: '0', paddingTop: '2rem' }}
    >
      <div className="absolute inset-0 z-10 overflow-auto pr-8 pb-10 pt-8" id="sidebar-content">
        <div className="relative lg:text-sm lg:leading-6">
          {/* Top gradient fade */}
          <div className="sticky top-0 h-8 z-10 bg-gradient-to-b from-[#191b1f]" />

          {/* Quick links */}
          <ul className="list-none" id="navigation-items">
            {docsTopLinks.map((link) => (
              <li key={link.label} className="list-none">
                <a
                  href="#"
                  className="ml-4 group flex items-center lg:text-sm lg:leading-6 mb-5 sm:mb-4 font-medium outline-offset-4 text-gray-400 hover:text-gray-300"
                >
                  <div className="mr-4 rounded-md p-1 text-white/50 bg-[#191b1f] brightness-[1.35] ring-1 hover:brightness-150 group-hover:brightness-100 group-hover:ring-0 ring-gray-700/40">
                    {link.icon === 'terminal' ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-gray-500"
                      >
                        <polyline points="4 17 10 11 4 5" />
                        <line x1="12" x2="20" y1="19" y2="19" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-gray-500"
                      >
                        <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
                      </svg>
                    )}
                  </div>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Sidebar sections */}
          {docsSidebar.map((section) => (
            <div key={section.title} className="mt-6 lg:mt-8">
              <div className="flex items-center gap-2.5 pl-4 mb-3.5 lg:mb-2.5 font-semibold text-gray-200">
                <h5>{section.title}</h5>
              </div>
              <ul className="space-y-px">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <li key={item.label}>
                      <a
                        className={
                          isActive
                            ? 'group flex items-start pr-3 py-1.5 cursor-pointer gap-x-3 text-left break-words hyphens-auto rounded-[10px] w-full outline-offset-[-1px] bg-[#818cf8]/10 text-[#818cf8] [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]'
                            : 'group flex items-start pr-3 py-1.5 cursor-pointer gap-x-3 text-left rounded-[10px] w-full outline-offset-[-1px] hover:bg-gray-200/5 text-gray-400 hover:text-gray-300'
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

/* ─── Social Icons ─── */
function XIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

/* ─── Main Component ─── */
export default function DocsIntroPage() {
  return (
    <div className="flex rounded-2xl h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)]">
      {/* Sidebar */}
      <IntroSidebar />

      {/* Content container */}
      <div
        className="flex-1 lg:ml-[16.5rem] overflow-y-auto rounded-2xl bg-[#191b1f] border border-white/[0.07]"
        id="content-container"
      >
        <div className="relative" id="content">
          {/* Background image */}
          <div className="absolute -top-14 left-0 right-0 opacity-80">
            <img
              src="/docs/background-dark.svg"
              className="object-contain pointer-events-none w-full h-auto"
              style={{ aspectRatio: '1152/388' }}
              alt=""
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
                  <div
                    className={`rounded-lg overflow-hidden bg-gradient-to-br ${card.gradient} bg-gray-800/50 aspect-[356/212] flex items-center justify-center group-hover:scale-105 transition-all duration-100`}
                  >
                    <span className="text-zinc-500 text-sm">{card.title}</span>
                  </div>
                  <h3 className="mt-5 text-zinc-50 font-medium">{card.title}</h3>
                  <span className="mt-1.5 text-zinc-500">{card.description}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-col items-center mx-auto border-t border-gray-800/50 w-full">
          <div className="flex w-full flex-col gap-12 justify-between px-8 py-16 md:py-20 lg:py-28 max-w-[984px] z-20">
            {/* Logo + social row */}
            <div className="flex flex-col md:flex-row gap-8 justify-between min-h-[76px]">
              <div className="flex md:flex-col justify-between items-center md:items-start min-w-16 md:min-w-20 lg:min-w-48 md:gap-y-24">
                <span className="text-xl font-bold text-white">Oxy Docs</span>
                <div className="gap-4 min-w-[140px] flex-wrap h-fit flex justify-end md:justify-start">
                  <a
                    href="#"
                    className="text-white/50 hover:text-white/70 transition-colors"
                    aria-label="X (Twitter)"
                  >
                    <XIcon />
                  </a>
                  <a
                    href="#"
                    className="text-white/50 hover:text-white/70 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <LinkedInIcon />
                  </a>
                  <a
                    href="#"
                    className="text-white/50 hover:text-white/70 transition-colors"
                    aria-label="GitHub"
                  >
                    <GitHubIcon />
                  </a>
                </div>
              </div>

              {/* 4-column link grid */}
              <div
                className="flex flex-col sm:grid max-md:!grid-cols-2 gap-8 flex-1"
                style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
              >
                {footerColumns.map((column) => (
                  <div key={column.title} className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-white mb-1">{column.title}</h4>
                    {column.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="text-sm text-white/50 hover:text-white/70 transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <div className="flex flex-col md:flex-row gap-4 items-center md:justify-between">
              <p className="text-sm text-gray-500">&copy; Oxy, Inc. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
