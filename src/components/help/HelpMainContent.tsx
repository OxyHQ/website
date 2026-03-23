import { resourceCards, popularSearches, gettingStartedArticles } from '../../data/help'

export default function HelpMainContent() {
  return (
    <div className="col-[2/-3] flex flex-col items-center pt-19 pb-10 max-lg:col-[1/-1] max-lg:pt-10">
      {/* Hero */}
      <div className="flex flex-col items-center text-center">
        <h1 className="mt-6 text-heading-lg">How can we help?</h1>
        <div className="mt-4 max-w-[20em] text-pretty text-secondary-foreground text-xl">
          Get answers to common questions on all things Oxy
        </div>
      </div>

      {/* Search bar */}
      <div className="mt-10 flex w-full max-w-[558px] flex-col items-center md:mt-8">
        <button className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-11.5 gap-x-2 rounded-xl px-3.5 button-outline w-full pr-2.5 text-sm shadow-[0px_1px_2px_-1px_rgba(28,40,64,0.08),_0px_2px_4px_0px_rgba(28,40,64,0.04)]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m15.8 15.8-3.62-3.62M1.8 7.833a6.034 6.034 0 1 1 12.069 0 6.034 6.034 0 0 1-12.07 0Z" />
          </svg>
          <p className="w-full truncate text-left text-accent-foreground">Search help (e.g. integrations, importing, or billing)</p>
          <div className="flex gap-x-1 text-caption-foreground">
            <div className="flex size-7 items-center justify-center rounded-lg border border-subtle-stroke border-b-2 shadow-[0px_1px_0px_1px_#E4E7EC]">⌘</div>
            <div className="flex size-7 items-center justify-center rounded-lg border border-subtle-stroke border-b-2 shadow-[0px_1px_0px_1px_#E4E7EC]">K</div>
          </div>
        </button>

        {/* Popular searches */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-accent-foreground mt-4 md:mt-5">
          <p className="shrink-0 text-accent-foreground text-sm">Popular searches:</p>
          <ul className="flex gap-1.5 text-xs">
            {popularSearches.map((term) => (
              <li key={term}>
                <button className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 gap-x-1.5 rounded-[10px] px-2.5 text-xs button-outline !bg-secondary-background hover:!bg-surface-subtle !text-accent-foreground h-7">
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Resource cards */}
      <div className="mt-25 grid w-full grid-cols-3 gap-5 max-lg:grid-cols-1 max-lg:gap-4 max-md:mt-15">
        {resourceCards.map((card) => (
          <a
            key={card.title}
            className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-subtle-stroke p-6 pt-5.5 transition-colors duration-400 ease-in-out hover:border-white-800 hover:duration-150 active:border-white-800 active:duration-50 size-full"
            href={card.href}
          >
            <div className="pointer-events-none absolute inset-0 bg-secondary-background opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50 group-active:opacity-100 group-active:duration-50" />
            <div className="relative flex items-center justify-between">
              <span className="relative size-11 max-lg:size-10 flex items-center justify-center text-2xl">{card.icon}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative shrink-0 text-secondary-foreground opacity-0 -translate-x-0.25 transition-[opacity,translate] duration-400 ease-in-out group-hover:translate-0 group-hover:opacity-100 group-hover:duration-150 group-active:translate-0 group-active:opacity-100 group-active:duration-50">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
              </svg>
            </div>
            <div className="relative flex flex-col gap-1">
              <h3 className="font-semibold text-secondary-foreground">{card.title}</h3>
              <p className="text-balance text-sm text-tertiary-foreground">{card.description}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Separator */}
      <svg width="100%" height="1" className="text-subtle-stroke my-15 md:my-25">
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
      </svg>

      {/* Get started with Oxy 101 */}
      <div className="flex flex-col justify-between gap-x-[clamp(24px,calc(33.8%-215.304px),105px)] gap-y-10 xl:flex-row self-stretch">
        <div className="w-full xl:max-w-96">
          <h2 className="text-heading-md">
            <span>Get started </span>
            <span style={{ color: 'rgb(114, 123, 132)' }}>with </span>
            <br />
            <span style={{ color: 'rgb(114, 123, 132)' }}>Oxy 101.</span>
          </h2>
          <p className="mt-3 text-tertiary-foreground">Everything you need to master the basics of Oxy.</p>
        </div>
        <div>
          <ul>
            {gettingStartedArticles.map((article) => (
              <li key={article.number} className="border-white-500 border-b pt-8 pb-[31px] first-of-type:pt-0">
                <a className="group -m-2 flex gap-x-8 rounded-xl p-2" href={article.href}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white-400 text-accent-foreground text-sm shadow-[0px_2px_4px_0px_rgba(28,40,64,0.04),0px_1px_2px_-1px_rgba(28,40,64,0.08)] transition-[border-color] group-hover:border-black-700">
                    {article.number}
                  </div>
                  <div>
                    <p className="text-balance font-semibold">{article.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-balance text-tertiary-foreground transition-[color] group-hover:text-secondary-foreground">
                      {article.description}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <a className="-m-px mt-7 inline-block rounded-sm p-px text-caption-foreground transition-[color] hover:text-black-800 active:text-accent-foreground" href="#">
            See all articles...
          </a>
        </div>
      </div>
    </div>
  )
}
