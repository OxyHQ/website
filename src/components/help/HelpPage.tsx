import { Link } from 'react-router-dom'
import {
  helpCategories,
  gettingStartedArticles,
  sidebarSections,
  popularSearches,
} from '../../data/help'

/* ─── SVG Icons ─── */

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
        d="m15.8 15.8-3.62-3.62M1.8 7.833a6.034 6.034 0 1 1 12.069 0 6.034 6.034 0 0 1-12.07 0Z"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      className="transition-transform group-data-[open]:rotate-90"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 3L7.5 6L4.5 9"
        stroke="var(--color-muted-foreground)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="relative shrink-0 text-foreground opacity-0 -translate-x-0.25 transition-[opacity,translate] duration-400 ease-in-out group-hover:translate-0 group-hover:opacity-100 group-hover:duration-150 group-active:translate-0 group-active:opacity-100 group-active:duration-50"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
        d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5"
      />
    </svg>
  )
}

/* Placeholder icons for categories */
function AcademyIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
      <rect width="44" height="44" rx="10" fill="var(--color-surface)" />
      <path
        d="M22 14l-10 5 10 5 10-5-10-5z"
        stroke="var(--color-muted-foreground)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 21v6l8 4 8-4v-6"
        stroke="var(--color-muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ReferenceIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
      <rect width="44" height="44" rx="10" fill="var(--color-surface)" />
      <path
        d="M16 14h12a2 2 0 012 2v12a2 2 0 01-2 2H16a2 2 0 01-2-2V16a2 2 0 012-2z"
        stroke="var(--color-muted-foreground)"
        strokeWidth="1.5"
      />
      <path d="M18 19h8M18 22h8M18 25h5" stroke="var(--color-muted-foreground)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ApiIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
      <rect width="44" height="44" rx="10" fill="var(--color-surface)" />
      <path
        d="M18 17l-4 5 4 5M26 17l4 5-4 5M23 15l-2 14"
        stroke="var(--color-muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* Sidebar icon for section headers (smaller) */
