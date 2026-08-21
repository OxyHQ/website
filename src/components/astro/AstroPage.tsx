import { useCallback, useEffect, useRef, useState } from 'react'
import '../../styles/astro-template.css'
import { AnimatedTitle } from '../ui/AnimatedTitle'
import { APP_CARD_IMAGES } from '../../data/appCardImages'

const IMAGES = '/images/astro'
type Platform = 'macos' | 'windows' | 'linux'

const DOWNLOAD_LINKS: Record<Platform, string> = { macos: '#', windows: '#', linux: '#' }
const PLATFORM_META: Record<Platform, { label: string; fileHint: string }> = {
  linux: { label: 'Linux', fileHint: '.deb' },
  windows: { label: 'Windows', fileHint: '.exe' },
  macos: { label: 'macOS', fileHint: '.dmg' },
}
const CURRENT_PLATFORM: Platform = (() => {
  if (typeof navigator === 'undefined') return 'linux'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('win')) return 'windows'
  return 'linux'
})()
const OTHER_PLATFORMS = (['linux', 'windows', 'macos'] as Platform[]).filter((p) => p !== CURRENT_PLATFORM)

function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const path = platform === 'windows'
    ? 'M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .08V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91V13.1l10 .15z'
    : platform === 'macos'
      ? 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z'
      : 'M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.199.023.395-.049.543-.16.646-.484 1.342-.83 2.346-.016.32.26.659.288 1.028.098.359-.187.705-.634.966-1.214.09-.199.09-.398.132-.598.077-.399.159-.797.237-1.126.236-1.048.365-1.883.29-2.758-.077-.873-.535-1.667-.766-2.552a7.04 7.04 0 01-.27-2.407c.024-1.357.116-2.77-.199-4.065-.308-1.256-.891-2.263-2.224-2.39-1.016-.098-1.898.503-2.596 1.07-.466-.266-.91-.512-1.245-.698a18.816 18.816 0 01-1.803-1.187l-.003-.002a9.828 9.828 0 01-1.375-1.209c-.6-.639-.96-1.297-1.05-2.163C12.85.667 12.68.01 12.504 0z'
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d={path} /></svg>
}

function DownloadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const close = useCallback(() => {
    setClosing(true)
    setTimeout(() => { setClosing(false); onClose() }, 250)
  }, [onClose])
  if (!open && !closing) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={close}>
      <div className="absolute inset-0 bg-black/60" />
      <div className={`relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-neutral-900 ${closing ? 'astro-dialog-out' : 'astro-dialog-in'}`} onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Close download dialog" onClick={close} className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">×</button>
        <div className="flex flex-col items-center">
          <div className="mb-4 h-16 w-16 overflow-hidden rounded-[24%]"><img alt="Astro" src={`${IMAGES}/icon.png`} width={512} height={512} /></div>
          <h2 className="text-xl font-medium text-neutral-900 dark:text-white">Download Astro for {PLATFORM_META[CURRENT_PLATFORM].label}</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{PLATFORM_META[CURRENT_PLATFORM].fileHint} · Free</p>
        </div>
        <a href={DOWNLOAD_LINKS[CURRENT_PLATFORM]} className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"><PlatformIcon platform={CURRENT_PLATFORM} className="h-5 w-5" />Download for {PLATFORM_META[CURRENT_PLATFORM].label}</a>
        <div className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-700"><p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Other platforms</p><div className="flex justify-center gap-3">{OTHER_PLATFORMS.map((platform) => <a key={platform} href={DOWNLOAD_LINKS[platform]} className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"><PlatformIcon platform={platform} className="h-4 w-4" />{PLATFORM_META[platform].label}</a>)}</div></div>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">By downloading, you agree to the Astro <a href="/legal/terms" className="underline">Terms of Service</a> and <a href="/legal/privacy" className="underline">Privacy Policy</a>.</p>
      </div>
    </div>
  )
}

const featureCards = [
  ['Side chat', 'Unlock the web with AI by your side', 'Open an AI sidebar in any window to summarize content, compare products, or analyze data from any site you’re viewing.', `${IMAGES}/astro-alia-capture.png`, `${IMAGES}/sidechat-eyebrow.svg`, 'Astro with Alia open beside a webpage'],
  ['Memories', 'Picks up where you left off', 'You choose what Astro remembers, so it can bring you relevant details when you need them.', `${IMAGES}/astro-settings-capture.png`, `${IMAGES}/memories-eyebrow.svg`, 'Astro memory settings'],
  ['Agent mode', 'Takes action for you', 'In agent mode, Astro interacts with sites for you, always under your control. Use it to do tasks from start to finish.', `${IMAGES}/astro-newtab-capture.png`, `${IMAGES}/agent-eyebrow.svg`, 'Astro new tab and agent experience'],
]

