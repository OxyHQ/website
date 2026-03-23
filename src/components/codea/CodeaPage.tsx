import {
  heroTitle,
  logoCompanies,
  features,
  testimonials,
  frontierCards,
  changelogEntries,
  highlights,
  footerColumns,
} from '../../data/codea'

export default function CodeaPage() {
  return (
    <div className="cursor-theme">
      {/* ── 1. Hero Section ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="text-left mb-v2.5 max-w-prose">
            <h1 className="type-md-lg text-balance mb-v1">
              {heroTitle}
            </h1>
            <div className="flex justify-start gap-x-g1 items-center">
              <div>
                <div className="hidden items-center md:flex">
                  <a className="btn" href="#">
                    Download for Windows
                    <div aria-hidden="true" className="btn-icon">
                      <span aria-hidden="true">&#x2913;</span>
                    </div>
                  </a>
                </div>
                <div className="flex items-center md:hidden">
                  <a href="#" className="btn">
                    Try mobile agent
                    <div aria-hidden="true" className="btn-icon">
                      <span aria-hidden="true">&rarr;</span>
                    </div>
                  </a>
                </div>
              </div>
              <div className="hidden md:block">
                <a className="btn btn--secondary" href="#">
                  Request a demo
                  <div aria-hidden="true" className="btn-icon">
                    <span aria-hidden="true">&rarr;</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
          {/* IDE screenshot placeholder */}
          <div className="media-border-container relative aspect-[16/10] bg-theme-card">
            <div className="absolute inset-0 flex items-center justify-center text-theme-text-sec text-sm">
              IDE Demo Preview
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Logo Garden ── */}
      <section className="section bg-theme-bg text-theme-text pb-v1.5 pt-0" id="logo-garden">
        <div className="stack container text-center">
          <h2 className="type-sm mb-v1">
            Trusted every day by teams that build world-class software
          </h2>
          <div className="logo-garden-responsive-8">
            {logoCompanies.map((name) => (
              <div key={name} className="relative flex items-center justify-center">
                <div className="bg-theme-card-hex card-border px-g0.75 flex h-[4rem] w-full items-center justify-center rounded-xs sm:h-[4.5rem] md:h-[6.25rem]">
                  <span className="text-theme-text-sec text-sm">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Feature Cards ── */}
      <section className="section section--flush-x">
        {features.map((feature, i) => (
          <section key={feature.title} className="section bg-theme-bg text-theme-text section--flush-y">
            <div className={i < features.length - 1 ? 'container mb-v4' : 'container'}>
              <div className="grid grid-rows-[auto_1fr]">
                <a
                  className="card card--large card--feature grid-cursor col-span-full row-span-full gap-y-0 max-lg:grid-rows-subgrid"
                  href={feature.ctaHref}
                >
                  {/* Text column */}
                  <div
                    className={`col-span-full row-start-1 row-end-2 grid lg:row-start-1 lg:row-end-3 lg:items-center ${
                      feature.layout === 'right'
                        ? 'lg:col-start-17 lg:col-end-25 lg:pr-g0.25 lg:pl-g3'
                        : 'lg:col-start-1 lg:col-end-9 lg:pl-g0.25 lg:pr-g3'
                    }`}
                  >
                    <div className={`w-full max-w-prose ${feature.layout === 'right' ? 'lg:justify-self-end' : 'lg:justify-self-start'}`}>
                      <div className="type-base">
                        <h3 className="type-base md:type-md text-pretty">{feature.title}</h3>
                        <div className="type-base md:type-md text-theme-text-sec text-pretty">
                          {feature.description}
                        </div>
                      </div>
                      <div className="mt-v8/12">
                        <span className="btn-tertiary">{feature.cta}</span>
                      </div>
                    </div>
                  </div>
                  {/* Media column */}
                  <div
                    className={`max-lg:mt-g1.75 col-span-full row-start-2 row-end-3 grid cursor-default items-end lg:row-start-1 lg:row-end-3 lg:items-center ${
                      feature.layout === 'right'
                        ? 'lg:col-start-1 lg:col-end-17'
                        : 'lg:col-start-9 lg:col-end-25'
                    }`}
                  />
                </a>
                {/* Overlay grid for media placeholder */}
                <div className="grid-cursor p-g1.75 col-span-full row-span-full gap-y-0 max-lg:grid-rows-subgrid pointer-events-none">
                  <div
                    className={`col-span-full row-start-1 row-end-2 grid lg:row-start-1 lg:row-end-2 lg:items-center ${
                      feature.layout === 'right'
                        ? 'lg:col-start-17 lg:col-end-25 lg:pr-g0.25 lg:pl-g3'
                        : 'lg:col-start-1 lg:col-end-9 lg:pl-g0.25 lg:pr-g3'
                    }`}
                  />
                  <div
                    className={`max-lg:pt-v1 col-span-full row-start-2 row-end-3 grid cursor-default items-end lg:row-start-2 lg:row-end-3 lg:items-center ${
                      feature.layout === 'right'
                        ? 'lg:col-start-1 lg:col-end-17'
                        : 'lg:col-start-9 lg:col-end-25'
                    }`}
                  >
                    <div className="media-border-container relative aspect-[4/3] bg-theme-card" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </section>

      {/* ── 4. "The new way to build software" + Testimonials ── */}
      <section className="section bg-theme-bg text-theme-text overflow-hidden">
        <div className="container">
          <div className="text-center mx-auto mb-v2.5 max-w-prose-medium-wide">
            <h2 className="type-lg text-balance mx-auto">The new way to build software.</h2>
          </div>
        </div>
        <div className="container">
          <div className="grid grid-cols-1 gap-g1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {testimonials.map((t) => (
              <div key={t.author} className={t.hidden ? 'hidden md:block' : ''}>
                <div className="card relative flex h-full min-h-[180px] w-full shrink-0 flex-col">
                  <figure className="flex h-full flex-col">
                    <blockquote className="grow overflow-hidden">
                      <p className="type-base line-clamp-4 whitespace-pre-wrap md:line-clamp-5">
                        {t.quote}
                      </p>
                    </blockquote>
                    <div className="mt-v2 flex items-center gap-g1">
                      <figcaption>
                        <div className="type-sm">
                          {t.author}{' '}
                          <span className="type-sm text-theme-text-sec block">{t.role}</span>
                        </div>
                      </figcaption>
                    </div>
                  </figure>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Stay on the frontier ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container my-v2">
          <div className="text-left mb-v1 max-w-prose-narrow">
            <h2 className="type-md-lg text-balance">Stay on the frontier</h2>
          </div>
          <div className="grid gap-g1 grid-cols-1 xl:grid-cols-3 items-stretch">
            {frontierCards.map((card) => (
              <div key={card.title} className="h-full">
                <div className="card flex h-full grow-1 flex-col">
                  <div className="type-base max-w-prose flex grow flex-col">
                    <div>
                      <h3>{card.title}</h3>
                      <div className="text-theme-text-sec text-pretty">{card.description}</div>
                    </div>
                    <div className="mt-auto pt-v8/12">
                      <a
                        className="btn-tertiary"
                        href={card.ctaHref}
                        {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {card.cta} {card.external ? '\u2197' : '\u2192'}
                      </a>
                    </div>
                  </div>
                  <figure className="pt-g1.75">
                    <div className="media-border-container relative aspect-[4/3] bg-theme-card" />
                  </figure>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Changelog ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <h2 className="type-md-lg text-theme-text mb-v1">Changelog</h2>
          <div className="gap-g1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {changelogEntries.map((entry) => (
              <article key={entry.title} className="flex flex-col">
                <a className="card stack pb-g2 grow-1" href={entry.href}>
                  <div className="text-theme-text-sec relative left-[-1px] flex items-center">
                    <time className="type-base">{entry.date}</time>
                  </div>
                  <p className="type-base text-theme-text">{entry.title}</p>
                </a>
              </article>
            ))}
          </div>
          <a className="btn-text mt-v1 inline-flex" href="#">
            See what&rsquo;s new in Codea &rarr;
          </a>
        </div>
      </section>

      {/* ── 7. Team / Join Us card ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container mb-v4">
          <div className="grid grid-rows-[auto_1fr]">
            <div className="card card--large grid-cursor col-span-full row-span-full gap-y-0 max-lg:grid-rows-subgrid">
              <div className="col-span-full row-start-1 row-end-2 grid lg:row-start-1 lg:row-end-3 lg:items-center lg:col-start-1 lg:col-end-9 lg:pl-g0.25 lg:pr-g3">
                <div className="w-full max-w-prose lg:justify-self-start">
                  <div className="type-base">
                    <h3 className="type-base md:type-md text-pretty">
                      Codea is an applied research team focused on building the future of software development.
                    </h3>
                  </div>
                  <div className="mt-v1">
                    <div className="flex justify-start gap-x-g1 items-center">
                      <a className="btn-tertiary" href="#">
                        Join us
                        <div aria-hidden="true" className="btn-icon">
                          <span aria-hidden="true">&rarr;</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="max-lg:mt-g1.75 col-span-full row-start-2 row-end-3 grid cursor-default items-end lg:row-start-1 lg:row-end-3 lg:items-center lg:col-start-9 lg:col-end-25" />
            </div>
            {/* Overlay for team photo placeholder */}
            <div className="grid-cursor p-g1.75 col-span-full row-span-full gap-y-0 max-lg:grid-rows-subgrid pointer-events-none">
              <div className="col-span-full row-start-1 row-end-2 grid lg:row-start-1 lg:row-end-2 lg:items-center lg:col-start-1 lg:col-end-9 lg:pl-g0.25 lg:pr-g3" />
              <div className="max-lg:pt-v1 col-span-full row-start-2 row-end-3 grid cursor-default items-end lg:row-start-2 lg:row-end-3 lg:items-center lg:col-start-9 lg:col-end-25">
                <div className="media-border-container relative aspect-video bg-theme-card" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Recent Highlights ── */}
      <section className="section bg-theme-card-hex text-theme-text">
        <div className="container">
          <div className="grid-cursor gap-0">
            <div className="col-span-full md:col-start-1 md:col-end-7 lg:col-start-1 lg:col-end-9 xl:col-start-1 xl:col-end-7">
              <h2 className="type-base text-theme-text mb-v1 sticky top-0 lg:mb-0">Recent highlights</h2>
            </div>
            <div className="col-span-full md:col-start-7 md:col-end-25 lg:col-start-9 lg:col-end-25 xl:col-start-7 xl:col-end-19">
              {highlights.map((h, i) => (
                <article key={h.title} className={`flex grow-1 flex-col${i < highlights.length - 1 ? ' mb-g1' : ''}`}>
                  <a className="card card--text grow-1" href={h.href}>
                    <div className="flex flex-col">
                      <div className="grow-1">
                        <p className="type-base text-theme-text text-pretty">{h.title}</p>
                        <p className="type-base text-theme-text-sec text-pretty">{h.description}</p>
                      </div>
                      <div className="mt-v1 text-theme-text-sec flex shrink-0 items-center">
                        <span className="capitalize">{h.category}&nbsp;&middot;&nbsp;</span>
                        <time className="type-base">{h.date}</time>
                      </div>
                    </div>
                  </a>
                </article>
              ))}
              <a className="btn-text mt-v1 inline-flex" href="#">View more posts &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. CTA ── */}
      <section className="section bg-theme-bg text-theme-text section--headline">
        <div className="container">
          <div className="text-center mx-auto max-w-prose-medium-wide">
            <h2 className="type-xl sm:type-2xl text-balance mx-auto mb-v1">
              Try Codea now.
            </h2>
            <div className="flex justify-center gap-x-g1 items-center">
              <div>
                <div className="hidden items-center md:flex">
                  <a className="btn" href="#">
                    Download for Windows
                    <div aria-hidden="true" className="btn-icon">
                      <span aria-hidden="true">&#x2913;</span>
                    </div>
                  </a>
                </div>
                <div className="flex items-center md:hidden">
                  <a href="#" className="btn">
                    Try mobile agent
                    <div aria-hidden="true" className="btn-icon">
                      <span aria-hidden="true">&rarr;</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Footer ── */}
      <footer className="pt-v3 pb-v3 md:pb-g3 px-g2 bg-theme-card-hex relative">
        <div className="mb-v4.5 container">
          <nav>
            <div className="gap-x-g1 gap-y-v2 grid grid-cols-2 md:grid-cols-5">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <h3 className="type-base md:type-sm text-theme-text-sec pb-v2.5/12">{col.title}</h3>
                  <ul className="space-y-0">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          className="type-base md:type-sm py-v2.5/12 footer-link inline-block hover:text-theme-text group"
                          href={link.href}
                          {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          {link.label}
                          {link.external && (
                            <span className="inline-block opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                              &nbsp;&nearr;
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>
        <div className="gap-v2 container flex flex-col items-start justify-between md:flex-row md:items-center">
          <div className="text-theme-text-sec flex items-center gap-g1.5">
            <small className="type-base md:type-sm">&copy; 2026 Oxy, Inc.</small>
            <small className="type-base md:type-sm">SOC 2 Certified</small>
          </div>
        </div>
      </footer>
    </div>
  )
}
