import { changelogData } from '../../data/changelog'

export default function ChangelogContent() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="container relative">
          <div className="relative isolate border-x border-border">
            <div className="absolute bottom-0 left-0 z-10 w-full h-[200px] bg-[linear-gradient(to_bottom,transparent,var(--color-border))]" aria-hidden="true" />
            {/* Dot pattern background */}
            <svg
              width="100%"
              height="100%"
              className="mask-t-to-50% absolute inset-0 text-muted"
            >
              <defs>
                <pattern id="changelog-hero-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                  <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#changelog-hero-dots)" />
            </svg>

            <div className="relative z-20 grid grid-cols-12">
              <div className="relative col-[2/-2]">
                <header
                  className="flex w-full flex-col pt-30 max-xl:pt-25 max-lg:pt-20 items-center pb-30 max-lg:pb-25"
                  style={{ '--animate-delay': '0ms', '--animate-delay-mobile': '0ms' } as React.CSSProperties}
                >
                  <div className="inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-foreground mb-6">
                    <h1>Changelog</h1>
                  </div>
                  <h2 className="max-w-[15em] text-balance text-heading-responsive-lg text-center">
                    What&apos;s new?
                  </h2>
                  <p className="mt-4 max-w-xl text-balance text-lg text-foreground lg:text-xl text-center">
                    A rundown of the latest Oxy feature releases, product enhancements, design updates, and important bug fixes.
                  </p>
                  <form className="flex flex-col gap-2 mt-6 w-full max-w-xs" onSubmit={(e) => e.preventDefault()}>
                    <div className="flex flex-col gap-y-1.5">
                      <div>
                        <input
                          className="block w-full rounded-[10px] bg-background p-[10px_13px] outline-hidden transition-all duration-300 ease-out text-foreground placeholder:text-muted-foreground border border-input hover:border-input hover:shadow-[0px_1px_4px_rgba(56,_62,_71,_0.1)] focus:border-primary focus:ring-[3px] focus:ring-ring/30 placeholder:max-w-full placeholder:text-base placeholder-shown:truncate"
                          placeholder="Your email address"
                          type="text"
                          name="email"
                        />
                      </div>
                    </div>
                    <button
                      className="inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default h-11.5 gap-x-2 rounded-xl px-3.5 text-base has-[>svg:last-child,>img:last-child]:pr-3 has-[>svg:first-child,>img:first-child]:pl-3 button-primary relative"
                      type="submit"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="animate-spin opacity-0 transition-opacity duration-150">
                          <circle cx="9" cy="9" r="8" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" />
                          <path d="M17 9C17 10.0506 16.7931 11.0909 16.391 12.0615C15.989 13.0321 15.3997 13.914 14.6569 14.6569C13.914 15.3997 13.0321 15.989 12.0615 16.391C11.0909 16.7931 10.0506 17 9 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="transition-opacity duration-150">Subscribe</span>
                    </button>
                  </form>
                </header>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <svg width="100%" height="1" className="w-full text-border">
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
      </svg>

      {/* Article List */}
      <div className="container pb-[60px] lg:pb-[90px]">
        <div className="border-x border-border">
          <div className="grid grid-cols-12">
            <div className="col-[2/-2]">
              {changelogData.map((group) =>
                group.entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="relative grid border-border border-b py-[60px] lg:grid-cols-[1fr_minmax(0,600px)_1fr] lg:py-[90px]"
                  >
                    {/* Sticky date - desktop */}
                    <time className="sticky top-32 hidden text-nowrap text-muted-foreground text-sm lg:flex">
                      {entry.date}
                    </time>

                    {/* Tags row */}
                    <aside className="flex flex-wrap gap-x-[18px] gap-y-1 lg:col-start-2 lg:gap-x-5">
                      {entry.tags.map((tag) => (
                        <div key={tag.label} className="flex items-center gap-x-1.5">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <div className="text-muted-foreground text-xs lg:text-sm">
                            {tag.label}
                          </div>
                        </div>
                      ))}
                    </aside>

                    {/* Content */}
                    <div className="mt-6 lg:col-start-2">
                      <h2
                        className="font-semibold text-foreground text-xl lg:font-semibold lg:text-2xl"
                        id={entry.id}
                      >
                        {entry.title}
                      </h2>
                      <div className="font-normal leading-6.5 mt-5 text-muted-foreground">
                        <div>
                          {entry.content.map((paragraph, pIndex) => (
                            <p
                              key={pIndex}
                              className="not-first:mt-5 text-pretty [h4+&:not(:first-child)]:mt-2.5 [p+&:not(:first-child)]:mt-5"
                              dangerouslySetInnerHTML={{ __html: paragraph }}
                            />
                          ))}
                          {entry.listItems && (
                            <ul className="not-first:mt-1.5 list-[square] pl-3.5 marker:text-muted-foreground">
                              {entry.listItems.map((item, liIndex) => (
                                <li
                                  key={liIndex}
                                  className="pt-1 pl-1.5 first:pt-1.5 [&:not(:has(ul,li))]:pb-1.5"
                                >
                                  <p
                                    className="not-first:mt-5 text-pretty [h4+&:not(:first-child)]:mt-2.5 [p+&:not(:first-child)]:mt-5"
                                    dangerouslySetInnerHTML={{ __html: item }}
                                  />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Mobile date */}
                      <time className="mt-5 text-muted-foreground text-xs lg:hidden" aria-hidden="true">
                        {entry.date}
                      </time>

                      {/* Media placeholder */}
                      {entry.mediaType && (
                        <figure className="mt-10">
                          <div
                            className="rounded-3xl border border-border overflow-hidden bg-surface flex items-center justify-center text-muted-foreground text-sm"
                            style={{ aspectRatio: entry.mediaAspect || '1.25 / 1' }}
                          >
                            Media placeholder
                          </div>
                        </figure>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