const details = [
  ['Answers that stay with you.', 'Astro keeps the useful context close, so your next visit can start where the last one ended.', `${IMAGES}/astro-newtab-capture.png`],
  ['Search your whole stack.', 'Bring web results, browser context, connected apps, and saved memories into one answer.', `${IMAGES}/astro-alia-capture.png`],
  ['Privacy controls you can see.', 'Choose what Astro can access, clear it when you want, and keep browsing on your terms.', `${IMAGES}/astro-settings-capture.png`],
  ['Customize your browser.', 'Set your browsing preferences and make Astro feel like your own space on the web.', `${IMAGES}/cursor.png`],
]

const prompts = [
  ['Research', 'Summarize a long article and pull out the claims worth checking.'],
  ['Plan', 'Compare options, save the useful details, and keep the whole trail together.'],
  ['Create', 'Turn highlighted text into a clearer email, note, or next step.'],
  ['Act', 'Let Astro handle a repeatable browser task while you stay in control.'],
  ['Remember', 'Keep the context you choose close at hand for the next visit.'],
]

const extras = [
  ['Smarter searches', 'Search text, images, videos, or news articles.', `${IMAGES}/smart-searches.png`],
  ['Easy to use', 'Use tabs, autocomplete, a search bar, and bookmarks to navigate the web.', `${IMAGES}/easy-to-use.png`],
  ['Make it custom', 'Set your browsing preferences and colors.', `${IMAGES}/make-it-custom.png`],
]

const primaryButton = 'reset interactable-alt select-none [-webkit-user-drag:none] outline-none font-medium transition-[background-color,border-color,color,opacity] duration-300 ease-out font-sans text-center items-center justify-center leading-loose whitespace-nowrap disabled:cursor-default disabled:opacity-50 data-[state=open]:opacity-80 text-inverse border border-transparent h-10 text-base cursor-pointer inline-flex rounded-full bg-button-bg hover:opacity-80 px-4 marketing-cta-shimmer text-box-edge-cap-alphabetic text-box-trim-both'
const secondaryButton = 'reset interactable-alt select-none [-webkit-user-drag:none] outline-none font-medium transition-[background-color,border-color,color,opacity] duration-300 ease-out font-sans text-center items-center justify-center leading-loose whitespace-nowrap disabled:cursor-default disabled:opacity-50 data-[state=open]:bg-subtle data-[state=open]:border-subtle border border-solid h-10 text-base cursor-pointer inline-flex rounded-full text-primary border-subtle hover:border-subtle hover:bg-subtle px-4 border-white bg-white/[0.04] text-light text-box-edge-cap-alphabetic text-box-trim-both hover:border-white hover:bg-white/10'

function useAstroMotion() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    root.classList.add('astro-motion-ready')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const revealItems = [...root.querySelectorAll<HTMLElement>('[data-astro-reveal]')]

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      revealItems.forEach((item) => item.classList.add('astro-is-visible'))
      return
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('astro-is-visible')
        revealObserver.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 })

    revealItems.forEach((item) => revealObserver.observe(item))

    const parallaxItems = [...root.querySelectorAll<HTMLElement>('[data-astro-parallax]')]
    let frame = 0
    const updateParallax = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const viewportCenter = window.innerHeight / 2
        parallaxItems.forEach((item) => {
          const rect = item.getBoundingClientRect()
          const distance = (rect.top + rect.height / 2 - viewportCenter) * -0.045
          const offset = Math.max(-28, Math.min(28, distance))
          item.style.setProperty('--astro-parallax-y', `${offset}px`)
        })
      })
    }

    updateParallax()
    window.addEventListener('scroll', updateParallax, { passive: true })
    window.addEventListener('resize', updateParallax)

    return () => {
      revealObserver.disconnect()
      window.removeEventListener('scroll', updateParallax)
      window.removeEventListener('resize', updateParallax)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return rootRef
}

