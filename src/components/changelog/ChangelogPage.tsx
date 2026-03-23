import { changelogData } from '../../data/changelog'

export default function ChangelogContent() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container relative">
          <header
            className="flex w-full flex-col pt-30 max-xl:pt-25 max-lg:pt-20 items-center pb-30 max-lg:pb-25"
            style={{ '--animate-delay': '0ms', '--animate-delay-mobile': '0ms' } as React.CSSProperties}
          >
            <div className="inline-block w-fit rounded-[13px] border border-weak-stroke bg-primary-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-secondary-foreground mb-6">
              <h1>Changelog</h1>
            </div>
            <h2 className="max-w-[15em] text-balance text-heading-responsive-lg text-center">
              What's new?
            </h2>
            <p className="mt-4 max-w-xl text-balance text-lg text-secondary-foreground lg:text-xl text-center">
              A rundown of the latest Oxy feature releases, product enhancements, design updates, and important bug fixes.
            </p>
            <form className="flex flex-col gap-2 mt-6 w-full max-w-xs" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-y-1.5">
                <div>
                  <input
                    className="block w-full rounded-[10px] bg-primary-background p-[10px_13px] outline-hidden transition-all duration-300 ease-out text-secondary-foreground placeholder:text-accent-foreground border border-default-stroke hover:border-greyscale-light-08 hover:shadow-[0px_1px_4px_rgba(56,_62,_71,_0.1)] focus:border-blue-500 focus:ring-[3px] focus:ring-blue-300 placeholder:max-w-full placeholder:text-base placeholder-shown:truncate"
                    placeholder="Your email address"
                    type="text"
                  />
                </div>
              </div>
              <button
                className="inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default h-11.5 gap-x-2 rounded-xl px-3.5 text-base button-primary relative"
                type="submit"
              >
                <span className="transition-opacity duration-150">Subscribe</span>
              </button>
            </form>
          </header>
        </div>
      </section>

      {/* Article List */}
      <div className="container pb-[60px] lg:pb-[90px]">
        {changelogData.map((group) =>
          group.entries.map((entry) => (
            <article
              key={entry.id}
              className="relative grid border-subtle-stroke border-b py-[60px] lg:grid-cols-[1fr_600px_1fr] lg:py-[90px]"
            >
              {/* Sticky date - desktop (shown on every entry in original) */}
              <time className="sticky top-32 hidden text-nowrap text-accent-foreground text-sm lg:flex min-[1320px]:pl-40">
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
                    <div className="text-tertiary-foreground text-xs lg:text-sm">
                      {tag.label}
                    </div>
                  </div>
                ))}
              </aside>

              {/* Content */}
              <div className="mt-6 lg:col-start-2">
                <h2
                  className="font-semibold text-secondary-foreground text-xl lg:font-semibold lg:text-2xl"
                  id={entry.id}
                >
                  {entry.title}
                </h2>
                <div id="content" className="font-normal leading-6.5 mt-5 text-tertiary-foreground">
                  <div>
                    {entry.content.map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className="not-first:mt-5 text-pretty"
                        dangerouslySetInnerHTML={{ __html: paragraph }}
                      />
                    ))}
                    {entry.listItems && (
                      <ul className="not-first:mt-1.5 list-[square] pl-3.5 marker:text-white-600">
                        {entry.listItems.map((item, liIndex) => (
                          <li
                            key={liIndex}
                            className="pt-1 pl-1.5 first:pt-1.5"
                            dangerouslySetInnerHTML={{ __html: item }}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Mobile date */}
                <time className="mt-5 text-accent-foreground text-xs lg:hidden" aria-hidden="true">
                  {entry.date}
                </time>

                {/* Media placeholder */}
                {entry.mediaType && (
                  <div
                    className="relative box-content overflow-hidden mt-10 rounded-3xl border border-subtle-stroke"
                    style={{ aspectRatio: entry.mediaAspect || '1.25 / 1' }}
                  >
                    <div className="flex h-full w-full items-center justify-center bg-surface-subtle text-accent-foreground text-sm">
                      Media placeholder
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </>
  )
}
