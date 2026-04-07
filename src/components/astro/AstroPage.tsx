const IMAGES = '/images/astro'

const features = [
  {
    title: 'Unlock the web with AI by your side',
    description:
      'Open an AI sidebar in any window to summarize content, compare products, or analyze data from any site you\u2019re viewing.',
    image: `${IMAGES}/sidechat.png`,
    eyebrow: `${IMAGES}/sidechat-eyebrow.svg`,
    imageAlt: 'Side chat running in browser',
    eyebrowAlt: 'Sidechat icon',
    imagePosition: 'left' as const,
  },
  {
    title: 'Picks up where you left off',
    description:
      'You choose what Astro remembers, so it can bring you relevant details when you need them.',
    image: `${IMAGES}/memories.png`,
    eyebrow: `${IMAGES}/memories-eyebrow.svg`,
    imageAlt: 'Browser memory inside Astro',
    eyebrowAlt: 'Memory icon',
    imagePosition: 'right' as const,
  },
  {
    title: 'Takes action for you',
    description:
      'In agent mode, Astro interacts with sites for you, always under your control. Use it to do tasks from start to finish, like researching and shopping for a trip.',
    image: `${IMAGES}/agent.png`,
    eyebrow: `${IMAGES}/agent-eyebrow.svg`,
    imageAlt: 'Agents at work inside Astro',
    eyebrowAlt: 'Agent icon',
    imagePosition: 'left' as const,
  },
  {
    title: 'Assists you when and where you need it',
    description:
      'Turn your cursor into a collaborator. Highlight text in emails, calendar invites, or docs, and get help from AI in one click.',
    image: `${IMAGES}/cursor.png`,
    eyebrow: `${IMAGES}/cursor-eyebrow.svg`,
    imageAlt: 'Rewrite anything inside Astro',
    eyebrowAlt: 'Cursor icon',
    imagePosition: 'right' as const,
  },
]

const moreFeatures = [
  {
    title: 'Smarter searches',
    description:
      'Get information the way you want to. Search text, images, videos, or news articles.',
    image: `${IMAGES}/smart-searches.png`,
  },
  {
    title: 'Easy to use',
    description:
      'Use tabs, autocomplete, a search bar, and bookmarks to easily navigate the web.',
    image: `${IMAGES}/easy-to-use.png`,
  },
  {
    title: 'Make it custom',
    description:
      'It\u2019s easy to set your browsing preferences and colors.',
    image: `${IMAGES}/make-it-custom.png`,
  },
]

