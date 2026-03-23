import { useLocation } from 'react-router-dom'
import { docsSidebar, docsCards } from '../../data/docs'
import type { DocsCard } from '../../data/docs'

function CardIcon({ icon }: { icon: DocsCard['icon'] }) {
  if (icon === 'react') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[#818cf8]">
        <circle cx="12" cy="12" r="2.5" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </svg>
    )
  }
  if (icon === 'server') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[#818cf8]">
        <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
        <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
        <line x1="6" x2="6.01" y1="6" y2="6" />
        <line x1="6" x2="6.01" y1="18" y2="18" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[#818cf8]">
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
    <aside className="hidden lg:block w-[19.5rem] shrink-0 border-r border-gray-300/[0.06] overflow-y-auto">
      <div className="relative lg:text-sm lg:leading-6 py-10 pl-6 pr-6">
        {docsSidebar.map((section, sectionIdx) => (
          <div key={section.title} className={sectionIdx === 0 ? '' : 'mt-8'}>
            <h5 className="mb-3.5 lg:mb-2.5 font-semibold text-gray-200 pl-4">
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
                          ? 'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left break-words hyphens-auto rounded-xl w-full outline-offset-[-1px] bg-[#818cf8]/10 text-[#818cf8] [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]'
                          : 'group flex items-start pr-3 py-1.5 pl-4 cursor-pointer gap-x-3 text-left rounded-xl w-full outline-offset-[-1px] hover:bg-gray-200/5 text-gray-400 hover:text-gray-300'
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
    <div className="relative antialiased text-gray-400">
      {/* Docs sub-navbar with tabs */}
      <div className="border-b border-gray-300/[0.06]">
        <div className="container">
          <div className="hidden lg:flex h-12">
            <div className="h-full flex text-sm gap-x-6">
              <a className="group relative h-full gap-2 flex items-center font-medium text-gray-200 [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]" href="/developers/docs">
                Overview
                <div className="absolute bottom-0 h-[1.5px] w-full left-0 bg-[#818cf8]" />
              </a>
              <a className="group relative h-full gap-2 flex items-center font-medium text-gray-400 hover:text-gray-300" href="#">
                App SDK
              </a>
              <a className="group relative h-full gap-2 flex items-center font-medium text-gray-400 hover:text-gray-300" href="#">
                REST API
              </a>
              <a className="group relative h-full gap-2 flex items-center font-medium text-gray-400 hover:text-gray-300" href="#">
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
        <div className="relative grow box-border flex-col w-full mx-auto px-6 lg:px-12 py-10 min-w-0">
          {/* Header */}
          <header className="relative leading-none">
            <div className="mt-0.5 space-y-2.5">
              <div className="h-5 text-[#818cf8] text-sm font-semibold">Get started</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center relative gap-2 min-w-0">
                <h1 className="text-2xl sm:text-3xl text-gray-200 tracking-tight [overflow-wrap:anywhere] font-bold break-all">
                  Overview
                </h1>
              </div>
            </div>
            <div className="mt-2 text-lg text-gray-400">
              <p>Start building Oxy Apps</p>
            </div>
          </header>

          {/* Content */}
          <div className="relative mt-8 mb-14 [contain:inline-size] isolate max-w-3xl">
            <p className="text-gray-400 leading-7">
              Oxy is a revolutionary CRM platform which is highly customisable, incredibly powerful and
              data-driven. In these guides, you can find everything you need to build powerful integrations,
              automations and data pipelines on top of Oxy.
            </p>
            <p className="text-gray-400 leading-7 mt-4">
              Our docs cover guides, examples, references and code to help you build apps and share them with
              Oxy's customers or for your own workspace.
            </p>
            <p className="text-gray-400 leading-7 mt-4">
              The Oxy Developer Platform consists of three parts:
            </p>

            {/* Cards */}
            <div className="mt-4 space-y-2">
              {docsCards.map((card) => (
                <div
                  key={card.title}
                  className="card block font-normal group relative ring-2 ring-transparent rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden w-full cursor-pointer hover:!border-[#818cf8]"
                  tabIndex={0}
                  role="link"
                >
                  <div className="px-6 py-5 relative">
                    <a href={card.href} tabIndex={-1} aria-hidden="true" style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }}>
                      <div className="h-6 w-6 text-gray-100">
                        <CardIcon icon={card.icon} />
                      </div>
                      <div className="w-full">
                        <h2 className="font-semibold text-base text-white mt-4">
                          {card.title}
                        </h2>
                        <div className="mt-1 font-normal text-base leading-6 text-gray-400">
                          <p>{card.description}</p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-gray-400 leading-7 mt-4">
              You can use both the App SDK and REST API in your app to build rich experiences.
            </p>
          </div>

          {/* Feedback */}
          <div className="pb-16 w-full flex flex-col gap-y-8 max-w-3xl">
            <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
              <p className="inline-block text-sm text-gray-400 whitespace-nowrap">Was this page helpful?</p>
              <div className="flex flex-wrap flex-grow gap-3 items-center justify-between">
                <div className="flex gap-3 items-center">
                  <button className="px-3.5 py-2 flex flex-row gap-3 items-center rounded-xl text-gray-400 hover:text-gray-300 border border-white/10 hover:border-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M7 10v12" />
                      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                    </svg>
                    <small className="text-sm font-normal leading-4">Yes</small>
                  </button>
                  <button className="px-3.5 py-2 flex flex-row gap-3 items-center rounded-xl text-gray-400 hover:text-gray-300 border border-white/10 hover:border-gray-500">
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
          <div className="px-0.5 flex items-center text-sm font-semibold text-gray-200 pb-16 border-t border-gray-800/50 pt-10 max-w-3xl">
            <a className="flex items-center ml-auto space-x-3 group" href="#">
              <span className="group-hover:text-white">Quickstart</span>
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