function useHeroVideoScroll(scrollStart?: number) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const video = videoRef.current
    const scene = sceneRef.current
    const hero = heroRef.current
    if (!video || !scene || !hero || scrollStart === undefined) return

    let introFrame = 0
    let scrollFrame = 0
    let introComplete = false
    let sceneTop = 0
    let scrollRange = 0
    let releaseDistance = 0
    let scrubOrigin = 0
    let geometryDirty = true

    const clamp = (value: number, minimum: number, maximum: number) =>
      Math.max(minimum, Math.min(maximum, value))

    const measureScene = () => {
      sceneTop = scene.getBoundingClientRect().top + window.scrollY
      scrollRange = Math.max(0, scene.offsetHeight - hero.offsetHeight)
      releaseDistance = Math.min(120, window.innerHeight * 0.12)
      geometryDirty = false
    }

    const updateFromScroll = () => {
      scrollFrame = 0
      if (!introComplete || !Number.isFinite(video.duration)) return

      if (geometryDirty) measureScene()

      const startTime = clamp(scrollStart, 0, video.duration)
      const extendedScrollRange = scrollRange + releaseDistance
      const sceneScroll = clamp(window.scrollY - sceneTop, 0, extendedScrollRange)
      const availableRange = Math.max(0, extendedScrollRange - scrubOrigin)
      const progress = availableRange === 0
        ? Number(sceneScroll >= extendedScrollRange)
        : clamp((sceneScroll - scrubOrigin) / availableRange, 0, 1)
      video.currentTime = clamp(
        startTime + (video.duration - startTime) * progress,
        startTime,
        video.duration,
      )
    }

    const requestScrollUpdate = () => {
      if (scrollFrame) return
      scrollFrame = window.requestAnimationFrame(updateFromScroll)
    }

    const finishIntro = () => {
      measureScene()
      scrubOrigin = clamp(window.scrollY - sceneTop, 0, scrollRange + releaseDistance)
      video.pause()
      video.currentTime = clamp(scrollStart, 0, video.duration)
      introComplete = true
      requestScrollUpdate()
    }

    const watchIntro = () => {
      if (video.currentTime >= scrollStart || video.ended) {
        finishIntro()
        return
      }
      introFrame = window.requestAnimationFrame(watchIntro)
    }

    const startIntro = () => {
      video.currentTime = 0
      void video.play().catch(() => undefined)
      introFrame = window.requestAnimationFrame(watchIntro)
    }

    const handleResize = () => {
      geometryDirty = true
      requestScrollUpdate()
    }

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) startIntro()
    else video.addEventListener('loadedmetadata', startIntro, { once: true })

    window.addEventListener('scroll', requestScrollUpdate, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      video.removeEventListener('loadedmetadata', startIntro)
      window.removeEventListener('scroll', requestScrollUpdate)
      window.removeEventListener('resize', handleResize)
      if (introFrame) window.cancelAnimationFrame(introFrame)
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
      video.pause()
    }
  }, [scrollStart])

  return { heroRef, sceneRef, videoRef }
}

interface AstroPageContentProps {
  heroBackgroundVideo?: string
  heroVideoScrollStart?: number
  heroIconSrc?: string
  heroIconAlt?: string
  heroTitle?: string
  heroTitleClassName?: string
  heroSubtitle?: string
  centerHeroContent?: boolean
  heroCtaLabel?: string
  heroCtaHref?: string
  showHeroPlatformAvailability?: boolean
  showHeroBrowserMockup?: boolean
  heroOnly?: boolean
}