function FeatureSection({
  title,
  description,
  image,
  eyebrow,
  imageAlt,
  eyebrowAlt,
  imagePosition,
}: (typeof features)[number]) {
  const isLeft = imagePosition === 'left'

  return (
    <section className="overflow-x-clip bg-background pt-24 md:pt-36">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-12 gap-y-8 md:gap-y-12 lg:gap-y-16">
          {/* Title */}
          <div className="col-span-12 flex flex-col items-center justify-center gap-4">
            <h2 className="z-1 max-w-2xl px-6 text-center text-3xl font-bold text-foreground text-balance sm:w-2/3 sm:px-0 md:text-4xl">
              {title}
            </h2>
          </div>

          {/* Image */}
          <div
            className={`col-span-12 md:col-span-7 md:row-start-2 ${
              isLeft
                ? 'pe-6 sm:pe-16 md:col-start-1'
                : 'ps-6 sm:ps-16 md:col-start-6'
            } relative`}
          >
            <div className="mx-auto h-full w-full overflow-hidden [filter:drop-shadow(0px_20px_18px_rgba(0,0,0,0.1))_drop-shadow(0px_8px_5px_rgba(0,0,0,0.08))]">
              <img
                alt={imageAlt}
                src={image}
                className="mx-auto"
                width={2763}
                height={1847}
                loading="lazy"
              />
            </div>
          </div>

          {/* Description + Eyebrow */}
          <div
            className={`col-span-12 flex flex-col items-center justify-center gap-6 px-6 md:col-span-5 md:row-start-2 md:items-start md:px-0 ${
              isLeft ? 'md:col-start-8' : 'md:col-start-1'
            }`}
          >
            <img
              alt={eyebrowAlt}
              src={eyebrow}
              className="mx-auto md:mx-0"
              width={120}
              height={40}
              loading="lazy"
            />
            <p className="max-w-4/5 text-lg font-semibold text-foreground text-pretty md:max-w-full">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AstroPageContent() {
  return (
    <div className="relative">
      {/* Background */}
      <div className="fixed inset-0 bg-sky-400">
        <div className="fixed inset-0 overflow-hidden opacity-100 transition-opacity duration-[450ms] ease-linear">
          <div className="fixed inset-0">
            <img
              alt=""
              className="pointer-events-none absolute h-0 w-0 select-none opacity-0"
              crossOrigin="anonymous"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              src={`${IMAGES}/hero-bg.jpg`}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 transition-colors duration-500">
        {/* ── Hero ── */}
        <section className="relative mt-10 w-full sm:mt-20">
          <div className="pointer-events-none absolute bottom-0 z-[-1] h-[500px] w-full bg-gradient-to-b from-transparent to-background" />

          <div className="mx-auto grid w-full max-w-7xl grid-cols-12 flex-col items-center gap-8 md:gap-12">
            {/* Title block */}
            <div className="relative col-span-12 row-start-1 flex flex-col items-center px-4 selection:bg-transparent md:px-6">
              {/* Blue glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -z-10 h-[350px] w-[700px] translate-y-[20px] transform bg-[radial-gradient(ellipse_at_center,_var(--color-blue-500)_0%,_color-mix(in_srgb,var(--color-blue-500)_30%,transparent)_35%,_transparent_70%)] sm:w-[1000px]"
              />

              {/* App icon */}
              <div className="mb-4 h-[80px] w-[80px] md:mb-6">
                <div className="mx-auto h-full w-full overflow-hidden rounded-[24%]">
                  <img
                    alt="Astro icon"
                    src={`${IMAGES}/icon.png`}
                    className="mx-auto"
                    width={1024}
                    height={1024}
                  />
                </div>
              </div>

              <h1 className="text-center text-5xl font-bold text-white md:text-6xl">
                Astro
              </h1>

              <a
                className="mt-4 inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:mt-6"
                href="#"
              >
                Download for macOS*
              </a>

              <p className="mt-2 text-center text-sm text-white/60">
                Currently only available on macOS
              </p>
            </div>

            {/* Video */}
            <div className="col-span-12 col-start-1 select-none px-6 md:col-span-10 md:col-start-2 md:px-0 xl:col-span-8 xl:col-start-3">
              <div className="drop-shadow-[0_20px_50px_color-mix(in_srgb,var(--color-blue-300)_75%,transparent)]">
                <div className="relative mx-auto aspect-video h-full w-full overflow-hidden rounded-2xl border border-border">
                  <iframe
                    src="https://player.vimeo.com/video/1129227761?h=94755e8733&badge=0&autopause=0&player_id=0&app_id=58479&controls=1&muted=1"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    title="Video introducing Astro"
                    className="absolute -start-px -top-px h-[calc(100%+2px)] w-[calc(100%+2px)]"
                  />
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="col-span-12 col-start-1 w-full px-6 lg:col-span-6 lg:col-start-4 lg:px-0">
              <p className="text-center text-2xl font-semibold text-foreground text-balance md:text-3xl">
                Browse the web with AI by your side for instant answers, smarter
                suggestions, and help with tasks — all with privacy settings you
                control.
              </p>
            </div>
          </div>
        </section>

        {/* ── Feature Sections ── */}
        {features.map((feature) => (
          <FeatureSection key={feature.title} {...feature} />
        ))}

        {/* ── Privacy Section ── */}
        <section className="overflow-x-clip bg-background pt-24 md:pt-36">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-12 gap-y-2 md:gap-y-4">
              <div className="col-span-12 flex flex-col items-center justify-center gap-4">
                <div className="max-w-xl px-4">
                  <img
                    alt="Privacy"
                    src={`${IMAGES}/privacy.svg`}
                    className="mx-auto"
                    width={488}
                    height={170}
                    loading="lazy"
                  />
                </div>
                <h2 className="z-1 max-w-2xl px-6 text-center text-3xl font-bold text-foreground text-balance sm:w-2/3 sm:px-0 md:text-4xl">
                  You&apos;re in control
                </h2>
              </div>
              <div className="col-span-12 flex items-center justify-center px-6 md:col-span-6 md:col-start-4 md:px-0">
                <p className="max-w-4/5 text-center text-lg font-semibold text-foreground text-balance md:max-w-full">
                  You decide which sites Astro can see, clear your browsing
                  history, use incognito, and manage browser memories anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── More Features ── */}
        <section className="relative w-full">
          <h2 className="mx-auto bg-background px-16 pt-24 text-center text-2xl font-semibold text-foreground md:px-24 md:pt-36 md:text-3xl">
            More features
          </h2>

          <div className="relative selection:bg-transparent">
            <div className="pointer-events-none absolute inset-x-0 -bottom-[50px] top-0 z-[-1] bg-[linear-gradient(180deg,var(--color-background)_0%,var(--color-background)_calc(100%-325px),transparent_100%)]" />

            <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 pb-44 pt-8 sm:px-16 md:flex-row md:gap-4 md:px-8">
              {moreFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-1 flex-col items-center gap-4 md:gap-6"
                >
                  <div className="overflow-hidden rounded-2xl border border-border bg-background">
                    <img
                      alt={feature.title}
                      src={feature.image}
                      className="mx-auto"
                      width={1130}
                      height={634}
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-center text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-center text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="relative mt-10 w-full sm:mt-20">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-12 flex-col items-center gap-8 md:gap-12">
            <div className="relative col-span-12 row-start-1 flex flex-col items-center px-4 selection:bg-transparent md:px-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -z-10 h-[350px] w-[700px] translate-y-[20px] transform bg-[radial-gradient(ellipse_at_center,_var(--color-blue-500)_0%,_color-mix(in_srgb,var(--color-blue-500)_30%,transparent)_35%,_transparent_70%)] sm:w-[1000px]"
              />

              <div className="mb-4 h-[80px] w-[80px] md:mb-6">
                <div className="mx-auto h-full w-full overflow-hidden rounded-[24%]">
                  <img
                    alt="Astro icon"
                    src={`${IMAGES}/icon.png`}
                    className="mx-auto"
                    width={1024}
                    height={1024}
                  />
                </div>
              </div>

              <h2 className="text-center text-4xl font-bold text-white md:text-5xl">
                Download Astro
              </h2>

              <a
                className="mt-4 inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:mt-6"
                href="#"
              >
                Download for macOS*
              </a>

              <p className="mt-2 text-center text-sm text-white/60">
                Currently only available on macOS
              </p>
            </div>
          </div>
        </section>

        {/* Bottom spacing */}
        <div className="h-32" />
      </div>
    </div>
  )
}
