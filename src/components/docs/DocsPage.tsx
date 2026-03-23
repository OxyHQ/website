import { useLocation } from 'react-router-dom'
import { docsSidebar, docsCards } from '../../data/docs'
import type { DocsCard } from '../../data/docs'

function CardIcon({ icon }: { icon: DocsCard['icon'] }) {
  if (icon === 'react') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[var(--color-blue-500)]">
        <circle cx="12" cy="12" r="2.5" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </svg>
    )
  }
  if (icon === 'server') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[var(--color-blue-500)]">
        <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
        <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
        <line x1="6" x2="6.01" y1="6" y2="6" />
        <line x1="6" x2="6.01" y1="18" y2="18" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[var(--color-blue-500)]">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  )
}

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

export default function DocsPage() {
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
          {/* Header */}
          <header className="relative leading-none">
            <div className="mt-0.5 space-y-2.5">
              <div className="h-5 text-[var(--color-blue-500)] text-sm font-semibold">Get started</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center relative gap-2 min-w-0">
                <h1 className="text-2xl sm:text-3xl text-secondary-foreground tracking-tight [overflow-wrap:anywhere] font-bold break-all">
                  Overview
                </h1>
                <div id="page-context-menu" className="items-center shrink-0 min-w-[156px] justify-end ml-auto sm:flex hidden">
                  <button
                    className="rounded-l-xl px-3 text-secondary-foreground py-1.5 border border-subtle-stroke bg-primary-background hover:bg-surface-subtle border-r-0"
                    aria-label="Copy page"
                    onClick={() => {
                      const content = document.querySelector('[data-docs-content]')?.textContent
                      if (content) navigator.clipboard.writeText(content)
                    }}
                  >
                    <div className="flex items-center gap-2 text-sm text-center font-medium">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                        <path d="M14.25 5.25H7.25C6.14543 5.25 5.25 6.14543 5.25 7.25V14.25C5.25 15.3546 6.14543 16.25 7.25 16.25H14.25C15.3546 16.25 16.25 15.3546 16.25 14.25V7.25C16.25 6.14543 15.3546 5.25 14.25 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2.80103 11.998L1.77203 5.07397C1.61003 3.98097 2.36403 2.96397 3.45603 2.80197L10.38 1.77297C11.313 1.63397 12.19 2.16297 12.528 3.00097" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Copy page</span>
                    </div>
                  </button>
                  <button
                    className="group disabled:pointer-events-none [&>span]:line-clamp-1 overflow-hidden flex items-center py-0.5 gap-1 text-sm text-tertiary-foreground group-hover:text-secondary-foreground rounded-none rounded-r-xl border px-3 border-subtle-stroke aspect-square bg-primary-background hover:bg-surface-subtle"
                    aria-label="More actions"
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded="false"
                  >
                    <svg width="8" height="24" viewBox="0 -9 3 24" className="transition-transform text-accent-foreground overflow-visible group-hover:text-secondary-foreground rotate-90">
                      <path d="M0 0L3 3L0 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-2 text-lg text-tertiary-foreground">
              <p>Start building Oxy Apps</p>
            </div>
          </header>

          {/* Content */}
          <div className="relative mt-8 mb-14 [contain:inline-size] isolate max-w-3xl" data-docs-content>
            <p className="text-tertiary-foreground leading-7">
              Oxy is a revolutionary CRM platform which is highly customisable, incredibly powerful and
              data-driven. In these guides, you can find everything you need to build powerful integrations,
              automations and data pipelines on top of Oxy.
            </p>
            <p className="text-tertiary-foreground leading-7 mt-4">
              Our docs cover guides, examples, references and code to help you build apps and share them with
              Oxy's customers or for your own workspace.
            </p>
            <p className="text-tertiary-foreground leading-7 mt-4">
              The Oxy Developer Platform consists of three parts:
            </p>

            {/* Cards */}
            <div className="mt-4 space-y-2">
              {docsCards.map((card) => (
                <div
                  key={card.title}
                  className="card block font-normal group relative ring-2 ring-transparent rounded-2xl bg-secondary-background border border-subtle-stroke overflow-hidden w-full cursor-pointer hover:!border-[var(--color-blue-500)]"
                  tabIndex={0}
                  role="link"
                >
                  <div className="px-6 py-5 relative">
                    <a href={card.href} tabIndex={-1} aria-hidden="true" style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }}>
                      <div className="h-6 w-6 text-gray-100">
                        <CardIcon icon={card.icon} />
                      </div>
                      <div className="w-full">
                        <h2 className="font-semibold text-base text-primary-foreground mt-4">
                          {card.title}
                        </h2>
                        <div className="mt-1 font-normal text-base leading-6 text-tertiary-foreground">
                          <p>{card.description}</p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-tertiary-foreground leading-7 mt-4">
              You can use both the App SDK and REST API in your app to build rich experiences.
            </p>
          </div>

          {/* Feedback */}
          <div className="pb-16 w-full flex flex-col gap-y-8 max-w-3xl">
            <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
              <p className="inline-block text-sm text-tertiary-foreground whitespace-nowrap">Was this page helpful?</p>
              <div className="flex flex-wrap flex-grow gap-3 items-center justify-between">
                <div className="flex gap-3 items-center">
                  <button className="px-3.5 py-2 flex flex-row gap-3 items-center rounded-xl text-tertiary-foreground hover:text-secondary-foreground border border-subtle-stroke hover:border-default-stroke">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M7 10v12" />
                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                    </svg>
                    <small className="text-sm font-normal leading-4">Yes</small>
                  </button>
                  <button className="px-3.5 py-2 flex flex-row gap-3 items-center rounded-xl text-tertiary-foreground hover:text-secondary-foreground border border-subtle-stroke hover:border-default-stroke">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M17 14V2" />
                      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
                    </svg>
                    <small className="text-sm font-normal leading-4">No</small>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="px-0.5 flex items-center text-sm font-semibold text-secondary-foreground pb-16 border-t border-subtle-stroke pt-10 max-w-3xl">
            <a className="flex items-center ml-auto space-x-3 group" href="#">
              <span className="group-hover:text-primary-foreground">Quickstart</span>
              <svg viewBox="0 0 3 6" className="h-1.5 stroke-gray-400 overflow-visible group-hover:stroke-gray-300">
                <path d="M0 0L3 3L0 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