export default function AstroPageContent({
  heroBackgroundVideo,
  heroVideoScrollStart,
  heroIconSrc = `${IMAGES}/icon.png`,
  heroIconAlt = 'Astro icon',
  heroTitle = 'Browse the web with AI by your side.',
  heroTitleClassName = '',
  heroSubtitle = 'Instant answers, smarter suggestions, and help with tasks — with privacy settings you control.',
  centerHeroContent = false,
  heroCtaLabel = 'Download Astro',
  heroCtaHref,
  showHeroPlatformAvailability = true,
  showHeroBrowserMockup = true,
  heroOnly = false,
}: AstroPageContentProps) {
  const [downloadOpen, setDownloadOpen] = useState(false)
  const motionRootRef = useAstroMotion()
  const { heroRef, sceneRef, videoRef: heroVideoRef } = useHeroVideoScroll(heroVideoScrollStart)
  const openDownload = useCallback(() => setDownloadOpen(true), [])
  const heroSection = (
      <section
        ref={heroRef}
        className={`relative isolate h-[760px] w-full overflow-hidden bg-inverse md:h-[860px] lg:h-[95vh] lg:max-h-[960px]${heroVideoScrollStart === undefined ? '' : ' astro-video-scroll-hero'}`}
        data-color-scheme="dark"
        data-header-color-mode="dark"
      >
        {heroBackgroundVideo ? (
          <video
            ref={heroVideoRef}
            src={heroBackgroundVideo}
            aria-hidden="true"
            className="astro-hero-background pointer-events-none absolute inset-x-0 bottom-0 h-[1100px] w-full object-cover object-bottom"
            autoPlay
            loop={heroVideoScrollStart === undefined}
            muted
            playsInline
            preload="auto"
          />
        ) : (
          <img src={APP_CARD_IMAGES['/astro']} alt="" aria-hidden="true" data-astro-parallax="hero" className="astro-hero-background pointer-events-none absolute inset-x-0 bottom-0 h-[1100px] w-full object-cover object-bottom" />
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[140px] bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
        <div className={`relative mx-auto flex h-full w-full max-w-[1440px] flex-col items-center px-4 text-center md:px-10 lg:px-16${centerHeroContent ? ' justify-center' : ' pt-28 md:pt-32 lg:pt-36'}`}>
          <div data-astro-reveal className="relative z-10 flex flex-col items-center">
            <div className="mb-8 h-auto group w-20 md:w-24"><img alt={heroIconAlt} src={heroIconSrc} className="h-auto w-full rounded-[24%]" width={1024} height={1024} /></div>
            <AnimatedTitle as="h1" className={`nimbus-headline-xl max-w-[880px] text-balance text-box-edge-cap-alphabetic text-box-trim-both text-light ${heroTitleClassName}`}>{heroTitle}</AnimatedTitle>
            <p className="nimbus-headline-2xs mt-8 max-w-[620px] text-balance text-box-edge-cap-alphabetic text-box-trim-both text-light">{heroSubtitle}</p>
            {heroCtaHref ? (
              <a href={heroCtaHref} className={`${primaryButton} mt-8`}>{heroCtaLabel}</a>
            ) : (
              <button type="button" onClick={openDownload} className={`${primaryButton} mt-8`}>{heroCtaLabel}</button>
            )}
            {showHeroPlatformAvailability && <p className="mt-3 text-sm text-light">Available on Linux, Windows, and macOS</p>}
          </div>
        </div>
        {showHeroBrowserMockup && <img src={`${IMAGES}/astro-newtab-window.png`} alt="Astro new tab in the real browser" data-astro-reveal data-astro-parallax="hero-window" className="pointer-events-none absolute inset-x-4 bottom-[-270px] z-0 mx-auto h-[420px] w-[calc(100%-2rem)] max-w-[1120px] rounded-2xl object-cover object-top md:bottom-[-285px] md:h-[460px] md:w-[calc(100%-5rem)] lg:bottom-[-300px] lg:h-[470px] lg:w-[calc(100%-8rem)]" loading="eager" decoding="async" />}
      </section>
  )

  return (
    <div ref={motionRootRef} className={`astro-template relative bg-base${heroOnly ? '' : ' min-h-screen'}`}>
      <DownloadDialog open={downloadOpen} onClose={() => setDownloadOpen(false)} />

      {heroVideoScrollStart === undefined ? heroSection : (
        <div ref={sceneRef} data-video-scroll-scene className="astro-video-scroll-scene">
          {heroSection}
        </div>
      )}

      {!heroOnly && (
        <>
      <section className="w-full bg-base py-16 md:py-24" data-color-scheme="dark" data-header-color-mode="dark">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-10 lg:px-16">
          <div data-astro-reveal className="mx-auto max-w-[936px] text-center"><h2 className="nimbus-headline-m mx-auto max-w-[850px] text-balance text-primary text-box-trim-both text-box-edge-cap-alphabetic">A calmer way to move from question to action.</h2><div className="mx-auto mt-6 max-w-[648px]"><p className="nimbus-body text-box-trim-both text-box-edge-cap-alphabetic text-pretty text-secondary">Astro brings assistance into the browser you already use, so research, context, and next steps stay close together.</p></div></div>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {featureCards.map(([label, title, description, image, eyebrow, alt], index) => <article key={title} data-astro-reveal data-astro-delay={index + 1} className="group flex min-w-0 flex-col gap-6 lg:gap-10"><div className="aspect-square w-full overflow-hidden rounded-2xl bg-white/[0.04]"><img src={image} alt={alt} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" loading="lazy" /></div><div className="flex w-full flex-col gap-4 pb-1 pl-1 pr-1 lg:gap-6"><div className="flex items-center justify-between"><p className="nimbus-label-s text-box-edge-cap-alphabetic text-box-trim-both text-light uppercase">{label}</p><img src={eyebrow} alt="" aria-hidden="true" className="size-7 object-contain transition-transform duration-500 ease-out group-hover:rotate-6 group-hover:scale-110" /></div><h3 className="nimbus-body text-box-edge-cap-alphabetic text-box-trim-both text-light">{title}</h3><p className="nimbus-body-s text-box-edge-cap-alphabetic text-box-trim-both text-pretty text-secondary">{description}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="w-full bg-base py-16 md:py-20 lg:py-[120px]" data-color-scheme="dark" data-header-color-mode="dark">
        <div data-astro-reveal className="mx-auto w-full max-w-[1440px] px-4 md:px-10 lg:px-16"><div className="mx-auto max-w-[936px] text-center"><h2 className="nimbus-headline-m mx-auto max-w-[850px] text-balance text-primary text-box-trim-both text-box-edge-cap-alphabetic">Your web, your context, your control.</h2><div className="mx-auto mt-6 max-w-[648px]"><p className="nimbus-body text-box-trim-both text-box-edge-cap-alphabetic text-pretty text-secondary">Bring the parts of browsing that matter into one place, while deciding what Astro can access and remember.</p></div></div></div>
        <div className="mx-auto mt-16 w-full max-w-[1440px] px-4 md:px-8 lg:mt-24 lg:px-16"><div className="flex flex-col gap-16 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center [&_h3]:text-box-trim-both [&_p]:text-box-trim-both"><ul className="flex w-full flex-col gap-16 lg:col-span-5 lg:col-start-1 lg:gap-10">{details.map(([title, description, image], index) => <li key={title} data-astro-reveal data-astro-delay={index + 1} className="relative"><div className="flex w-full flex-col items-stretch gap-6 text-left transition-opacity duration-300 motion-reduce:transition-none lg:gap-0"><img src={image} alt="" aria-hidden="true" loading="lazy" decoding="async" className="aspect-[10/9] w-full rounded-2xl object-cover transition-transform duration-700 ease-out hover:scale-[1.015] lg:hidden" /><div className="relative flex flex-col items-start lg:pl-6"><span aria-hidden="true" className="absolute bottom-0 left-0 top-0 hidden w-[3px] lg:block" style={{ backgroundColor: index === 0 ? 'var(--color-primary)' : 'var(--color-border)' }} /><h3 className="mt-4 nimbus-headline-2xs text-box-edge-cap-alphabetic text-box-trim-both text-pretty text-light">{title}</h3><div className={`grid w-full grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${index === 0 ? 'opacity-100' : 'lg:grid-rows-[0fr] lg:opacity-0'}`}><div className="overflow-hidden"><p className="pb-1 pt-6 nimbus-body text-balance text-box-edge-cap-alphabetic text-box-trim-both text-secondary">{description}</p></div></div></div></div></li>)}</ul><div data-astro-reveal data-astro-parallax="context" className="relative hidden aspect-[10/9] w-full overflow-hidden lg:col-span-6 lg:col-start-7 lg:block"><img src={`${IMAGES}/astro-alia-capture.png`} alt="Astro with Alia open in the browser" className="absolute inset-0 h-full w-full rounded-2xl object-cover" /></div></div></div>
        <div data-astro-reveal className="mt-16 flex justify-center px-4"><button type="button" onClick={openDownload} className={`${secondaryButton} transition-transform duration-300 hover:-translate-y-0.5`}>Get started with Astro</button></div>
      </section>

      <section className="w-full overflow-hidden bg-base py-16 md:py-20 lg:py-[120px]" data-color-scheme="dark" data-header-color-mode="dark"><div data-astro-reveal className="mx-auto w-full max-w-[1440px] px-4 md:px-10 lg:px-16"><div className="mx-auto max-w-[936px] text-center"><h2 className="nimbus-headline-m mx-auto max-w-[850px] text-balance text-primary text-box-trim-both text-box-edge-cap-alphabetic">What will you do with Astro?</h2></div></div><div data-astro-reveal className="mt-16 flex flex-col gap-4"><div className="_root_hbqvj_1"><div className="_track_hbqvj_27" data-direction="left"><div className="_segment_hbqvj_40 flex">{prompts.map(([label, prompt]) => <div key={label} className="mr-4 flex flex-none items-stretch py-1 md:mr-6"><div className="group reset interactable-alt flex h-full min-h-[188px] w-[320px] flex-none flex-col rounded-2xl border p-6 text-left transition-transform duration-500 hover:-translate-y-1 md:min-h-[216px] md:w-[440px] md:p-7"><div className="flex h-full flex-col gap-4 md:gap-5"><div className="flex items-center justify-between"><p className="nimbus-label-s text-box-edge-cap-alphabetic text-box-trim-both text-light uppercase">{label}</p><span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">↗</span></div><p className="nimbus-body text-balance text-box-edge-cap-alphabetic text-box-trim-both text-light">{prompt}</p></div></div></div>)}</div></div></div></div></section>

      <section className="@container w-full overflow-hidden bg-base py-16 md:py-20 lg:py-[120px]" data-color-scheme="dark" data-header-color-mode="dark"><div className="mx-auto w-full max-w-[1440px] px-4 md:px-10 lg:px-16"><div className="grid w-full gap-12 lg:grid-cols-12 lg:items-center lg:gap-16"><div data-astro-reveal className="max-w-[520px] lg:col-span-5"><h2 className="nimbus-headline-s text-balance text-box-edge-cap-alphabetic text-box-trim-both text-light">Search powers every Astro answer.</h2><p className="mt-6 nimbus-body text-pretty text-box-edge-cap-alphabetic text-box-trim-both text-secondary">Every page, note, and browser task starts with the context behind it. Astro keeps that context close.</p><div className="mt-8 hidden lg:flex lg:justify-start"><button type="button" onClick={openDownload} className={`${secondaryButton} transition-transform duration-300 hover:-translate-y-0.5`}>Try Astro</button></div></div><div data-astro-reveal data-astro-parallax="settings" className="lg:col-span-7"><div className="relative aspect-[757/561] w-full overflow-hidden rounded-2xl"><img src={`${IMAGES}/astro-settings-capture.png`} alt="Astro settings and memory controls" className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out hover:scale-[1.02]" loading="lazy" /></div></div></div><div data-astro-reveal className="mt-8 flex justify-center lg:hidden"><button type="button" onClick={openDownload} className={`${secondaryButton} transition-transform duration-300 hover:-translate-y-0.5`}>Try Astro</button></div></div></section>

      <section data-color-scheme="dark" data-header-color-mode="dark" className="relative flex min-h-[560px] w-full items-center justify-center overflow-hidden bg-inverse px-4 py-20 text-center md:min-h-[760px] md:px-10"><div data-astro-parallax="cta" aria-hidden="true" className="astro-cta-background absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${IMAGES}/hero-bg.jpg)` }} /><div data-astro-reveal className="relative z-10 flex max-w-[523px] flex-col items-center"><div className="mb-7 size-16 overflow-hidden rounded-[24%]"><img alt="Astro icon" src={`${IMAGES}/icon.png`} width={1024} height={1024} /></div><h2 className="text-balance nimbus-headline-m text-box-edge-cap-alphabetic text-box-trim-both text-light">Make the web work better for you.</h2><div className="marketing-cta-shimmer mt-8 inline-flex"><button type="button" onClick={openDownload} className={primaryButton}>Download Astro</button></div></div></section>

      <section className="w-full bg-base py-16 md:py-20 lg:py-[120px]" data-color-scheme="dark" data-header-color-mode="dark"><div className="mx-auto w-full max-w-[1440px] px-4 md:px-10 lg:px-16"><div data-astro-reveal className="mx-auto max-w-[936px] text-center"><h2 className="nimbus-headline-m mx-auto max-w-[850px] text-balance text-primary text-box-trim-both text-box-edge-cap-alphabetic">More features</h2></div><div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">{extras.map(([title, description, image], index) => <article key={title} data-astro-reveal data-astro-delay={index + 1} className="group flex min-w-0 flex-col gap-6 lg:gap-10"><div className="aspect-square w-full overflow-hidden rounded-2xl bg-white/[0.04]"><img src={image} alt={title} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" loading="lazy" /></div><div className="flex w-full flex-col gap-4 pb-1 pl-1 pr-1 lg:gap-6"><h3 className="nimbus-body text-box-edge-cap-alphabetic text-box-trim-both text-light">{title}</h3><p className="nimbus-body-s text-box-edge-cap-alphabetic text-box-trim-both text-pretty text-secondary">{description}</p></div></article>)}</div></div></section>
        </>
      )}
    </div>
  )
}