function SidebarSectionIcon({ icon }: { icon: string }) {
  if (icon === 'academy') {
    return (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="size-7.5">
        <rect width="30" height="30" rx="7" fill="var(--color-surface)" />
        <path d="M15 9l-7 3.5 7 3.5 7-3.5L15 9z" stroke="var(--color-muted-foreground)" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M10 14v4l5 2.5 5-2.5v-4" stroke="var(--color-muted-foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (icon === 'reference') {
    return (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="size-7.5">
        <rect width="30" height="30" rx="7" fill="var(--color-surface)" />
        <path d="M10 9h10a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H10a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 0110 9z" stroke="var(--color-muted-foreground)" strokeWidth="1.2" />
        <path d="M12 13h6M12 15.5h6M12 18h4" stroke="var(--color-muted-foreground)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )
  }
  return null
}

/* Card icon (larger) */
function CardIcon({ icon, className = '' }: { icon: string; className?: string }) {
  if (icon === 'academy') return <AcademyIcon className={className} />
  if (icon === 'reference') return <ReferenceIcon className={className} />
  if (icon === 'api') return <ApiIcon className={className} />
  return null
}

/* ─── Sidebar ─── */

function HelpSidebar() {
  return (
    <nav className="col-[1/6] border-border border-r max-xl:col-[1/7] max-lg:hidden">
      <div className="sticky top-[var(--site-header-height,56px)] flex h-[calc(100vh-var(--site-header-height,56px))] flex-col pt-10">
        {/* Search button */}
        <div className="pr-6">
          <button className="relative inline-flex cursor-pointer items-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default h-9 gap-x-1.5 rounded-[10px] px-3 text-sm button-outline justify-between pr-2 w-full">
            <SearchIcon className="text-muted-foreground" />
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-muted-foreground">Search help</span>
              <div className="flex gap-1">
                <div className="pointer-events-none text-muted-foreground text-xs leading-3 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-md border-border border-x border-t border-b-2 bg-background px-1 pt-[3px] pb-0.5 shadow-[0px_1px_0px_1px_var(--color-border)]">
                  &#8984;
                </div>
                <div className="pointer-events-none text-muted-foreground text-xs leading-3 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-md border-border border-x border-t border-b-2 bg-background px-1 pt-[3px] pb-0.5 shadow-[0px_1px_0px_1px_var(--color-border)]">
                  K
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="mask-t-from-[calc(100%-40px)] relative flex-1 overflow-y-scroll pt-10 pr-6 pb-8 [scrollbar-gutter:stable]">
          <div className="mb-5 flex flex-col gap-5 lg:mb-8 lg:gap-8">
            {sidebarSections.map((section) => (
              <div key={section.name}>
                <a
                  className="flex items-center gap-[7px] rounded-[10px] py-px pl-px hover:bg-surface/80"
                  href={`/help/${section.name.toLowerCase()}`}
                >
                  <SidebarSectionIcon icon={section.icon} />
                  <div className="font-semibold text-xs uppercase">{section.name}</div>
                </a>
                <div className="mt-1 flex flex-col lg:gap-0.5">
                  {section.items.map((item) => (
                    <div key={item.label} className="group relative w-full">
                      <button
                        className="absolute top-0 left-0 cursor-pointer self-start rounded-[10px] p-2.5 ring-inset transition-[background-color] hover:bg-surface group-hover:bg-surface"
                        type="button"
                      >
                        <ChevronRight />
                      </button>
                      <a
                        className="inline-block w-full rounded-[10px] p-1.5 pr-2.5 pl-[38px] text-left text-muted-foreground text-sm hover:bg-surface"
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

/* ─── Main Content ─── */

function HelpContent() {
  return (
    <div className="col-[7/-1] pt-10 pb-20 max-lg:col-[1/-1] max-xl:col-[8/-1]">
      <section className="grid w-full grid-cols-18">
        <div className="col-[2/-3] flex flex-col items-center pt-19 pb-10 max-lg:col-[1/-1] max-lg:pt-10">
          {/* Hero */}
          <div className="flex flex-col items-center text-center">
            <h1 className="mt-6 text-heading-lg">How can we help?</h1>
            <div className="mt-4 max-w-[20em] text-pretty text-foreground text-xl">
              Get answers to common questions on all things Oxy
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-10 flex w-full max-w-[558px] flex-col items-center md:mt-8">
            <button className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default h-11.5 gap-x-2 rounded-xl px-3.5 button-outline w-full pr-2.5 text-sm shadow-[0px_1px_2px_-1px_rgba(28,40,64,0.08),_0px_2px_4px_0px_rgba(28,40,64,0.04)]">
              <SearchIcon />
              <p className="w-full truncate text-left text-muted-foreground">
                Search help (e.g. integrations, importing, or billing)
              </p>
              <div className="flex gap-x-1 text-muted-foreground">
                <div className="flex size-7 items-center justify-center rounded-lg border border-border border-b-2 shadow-[0px_1px_0px_1px_var(--color-border)]">
                  &#8984;
                </div>
                <div className="flex size-7 items-center justify-center rounded-lg border border-border border-b-2 shadow-[0px_1px_0px_1px_var(--color-border)]">
                  K
                </div>
              </div>
            </button>

            {/* Popular searches */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-muted-foreground mt-4 md:mt-5">
              <p className="shrink-0 text-muted-foreground text-sm">Popular searches:</p>
              <ul className="flex gap-1.5 text-xs">
                {popularSearches.map((s) => (
                  <li key={s}>
                    <button className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default gap-x-1.5 rounded-[10px] px-2.5 text-xs button-outline !bg-surface hover:!bg-surface !text-muted-foreground h-7">
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3 Resource cards */}
          <div className="mt-25 grid w-full grid-cols-3 gap-5 max-lg:grid-cols-1 max-lg:gap-4 max-md:mt-15">
            {helpCategories.map((cat) => (
              <Link
                key={cat.name}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border p-6 pt-5.5 transition-colors duration-400 ease-in-out hover:border-input hover:duration-150 active:border-input active:duration-50 size-full"
                to={cat.href}
              >
                <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50 group-active:opacity-100 group-active:duration-50" />
                <div className="relative flex items-center justify-between">
                  <CardIcon icon={cat.icon} className="relative size-11 max-lg:size-10" />
                  <ArrowRight />
                </div>
                <div className="relative flex flex-col gap-1">
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-balance text-sm text-muted-foreground">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <svg width="100%" height="1" className="text-border my-15 md:my-25">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
          </svg>

          {/* Get started section */}
          <div className="flex flex-col justify-between gap-x-[clamp(24px,calc(33.8%-215.304px),105px)] gap-y-10 xl:flex-row self-stretch">
            <div className="w-full xl:max-w-96">
              <div>
                <h2 className="text-heading-md">
                  <span>Get started </span>
                  <span className="text-muted-foreground">with </span>
                  <br />
                  <span className="text-muted-foreground">Oxy 101.</span>
                </h2>
              </div>
              <p className="mt-3 text-muted-foreground">
                Everything you need to master the basics of Oxy.
              </p>
            </div>
            <div>
              <ul>
                {gettingStartedArticles.map((article, i) => (
                  <li
                    key={article.title}
                    className="border-border border-b pt-8 pb-[31px] first-of-type:pt-0"
                  >
                    <a className="group -m-2 flex gap-x-8 rounded-xl p-2" href={article.href}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground text-sm shadow-[0px_2px_4px_0px_rgba(28,40,64,0.04),0px_1px_2px_-1px_rgba(28,40,64,0.08)] transition-[border-color] group-hover:border-input">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-balance font-semibold">{article.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-balance text-muted-foreground transition-[color] group-hover:text-foreground">
                          {article.description}
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
              <a
                className="-m-px mt-7 inline-block rounded-sm p-px text-muted-foreground transition-[color] hover:text-foreground active:text-muted-foreground"
                href="#"
              >
                See all articles...
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ─── Page Export ─── */

export default function HelpPageContent() {
  return (
    <div className="container">
      <div className="grid grid-cols-24">
        <HelpSidebar />
        <HelpContent />
      </div>
    </div>
  )
}
