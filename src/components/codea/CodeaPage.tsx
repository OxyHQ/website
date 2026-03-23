import {
  heroTitle,
  logoCompanies,
  features,
  changelogEntries,
  pressQuotes,
  highlights,
} from '../../data/codea'

const models = ['GPT-4o', 'Claude 4.6', 'Gemini 2.5', 'o3']

export default function CodeaPage() {
  return (
    <div className="cursor-theme">
      {/* 1. Hero Section */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="text-left mb-v2.5 max-w-prose">
            <h1 className="type-md-lg text-balance mb-v1">
              {heroTitle}
            </h1>
            <div className="flex justify-start gap-x-g1 items-center">
              <a className="btn" href="#">
                Download for Windows
                <div aria-hidden="true" className="btn-icon">
                  <span>&#x2913;</span>
                </div>
              </a>
              <a className="btn btn--secondary" href="#">
                Request a demo
                <div aria-hidden="true" className="btn-icon">
                  <span>&rarr;</span>
                </div>
              </a>
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

      {/* 2. Logo Garden */}
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

      {/* 3. Features Grid (3 cards) */}
      <section className="section section--flush-x">
        <section className="section bg-theme-bg text-theme-text section--flush-y">
          <div className="container mb-v4">
            {features.map((feature) => (
              <a
                key={feature.title}
                className="card card--large card--feature grid-cursor col-span-full mb-v1"
                href={feature.ctaHref}
              >
                <div className="col-span-full lg:col-start-1 lg:col-end-12 p-[var(--g2)]">
                  <div className="w-full max-w-prose">
                    <h3 className="type-base md:type-md text-pretty">
                      {feature.title}
                    </h3>
                    <div className="type-base md:type-md text-theme-text-sec text-pretty">
                      {feature.description}
                    </div>
                    <div className="mt-v1">
                      <span className="btn-tertiary">{feature.cta}</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-full lg:col-start-12 lg:col-end-25 aspect-video bg-theme-card rounded-xs" />
              </a>
            ))}
          </div>
        </section>
      </section>

      {/* 4. "The new way to build software" centered heading */}
      <section className="section bg-theme-bg text-theme-text overflow-hidden">
        <div className="container">
          <h2 className="type-lg text-balance mx-auto text-center">
            The new way to build software.
          </h2>
        </div>
      </section>

      {/* 5. Stay on the frontier (models + pricing) */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <h2 className="type-md-lg text-balance mb-v1">Stay on the frontier</h2>
          <div className="type-base text-theme-text-sec mb-v2 max-w-prose">
            Codea includes the latest frontier models. Switch between them at any time.
          </div>
          {/* Model cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-g1 gap-y-v1">
            {models.map((model) => (
              <div key={model} className="card card--sub p-[var(--g1)]">
                <div className="type-base font-medium">{model}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Changelog section */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <h2 className="type-md-lg text-theme-text mb-v1">Changelog</h2>
          <div className="grid gap-y-v1">
            {changelogEntries.map((entry) => (
              <div
                key={entry.version}
                className="card p-[var(--g1)] flex justify-between items-start"
              >
                <div>
                  <div className="type-base font-medium">v{entry.version}</div>
                  <ul className="mt-2 space-y-1 text-theme-text-sec type-sm">
                    {entry.items.map((item) => (
                      <li key={item}>&bull; {item}</li>
                    ))}
                  </ul>
                </div>
                <span className="text-theme-text-sec type-sm shrink-0">
                  {entry.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Press quotes */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-x-g1 gap-y-v1">
            {pressQuotes.map((q) => (
              <div key={q.source} className="card p-[var(--g1)]">
                <blockquote className="type-base text-theme-text">
                  &ldquo;{q.quote}&rdquo;
                </blockquote>
                <cite className="mt-2 block text-theme-text-sec type-sm not-italic">
                  &mdash; {q.source}
                </cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Recent highlights */}
      <section className="section bg-theme-card-hex text-theme-text">
        <div className="container">
          <h2 className="type-base text-theme-text mb-v1">Recent highlights</h2>
          <div className="grid md:grid-cols-3 gap-x-g1 gap-y-v1">
            {highlights.map((h) => (
              <div key={h.title} className="card p-[var(--g1)]">
                <h3 className="type-base font-medium">{h.title}</h3>
                <p className="mt-1 text-theme-text-sec type-sm">{h.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CTA */}
      <section className="section bg-theme-bg text-theme-text section--headline">
        <div className="container">
          <div className="text-center mx-auto max-w-prose-medium-wide">
            <h2 className="type-xl sm:type-2xl text-balance mx-auto mb-v1">
              Try Codea now.
            </h2>
            <div className="flex justify-center gap-x-g1 items-center">
              <a className="btn" href="#">
                Download for Windows
                <span className="btn-icon">&#x2913;</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
