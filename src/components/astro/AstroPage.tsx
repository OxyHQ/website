import { useState, useCallback } from 'react'

const IMAGES = '/images/astro'

type Platform = 'macos' | 'windows' | 'linux'

const DOWNLOAD_LINKS: Record<Platform, string> = {
  macos: '#',
  windows: '#',
  linux: '#',
}

const PLATFORM_META: Record<Platform, { label: string; fileHint: string }> = {
  macos: { label: 'macOS', fileHint: '.dmg' },
  windows: { label: 'Windows', fileHint: '.exe' },
  linux: { label: 'Linux', fileHint: '.deb' },
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('win')) return 'windows'
  return 'linux'
}

function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  if (platform === 'macos') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    )
  }
  if (platform === 'windows') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .08V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91V13.1l10 .15z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.199.023.395-.049.543-.16.646-.484 1.342-.83 2.346-.016.32.26.659.288 1.028.098.359-.187.705-.634.966-1.214.09-.199.09-.398.132-.598.077-.399.159-.797.237-1.126.236-1.048.365-1.883.29-2.758-.077-.873-.535-1.667-.766-2.552a7.04 7.04 0 01-.27-2.407c.024-1.357.116-2.77-.199-4.065-.308-1.256-.891-2.263-2.224-2.39-1.016-.098-1.898.503-2.596 1.07-.466-.266-.91-.512-1.245-.698a18.816 18.816 0 01-1.803-1.187l-.003-.002a9.828 9.828 0 01-1.375-1.209c-.6-.639-.96-1.297-1.05-2.163C12.85.667 12.68.01 12.504 0z" />
    </svg>
  )
}

function DownloadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const current = detectPlatform()
  const others = (['macos', 'windows', 'linux'] as Platform[]).filter((p) => p !== current)

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setVisible(false)
      onClose()
    }, 250)
  }, [onClose])

  if (open && !visible && !closing) {
    setVisible(true)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/60 ${closing ? 'astro-backdrop-out' : 'astro-backdrop-in'}`} />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-neutral-900 ${closing ? 'astro-dialog-out' : 'astro-dialog-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="astro-stagger-in absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          style={{ animationDelay: '250ms' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>

        {/* Icon + Title */}
        <div className="flex flex-col items-center">
          <div className="astro-stagger-in mb-4 h-16 w-16 overflow-hidden rounded-[24%]" style={{ animationDelay: '120ms' }}>
            <img alt="Astro" src={`${IMAGES}/icon.png`} width={512} height={512} />
          </div>
          <h2 className="astro-stagger-in text-xl font-bold text-neutral-900 dark:text-white" style={{ animationDelay: '200ms' }}>
            Download Astro for {PLATFORM_META[current].label}
          </h2>
          <p className="astro-stagger-in mt-1 text-sm text-neutral-500 dark:text-neutral-400" style={{ animationDelay: '260ms' }}>
            {PLATFORM_META[current].fileHint} &middot; Free
          </p>
        </div>

        {/* Primary download */}
        <a
          href={DOWNLOAD_LINKS[current]}
          className="astro-stagger-in mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
          style={{ animationDelay: '340ms' }}
        >
          <PlatformIcon platform={current} className="h-5 w-5" />
          Download for {PLATFORM_META[current].label}
        </a>

        {/* Other platforms */}
        <div className="astro-stagger-in mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-700" style={{ animationDelay: '420ms' }}>
          <p className="mb-3 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider dark:text-neutral-500">
            Other platforms
          </p>
          <div className="flex justify-center gap-3">
            {others.map((p, i) => (
              <a
                key={p}
                href={DOWNLOAD_LINKS[p]}
                className="astro-stagger-in flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                style={{ animationDelay: `${480 + i * 60}ms` }}
              >
                <PlatformIcon platform={p} className="h-4 w-4" />
                {PLATFORM_META[p].label}
              </a>
            ))}
          </div>
        </div>

        <p className="astro-stagger-in mt-5 text-center text-[11px] text-neutral-400 leading-relaxed dark:text-neutral-500" style={{ animationDelay: '580ms' }}>
          By downloading, you agree to the Astro{' '}
          <a href="/terms" className="underline hover:text-neutral-600 dark:hover:text-neutral-300">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:text-neutral-600 dark:hover:text-neutral-300">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}

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
  imageAlt,
  imagePosition,
}: (typeof features)[number]) {
  const isLeft = imagePosition === 'left'

  return (
    <section className="section bg-theme-bg text-theme-text overflow-x-clip">
      <div className="container">
        <div className="grid grid-cols-12 gap-y-8 md:gap-y-12 lg:gap-y-16">
          {/* Title */}
          <div className="col-span-12 flex flex-col items-center justify-center gap-4">
            <h2 className="type-md-lg z-1 max-w-2xl px-6 text-center font-bold text-theme-text text-balance sm:w-2/3 sm:px-0">
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
            <p className="type-md-lg max-w-4/5 font-semibold text-theme-text text-pretty md:max-w-full">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AstroPageContent() {
  const [downloadOpen, setDownloadOpen] = useState(false)
  const openDownload = useCallback(() => setDownloadOpen(true), [])

  return (
    <div className="relative">
      <DownloadDialog open={downloadOpen} onClose={() => setDownloadOpen(false)} />
      {/* Background */}
      <div className="fixed inset-0 bg-primary">
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
                className="pointer-events-none absolute -z-10 h-[350px] w-[700px] translate-y-[20px] transform bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_color-mix(in_srgb,var(--color-primary)_30%,transparent)_35%,_transparent_70%)] sm:w-[1000px]"
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

              <button
                onClick={openDownload}
                className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:mt-6"
              >
                Download Astro
              </button>

              <p className="mt-2 text-center text-sm text-white/60">
                Available on macOS, Windows, and Linux
              </p>
            </div>

            {/* Video */}
            <div className="col-span-12 col-start-1 select-none px-6 md:col-span-10 md:col-start-2 md:px-0 xl:col-span-8 xl:col-start-3">
              <div className="drop-shadow-[0_20px_50px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]">
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
              <p className="type-md-lg text-center font-semibold text-foreground text-balance">
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
        <section className="section bg-theme-bg text-theme-text overflow-x-clip">
          <div className="container">
            <div className="text-center mx-auto max-w-prose-medium-wide">
              <div className="max-w-xl mx-auto mb-v1 px-4">
                <img
                  alt="Privacy"
                  src={`${IMAGES}/privacy.svg`}
                  className="mx-auto"
                  width={488}
                  height={170}
                  loading="lazy"
                />
              </div>
              <h2 className="type-lg font-bold text-theme-text text-balance mb-v1">
                You&apos;re in control
              </h2>
              <p className="type-md text-theme-text-sec text-pretty">
                You decide which sites Astro can see, clear your browsing
                history, use incognito, and manage browser memories anytime.
              </p>
            </div>
          </div>
        </section>

        {/* ── More Features ── */}
        <section className="section bg-theme-bg text-theme-text relative">
          <div className="container">
            <h2 className="type-lg text-center font-semibold text-theme-text mb-v2">
              More features
            </h2>

            <div className="relative selection:bg-transparent">
              <div className="pointer-events-none absolute inset-x-0 -bottom-[50px] top-0 z-[-1] bg-[linear-gradient(180deg,var(--color-background)_0%,var(--color-background)_calc(100%-325px),transparent_100%)]" />

              <div className="grid grid-cols-1 gap-g1.5 md:grid-cols-3 items-stretch">
                {moreFeatures.map((feature) => (
                  <div key={feature.title} className="card flex flex-col items-center gap-g1">
                    <div className="media-border-container w-full overflow-hidden">
                      <img
                        alt={feature.title}
                        src={feature.image}
                        className="mx-auto w-full"
                        width={1130}
                        height={634}
                        loading="lazy"
                      />
                    </div>
                    <h3 className="type-md text-center font-semibold text-theme-text">
                      {feature.title}
                    </h3>
                    <p className="type-base text-center text-theme-text-sec">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="relative mt-10 w-full sm:mt-20">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-12 flex-col items-center gap-8 md:gap-12">
            <div className="relative col-span-12 row-start-1 flex flex-col items-center px-4 selection:bg-transparent md:px-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -z-10 h-[350px] w-[700px] translate-y-[20px] transform bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_color-mix(in_srgb,var(--color-primary)_30%,transparent)_35%,_transparent_70%)] sm:w-[1000px]"
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

              <button
                onClick={openDownload}
                className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 md:mt-6"
              >
                Download Astro
              </button>

              <p className="mt-2 text-center text-sm text-white/60">
                Available on macOS, Windows, and Linux
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
