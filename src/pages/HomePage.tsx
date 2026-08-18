import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, BookOpenText, Bug, Code, HandHeart, Megaphone, Translate, UsersThree } from '@phosphor-icons/react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HomeHero from '../components/homepage/HomeHero'
import { homeFaqs } from '../data/homepage'
import EcosystemStack from '../components/sections/EcosystemStack'
import FairCoinSection from '../components/sections/FairCoinSection'
import FaqSection from '../components/sections/FaqSection'
import { usePage, type PageSection, useProducts, type ProductRecord } from '../api/hooks'
import { FEATURES } from '../constants'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import type SwiperType from 'swiper'
import 'swiper/css'
import '../styles/landing.css'
import AIResearchSection from '../components/ai/AIResearchSection'
import AppCard from '../components/apps/AppCard'
import { Link } from 'react-router-dom'
import { AnimatedTitle } from '../components/ui/AnimatedTitle'

/**
 * Pulls a heading, subheading or content string out of a Page document's
 * `sections` array. Returns the provided fallback when the section is missing
 * or the target field is empty. Mirrors the NewsroomPage helper — kept local
 * so each page can own its fallback set without a cross-page import.
 */
function pageHeading(sections: PageSection[] | undefined, type: string, fallback: string): string {
  return sections?.find(s => s.type === type)?.heading || fallback
}

function pageContent(sections: PageSection[] | undefined, type: string, fallback: string): string {
  return sections?.find(s => s.type === type)?.content || fallback
}

// Fallback copy for home-page marketing sections. Used when the CMS
// `pages/home` document is missing the corresponding section so the site
// renders identically to the hardcoded baseline.
const DEFAULT_ALL_IN_ONE_HEADING_LINE_1 = 'Build for everyone,'
const DEFAULT_ALL_IN_ONE_HEADING_LINE_2 = 'not just yourself.'
const DEFAULT_ALL_IN_ONE_BODY = 'Oxy exists because we believe technology should serve humanity, not exploit it. Through community-driven projects and open-source tools, we prove that helping people and building sustainable systems aren\u2019t competing goals. They\u2019re the same mission.'

const IMG = '/images/landing'

const BTN = 'inline-flex items-center cursor-pointer text-base leading-relaxed font-[450] rounded-full px-4 py-2 max-h-[38px] transition-opacity duration-200 hover:opacity-60'

// Scroll-reveal preset shared by every reshaped section so the page animates
// in with one consistent, subtle motion.
const REVEAL = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
}

/* ------------------------------------------------------------------ */
/*  Partner Logos                                                       */
/* ------------------------------------------------------------------ */
// NOTE: The original list contained real third-party companies (Strava,
// Robinhood, Merck, etc.) cloned from another marketing site. Until real
// Oxy partner logos are available, the list is empty and the section is
// gated by FEATURES.SHOW_TRUSTED_LOGOS at the render site below.
const ALL_LOGOS: string[] = []

// The number of logo slots shown at once — constant for the lifetime of the page.
const LOGO_VISIBLE_COUNT = 7

function PartnerLogos() {
  const [visibleLogos, setVisibleLogos] = useState<string[]>(ALL_LOGOS.slice(0, LOGO_VISIBLE_COUNT))
  const [hiddenSlot, setHiddenSlot] = useState<number | null>(null)
  const availablePoolRef = useRef<string[]>([...ALL_LOGOS.slice(LOGO_VISIBLE_COUNT)])

  const swapLogo = useCallback(() => {
    // Choose the slot before the fade-out so the index is stable across the timeout.
    const slotIndex = Math.floor(Math.random() * LOGO_VISIBLE_COUNT)
    setHiddenSlot(slotIndex)
    setTimeout(() => {
      setVisibleLogos((prev) => {
        const next = [...prev]
        const currentLogo = next[slotIndex]
        if (availablePoolRef.current.length === 0) {
          availablePoolRef.current = [...ALL_LOGOS.slice(LOGO_VISIBLE_COUNT)]
        }
        const poolIndex = Math.floor(Math.random() * availablePoolRef.current.length)
        const newLogo = availablePoolRef.current[poolIndex]
        availablePoolRef.current.splice(poolIndex, 1)
        availablePoolRef.current.push(currentLogo)
        next[slotIndex] = newLogo
        return next
      })
      setHiddenSlot(null)
    }, 400)
  }, [])

  // React 19 callback ref — owns the logo-swap interval while the section is mounted.
  const sectionRef = useCallback((node: HTMLElement | null) => {
    if (!node) return
    const interval = setInterval(swapLogo, 2000)
    return () => clearInterval(interval)
  }, [swapLogo])

  return (
    <section ref={sectionRef} className="container">
      <div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-full py-5">
            <div className="grid grid-cols-7 gap-x-5 max-[950px]:grid-cols-3" id="partner-grid">
              {visibleLogos.map((logo, index) => (
                <div className={`flex items-center justify-center h-[100px] transition-opacity duration-1000 max-[950px]:h-[60px] max-[950px]:[&:nth-child(n+4)]:hidden${hiddenSlot === index ? ' opacity-0' : ''}`} key={index}>
                  <div className="flex items-center justify-center w-full h-full" data-logo={logo}>
                    <img
                      className="w-full h-auto object-contain max-w-full max-h-full [max-height:66px] dark:invert"
                      src={`${IMG}/${logo}.svg`}
                      alt={logo.charAt(0).toUpperCase() + logo.slice(1)}
                      width={224}
                      height={90}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Build for everyone (resource links)                                */
/* ------------------------------------------------------------------ */
interface ResourceLink {
  label: string
  href: string
  external?: boolean
}

const BUILD_FOR_EVERYONE_LINKS: ResourceLink[] = [
  { label: 'Oxy Newsroom', href: '/newsroom' },
  { label: 'Search documentation', href: '/developers/docs' },
  { label: 'Dig into the code', href: 'https://github.com/OxyHQ', external: true },
  { label: 'Meet the Oxy team', href: '/company/team' },
]

function BuildForEveryoneSection() {
  const { data: pageData } = usePage('home')
  const sections = pageData?.sections
  // Heading is stored as a single string with a pipe separator so the CMS can
  // drive line-breaks at the exact point used by the current layout. Fall
  // back to the pre-CMS two-line split when nothing has been published yet.
  const headingFallback = `${DEFAULT_ALL_IN_ONE_HEADING_LINE_1}|${DEFAULT_ALL_IN_ONE_HEADING_LINE_2}`
  const headingRaw = pageHeading(sections, 'all-in-one', headingFallback)
  const [headingLine1, headingLine2] = headingRaw.includes('|')
    ? headingRaw.split('|', 2)
    : [headingRaw, '']
  const body = pageContent(sections, 'all-in-one', DEFAULT_ALL_IN_ONE_BODY)

  return (
    <section className="border-b border-border">
      <div className="container">
        <motion.div
          className="grid grid-cols-1 items-start gap-y-10 border-border px-4 py-10 min-[951px]:grid-cols-2 min-[951px]:gap-x-16 min-[951px]:border-x min-[951px]:px-10 min-[951px]:py-16"
          {...REVEAL}
        >
            {/* Left — heading + body */}
            <div>
              <h2 className="text-heading-responsive-lg">
                {headingLine1}
                {headingLine2 && (
                  <>
                    <br />
                    {headingLine2}
                  </>
                )}
              </h2>
              <p className="max-w-[460px] mt-5 opacity-80">{body}</p>
            </div>

            {/* Right — resource links */}
            <ul className="flex flex-col">
              {BUILD_FOR_EVERYONE_LINKS.map((link) => {
                const rowClass = `group flex items-center justify-between gap-4 py-5 font-display text-2xl font-[450] transition-opacity duration-200 hover:opacity-60`
                const arrow = (
                  <ArrowUpRight
                    weight="regular"
                    className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                )
                return (
                  <li key={link.label}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noreferrer" className={rowClass}>
                        <span>{link.label}</span>
                        {arrow}
                      </a>
                    ) : (
                      <Link to={link.href} className={rowClass}>
                        <span>{link.label}</span>
                        {arrow}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Values (photo-card carousel)                                       */
/* ------------------------------------------------------------------ */
interface ValueCard {
  img: string
  title: string
  body: string
}

const VALUES: ValueCard[] = [
  {
    img: '/images/hero/hero-4.webp',
    title: 'Human-first design.',
    body: 'We design tools that empower people, not manipulate them. Every decision starts with the question: does this serve the user?',
  },
  {
    img: '/images/hero/hero-1.webp',
    title: 'Your data stays yours.',
    body: 'No ads, no data brokers, no hidden monetization. Privacy isn’t a feature we bolt on. It’s the foundation everything is built on.',
  },
  {
    img: '/images/hero/hero-5.jpg',
    title: 'AI with a purpose.',
    body: 'Every product we ship is built to advance justice, inclusion, or sustainability. If it doesn’t move the needle on what matters, we don’t build it.',
  },
  {
    img: '/images/hero/hero-3.webp',
    title: 'Open by default.',
    body: 'Every Oxy tool is open source. We believe transparency isn’t optional, it’s how you earn trust. Inspect the code, fork it, improve it.',
  },
]

function ValuesSection() {
  const swiperRef = useRef<SwiperType | null>(null)

  return (
    <section className="container">
      <div>
        <div className="grid grid-cols-12 gap-6">
          <motion.div className="col-span-full py-16 max-[950px]:py-10" {...REVEAL}>
            <div className="flex items-end justify-between gap-6 mb-8">
              <AnimatedTitle as="h2" className="text-heading-responsive-lg max-w-[440px]">What we stand for.</AnimatedTitle>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  aria-label="Previous value"
                  onClick={() => swiperRef.current?.slidePrev()}
                  className="values-nav-btn"
                >
                  <ArrowUpRight weight="regular" className="-rotate-[135deg]" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next value"
                  onClick={() => swiperRef.current?.slideNext()}
                  className="values-nav-btn"
                >
                  <ArrowUpRight weight="regular" className="rotate-45" aria-hidden />
                </button>
              </div>
            </div>
            <Swiper
              onSwiper={(s) => { swiperRef.current = s }}
              slidesPerView={1.15}
              spaceBetween={24}
              grabCursor
              className="values-swiper"
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 24 },
                950: { slidesPerView: 2.5, spaceBetween: 24 },
                1200: { slidesPerView: 3.2, spaceBetween: 24 },
              }}
            >
              {VALUES.map((value) => (
                <SwiperSlide key={value.title} style={{ height: 'auto' }}>
                  <article className="flex flex-col h-full">
                    <div className="overflow-hidden rounded-3xl aspect-[4/5]">
                      <img
                        src={value.img}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                        width={800}
                        height={1000}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <h3 className="mt-5 text-xl font-medium tracking-tight">{value.title}</h3>
                    <p className="mt-2 opacity-60 leading-relaxed">{value.body}</p>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Independent ecosystem                                              */
/* ------------------------------------------------------------------ */
function IndependentEcosystemSection() {
  return (
    <section className="container">
      <div>
        <div className="grid grid-cols-12 gap-6">
          <motion.div
            className="col-span-full py-16 max-[950px]:py-10 grid grid-cols-2 gap-12 items-center max-[950px]:grid-cols-1"
            {...REVEAL}
          >
            {/* Left — text + buttons */}
            <div>
              <AnimatedTitle as="h2" className="text-heading-responsive-lg max-w-[560px]">
                An independent ecosystem of ethical technology. Radically transparent, fiercely human.
              </AnimatedTitle>
              <p className="mt-5 max-w-[460px] opacity-80">
                No ads. No data selling. No venture capital strings. Just purpose-driven AI tools designed for real-world impact.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/newsroom" className={`${BTN} bg-foreground text-background`}>Newsroom</Link>
                <Link to="/company/business" className={`${BTN} bg-primary text-primary-foreground`}>For Investors</Link>
              </div>
            </div>

            {/* Right — rounded image */}
            <div className="relative overflow-hidden rounded-[40px] aspect-[3/2]">
              <img
                src={`${IMG}/agents-model-agnostic.webp`}
                alt="Oxy ecosystem"
                className="h-full w-full object-cover"
                width={2400}
                height={1600}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Features Tabs                                                      */
/* ------------------------------------------------------------------ */
const FEATURE_TABS = [
  {
    id: 'mention',
    label: 'Mention',
    heading: 'Connect authentically.<br>Share what matters.',
    thumb: '/images/screenshots/mention-app.png',
  },
  {
    id: 'allo',
    label: 'Allo',
    heading: 'Private messaging.<br>Open by design.',
    thumb: `${IMG}/video-thumb-customer-support.webp`,
  },
  {
    id: 'inbox',
    label: 'Inbox',
    heading: 'All your messages.<br>One place.',
    thumb: '/images/screenshots/inbox-app.png',
  },
  {
    id: 'faircoin',
    label: 'FairCoin',
    heading: 'Currency that cares.<br>Commerce that\'s fair.',
    thumb: `${IMG}/video-thumb-analyze.webp`,
  },
  {
    id: 'homiio',
    label: 'Homiio',
    heading: 'Home for everyone.<br>Affordable by design.',
    thumb: `${IMG}/video-thumb-act.webp`,
  },
  {
    id: 'alia',
    label: 'Alia',
    heading: 'Intelligence with integrity.<br>AI for good.',
    thumb: '/images/screenshots/alia-app.png',
  },
]

const FEATURES_AUTO_DURATION = 6000

function FeaturesSection() {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(true)

  // Drive the auto-advance progress bar with requestAnimationFrame. Progress is
  // computed from elapsed wall-clock time and applied inside the rAF callback
  // (async), so no setState happens synchronously in the effect body. While
  // paused the loop simply doesn't run; the rendered width is derived as 0
  // below, so there's no need to reset state on pause.
  useEffect(() => {
    if (!playing) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const pct = Math.min(((now - start) / FEATURES_AUTO_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        setActive((prev) => (prev + 1) % FEATURE_TABS.length)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, playing])

  // Derived: the active tab's timer fills with progress only while playing.
  const displayedProgress = playing ? progress : 0

  const handleTabClick = (i: number) => {
    setActive(i)
    setPlaying(true)
  }

  const toggleAutoplay = () => {
    setPlaying((prev) => !prev)
  }

  return (
    <section className="py-0">
      <div className="agents-features-section">
        <div className="agents-features-bg">
          {/* Decorative: the section's meaning is carried by the text below it,
              so an alt string here would just be noise in a screen reader. */}
          <img
            src={`${IMG}/agents-features-bg.webp`}
            alt=""
            aria-hidden="true"
            width={2400}
            height={2943}
            style={{ objectPosition: '50% 0%' }}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="agents-features-icons">
          <img
            src={`${IMG}/agents-features-icons.svg`}
            alt=""
            aria-hidden="true"
            width={1512}
            height={1145}
            style={{ objectPosition: '50% 50%' }}
            loading="lazy"
            decoding="async"
          />
        </div>
        {/* The band bleeds (it carries a full-width backdrop); its content
            sits in the site container like every other section. */}
        <div className="agents-features-content container text-white text-center pt-[56px]">
          <div className="agents-features-tabs-nav tabs-nav">
            {FEATURE_TABS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                className={i === active ? 'active' : undefined}
                data-tab={t.id}
                onClick={() => handleTabClick(i)}
              >
                <strong>{t.label}</strong>
                <div
                  className="timer"
                  style={{ width: i === active ? `${displayedProgress}%` : '0%' }}
                />
              </button>
            ))}
            <button
              type="button"
              className={`toggle-autoplay${playing ? ' playing' : ''}`}
              onClick={toggleAutoplay}
              aria-label={playing ? 'Pause autoplay' : 'Play autoplay'}
            >
              <svg width="8" height="12" className="pause" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.895149 12C0.594679 12 0.369327 11.9157 0.219092 11.7471C0.0730308 11.5785 0 11.3255 0 10.9883V1.00468C0 0.672131 0.0751174 0.421546 0.225352 0.252927C0.375587 0.0843091 0.598852 0 0.895149 0H2.3662C2.65832 0 2.8795 0.0819672 3.02973 0.245902C3.18414 0.409836 3.26135 0.662763 3.26135 1.00468V10.9883C3.26135 11.3255 3.18414 11.5785 3.02973 11.7471C2.8795 11.9157 2.65832 12 2.3662 12H0.895149ZM5.64006 12C5.33959 12 5.11424 11.9157 4.96401 11.7471C4.81377 11.5785 4.73865 11.3255 4.73865 10.9883V1.00468C4.73865 0.672131 4.81377 0.421546 4.96401 0.252927C5.11424 0.0843091 5.33959 0 5.64006 0H7.09859C7.39906 0 7.62441 0.0819672 7.77465 0.245902C7.92488 0.409836 8 0.662763 8 1.00468V10.9883C8 11.3255 7.92488 11.5785 7.77465 11.7471C7.62441 11.9157 7.39906 12 7.09859 12H5.64006Z" fill="currentColor"/>
              </svg>
              <svg width="10" height="11" className="play" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 9.96835V1.03165C0 0.681435 0.0904393 0.421941 0.271318 0.253165C0.452196 0.0843882 0.667528 0 0.917313 0C1.14126 0 1.3652 0.0611814 1.58915 0.183544L9.21835 4.55063C9.49397 4.70675 9.69208 4.85443 9.81266 4.99367C9.93755 5.13291 10 5.30169 10 5.5C10 5.69409 9.93755 5.86287 9.81266 6.00633C9.69208 6.14557 9.49397 6.29325 9.21835 6.44937L1.58915 10.8165C1.3652 10.9388 1.14126 11 0.917313 11C0.667528 11 0.452196 10.9135 0.271318 10.7405C0.0904393 10.5717 0 10.3143 0 9.96835Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <div className="agents-features-tabs tabs">
            {FEATURE_TABS.map((t, i) => (
              <div
                key={t.id}
                className={`agents-features-tab tab${i === active ? ' active' : ''}`}
                data-tab={t.id}
              >
                <h2 dangerouslySetInnerHTML={{ __html: t.heading }} />
                <div className="agent-features-tab-ui">
                  <div className="screen">
                    <img src={`${IMG}/browser-frame.svg`} alt="Browser UI" className="screen-frame" width={1200} height={800} loading="lazy" decoding="async" />
                    <div className="screen-content">
                      <img src={t.thumb} alt={t.label} width={1200} height={800} loading="lazy" decoding="async" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  ROI Stats                                                          */
/* ------------------------------------------------------------------ */
const STATS = [
  { label: 'Open Source', value: '100%', desc: 'of our code is public' },
  { label: 'Community', value: '50K+', desc: 'developers and contributors' },
  { label: 'Products', value: '6', desc: 'platforms serving real needs' },
  { label: 'Data Sold', value: '$0', desc: 'we never sell user data' },
  { label: 'Countries', value: '120+', desc: 'communities worldwide' },
]

function StatsAndTestimonialsSection() {
  const swiperRef = useRef<SwiperType>(null)
  const [playing, setPlaying] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  // Tracks the responsive `slidesPerView` so the dot pager can be derived
  // without reading swiperRef.current during render. Updated from Swiper's
  // event callbacks (init + breakpoint), never in the render body.
  const [perView, setPerView] = useState(4)
  const progressRef = useRef<ReturnType<typeof setInterval>>(null)
  const AUTO_DELAY = 5000

  const syncPerView = useCallback((swiper: SwiperType) => {
    const value = swiper.params.slidesPerView
    if (typeof value === 'number') setPerView(value)
  }, [])

  const startProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    const start = Date.now()
    setProgress(0)
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min((elapsed / AUTO_DELAY) * 100, 100))
    }, 200)
  }, [])

  const stopProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    setProgress(0)
  }, [])

  // React 19 callback ref — clears the progress interval on unmount.
  const sectionRef = useCallback((node: HTMLElement | null) => {
    if (!node) return
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [])

  const toggleAutoplay = () => {
    const swiper = swiperRef.current
    if (!swiper) return
    if (playing) {
      swiper.autoplay.stop()
      stopProgress()
    } else {
      swiper.autoplay.start()
      startProgress()
    }
    setPlaying(p => !p)
  }

  // Total number of "pages" (groups), derived from the tracked slidesPerView.
  const totalPages = Math.ceil(TESTIMONIALS.length / perView)
  const selectedPage = Math.floor(activeIndex / perView)

  return (
    <section ref={sectionRef} className="container">
      <div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-full py-10 max-[950px]:py-6">
            {FEATURES.SHOW_HOMEPAGE_STATS && (
            <div className="mb-5">
              <Swiper
                modules={[Autoplay]}
                slidesPerView="auto"
                spaceBetween={0}
                grabCursor
                className="roi-stats-swiper my-6"
                breakpoints={{
                  1460: { slidesPerView: STATS.length, spaceBetween: 0 },
                }}
              >
                {STATS.map((s, i) => (
                  <SwiperSlide key={s.label} className="!w-auto">
                    <div className={`min-w-[230px] px-6 max-[1460px]:min-w-[250px] max-[950px]:min-w-[150px]${i < STATS.length - 1 ? ' border-r border-foreground/10' : ''}`}>
                      <div>
                        <p className="text-sm leading-4 tracking-wide font-[450] opacity-80 mb-[34px]"><strong>{s.label}</strong></p>
                      </div>
                      <div>
                        <p className="text-heading-responsive-lg mb-[9px]">{s.value}</p>
                        <p className="max-w-[210px]">{s.desc}</p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            )}
            {FEATURES.SHOW_TESTIMONIALS && (
            <div>
              <Swiper
                modules={[Autoplay]}
                onSwiper={(s) => { swiperRef.current = s; syncPerView(s) }}
                slidesPerView={4}
                spaceBetween={24}
                autoplay={{
                  delay: AUTO_DELAY,
                  disableOnInteraction: false,
                }}
                onSlideChange={(s) => {
                  setActiveIndex(s.realIndex)
                  startProgress()
                }}
                onBreakpoint={(s) => syncPerView(s)}
                onAutoplayStart={() => startProgress()}
                breakpoints={{
                  0: { slidesPerView: 1.15, spaceBetween: 12 },
                  640: { slidesPerView: 2, spaceBetween: 16 },
                  950: { slidesPerView: 3, spaceBetween: 20 },
                  1400: { slidesPerView: 4, spaceBetween: 24 },
                }}
                className="image-card-slider"
              >
                {TESTIMONIALS.map((t, i) => (
                  <SwiperSlide key={i} style={{ height: 'auto' }}>
                    <div
                      className={`relative overflow-hidden rounded-3xl aspect-[4/5] max-[950px]:aspect-[4/6] ${t.light ? 'text-white' : 'text-foreground/80'}`}
                    >
                      {/* Below the fold, inside a carousel — `eager` made every
                          slide's background a blocking request on first paint. */}
                      <img src={t.bg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" width={800} height={1000} loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="relative z-10 flex flex-col justify-between gap-12 px-7 py-8 max-[950px]:p-8 h-full">
                        <div>
                          <p className="text-base leading-relaxed tracking-tight">&ldquo;{t.quote}&rdquo;</p>
                        </div>
                        <div>
                          <p className="text-sm leading-relaxed">
                            <span className="opacity-60">{t.role}</span><br />
                            {t.company}
                          </p>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className="image-card-slider-ui-wrapper">
                <ol className="image-card-slider-dots">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <li
                      key={i}
                      className={`dot${selectedPage === i ? ' is-selected' : ''}`}
                      onClick={() => swiperRef.current?.slideTo(i * perView)}
                    >
                      <div
                        className="timer"
                        style={{
                          width: selectedPage === i && playing ? `${progress}%` : '0%',
                        }}
                      />
                    </li>
                  ))}
                </ol>
                <button
                  className={`toggle-autoplay${playing ? '' : ' paused'}`}
                  onClick={toggleAutoplay}
                  aria-label={playing ? 'Pause autoplay' : 'Play autoplay'}
                >
                  <svg width="8" height="12" className="pause" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.895 12C0.595 12 0.369 11.916 0.219 11.747C0.073 11.579 0 11.326 0 10.988V1.005C0 0.672 0.075 0.422 0.225 0.253C0.376 0.084 0.599 0 0.895 0H2.366C2.658 0 2.88 0.082 3.03 0.246C3.184 0.41 3.261 0.663 3.261 1.005V10.988C3.261 11.326 3.184 11.579 3.03 11.747C2.88 11.916 2.658 12 2.366 12H0.895ZM5.64 12C5.34 12 5.114 11.916 4.964 11.747C4.814 11.579 4.739 11.326 4.739 10.988V1.005C4.739 0.672 4.814 0.422 4.964 0.253C5.114 0.084 5.34 0 5.64 0H7.099C7.399 0 7.624 0.082 7.775 0.246C7.925 0.41 8 0.663 8 1.005V10.988C8 11.326 7.925 11.579 7.775 11.747C7.624 11.916 7.399 12 7.099 12H5.64Z" fill="currentColor"/>
                  </svg>
                  <svg width="10" height="11" className="play" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 9.968V1.032C0 0.681 0.09 0.422 0.271 0.253C0.452 0.084 0.668 0 0.917 0C1.141 0 1.365 0.061 1.589 0.184L9.218 4.551C9.494 4.707 9.692 4.854 9.813 4.994C9.938 5.133 10 5.302 10 5.5C10 5.694 9.938 5.863 9.813 6.006C9.692 6.146 9.494 6.293 9.218 6.449L1.589 10.817C1.365 10.939 1.141 11 0.917 11C0.668 11 0.452 10.914 0.271 10.741C0.09 10.572 0 10.314 0 9.968Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Testimonials Data                                                  */
/* ------------------------------------------------------------------ */
const TESTIMONIALS = [
  {
    quote: 'We design tools that empower people, not manipulate them. Every decision starts with the question: does this serve the user?',
    role: 'Human-first Design',
    company: 'Core Value',
    bg: `${IMG}/agents-quote-bg-01.webp`,
    light: true,
  },
  {
    quote: 'No ads, no data brokers, no hidden monetization. Your information belongs to you \u2014 period.',
    role: 'Your Data Stays Yours',
    company: 'Core Value',
    bg: `${IMG}/agents-quote-bg-02.webp`,
    light: false,
  },
  {
    quote: 'Every product we ship is built to advance justice, inclusion, or sustainability. If it doesn\u2019t move the needle on what matters, we don\u2019t build it.',
    role: 'AI with a Purpose',
    company: 'Core Value',
    bg: `${IMG}/agents-quote-bg-03.webp`,
    light: true,
  },
  {
    quote: 'Every Oxy tool is open source. We believe transparency isn\u2019t optional \u2014 it\u2019s the foundation of trust.',
    role: 'Open by Default',
    company: 'Core Value',
    bg: `${IMG}/agents-quote-bg-04.webp`,
    light: true,
  },
]

/* ------------------------------------------------------------------ */
/*  Ecosystem                                                          */
/* ------------------------------------------------------------------ */

/** A product's own logo, or its letter on its brand colour. */
function ecosystemOrder(product: ProductRecord): [number, number] {
  const category = typeof product.category === 'object' && product.category !== null ? product.category : null
  return [category?.order ?? Number.MAX_SAFE_INTEGER, product.order ?? 0]
}

/** A landing shows the shape of the ecosystem; the full list lives on /technologies. */
const ECOSYSTEM_LIMIT = 12

function EcosystemSection() {
  const { data: products = [], isPending } = useProducts({ surface: 'products' })
  const shown = [...products]
    .sort((a, b) => {
      const [categoryA, orderA] = ecosystemOrder(a)
      const [categoryB, orderB] = ecosystemOrder(b)
      return categoryA - categoryB || orderA - orderB
    })
    .slice(0, ECOSYSTEM_LIMIT)

  return (
    <section className="container my-space-xl md:my-space-2xl lg:my-space-3xl">
      <div className="flex w-full flex-col gap-space-gutter lg:gap-x-space-gutter-lg">
        <div className="flex flex-wrap items-end justify-between gap-space-lg pb-space-sm">
          <div className="flex flex-col md:gap-space-xs sm:gap-space-2xs">
            <p className="text-heading-md text-primary">Explore the Oxy ecosystem</p>
            <h2 className="max-w-[16em] text-balance text-heading-xl">
              Many apps, one identity, one platform underneath
            </h2>
          </div>
          <a href="/apps" className="text-link-md text-muted-foreground transition-colors hover:text-foreground">
            All technologies &rarr;
          </a>
        </div>

        <div className="col-span-full grid grid-flow-dense grid-cols-1 gap-space-gutter md:grid-cols-2 lg:gap-x-space-gutter-lg xl:grid-cols-3">
          {isPending
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex items-start gap-space-md">
                  <div className="size-space-app-icon-sm shrink-0 animate-pulse rounded-radius-8 bg-surface" />
                  <div className="flex w-full flex-col gap-space-3xs">
                    <div className="h-4 w-2/5 animate-pulse rounded bg-surface" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-surface" />
                  </div>
                </div>
              ))
            : shown.map((product) => <AppCard key={product.productId} product={product} />)}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Enterprise Partnership Services                                    */
/* ------------------------------------------------------------------ */
const PARTNERSHIP_ITEMS = [
  { label: 'Contribute to open-source projects', Icon: Code },
  { label: 'Join our developer community', Icon: UsersThree },
  { label: 'Report bugs and suggest features', Icon: Bug },
  { label: 'Translate Oxy for your language', Icon: Translate },
  { label: 'Write documentation and tutorials', Icon: BookOpenText },
  { label: 'Volunteer for community initiatives', Icon: HandHeart },
  { label: 'Spread the word', Icon: Megaphone },
]

function PartnershipSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-border text-foreground">
      <img
        src="/images/landing/partnerships-banner.avif"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 size-full object-cover object-[50%_30%]"
        width={1440}
        height={900}
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 -z-10 bg-background/75" />

      <div className="container">
        <div className="border-x border-border">
          <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="px-4 py-8 lg:px-10 lg:py-10">
              <p className="mb-4 text-primary"><strong>Join the mission</strong></p>
              <AnimatedTitle as="h2" className="text-heading-responsive-lg mb-4">Build the future with us</AnimatedTitle>
              <p className="max-w-[500px] text-muted-foreground">
                Whether you&apos;re a developer, designer, activist, or dreamer — there&apos;s a place for you in the Oxy ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px border-t border-border bg-border lg:border-l lg:border-t-0 max-[650px]:grid-cols-1">
              {PARTNERSHIP_ITEMS.map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex min-h-20 flex-col justify-between gap-3 bg-background/75 p-3 text-base leading-snug transition-colors hover:bg-background/90"
                >
                  <Icon size={20} weight="regular" className="text-muted-foreground" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
              <a
                href="/sustain"
                className="flex min-h-20 flex-col justify-end bg-primary p-3 text-primary-foreground transition-opacity duration-300 hover:opacity-80"
              >
                Get Involved
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  For Developers card                                                */
/* ------------------------------------------------------------------ */

function CommonsAppSection() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  // The backdrop is 140% tall and starts 20% above the band, so a ±8% drift of
  // its own height still leaves it covering the band edge to edge.
  const backdropY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  // The phone only ever moves DOWN from its resting position. Lifting it would
  // raise the photo's hard bottom edge into the band and show the cut.
  const phoneY = useTransform(scrollYProgress, [0, 1], ['22%', '0%'])

  return (
    <section ref={ref} className="relative isolate overflow-hidden border-y border-border">
      <motion.img
        src={`${IMG}/commons-night.webp`}
        alt=""
        aria-hidden="true"
        style={reduce ? undefined : { y: backdropY }}
        className="-z-20 absolute -top-[20%] left-0 h-[140%] w-full object-cover"
        width={1794}
        height={877}
        loading="lazy"
        decoding="async"
      />
      {/* The illustration is busiest on the left, where the copy sits. */}
      <div className="-z-10 absolute inset-0 bg-[linear-gradient(90deg,rgba(2,10,38,0.88)_0%,rgba(2,10,38,0.72)_45%,rgba(2,10,38,0.35)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(2,10,38,0.85)_0%,rgba(2,10,38,0.6)_60%,rgba(2,10,38,0.85)_100%)]" />

      {/* No bottom padding on the right: the phone is meant to rise out of the
          band's lower edge rather than float in the middle of it. */}
      <div className="container pt-20 lg:pt-28">
        <div className="grid grid-cols-12 items-end gap-6">
          <div className="col-span-full pb-20 text-white max-lg:text-center lg:col-span-5 lg:pb-28">
            <AnimatedTitle as="h2" className="text-heading-responsive-lg mb-5">Commons app by Oxy</AnimatedTitle>
            <p className="max-w-[500px] opacity-80 max-lg:mx-auto">
              Self-custody identity for everything Oxy. Your keys never leave your phone, so no company can lock you
              out, track you, or sell your data.
            </p>

            <div className="mt-10 flex flex-col gap-5 max-lg:items-center lg:mt-12">
              <p className="max-w-[530px] font-[450] text-[13px] leading-relaxed tracking-wide">
                <span className="opacity-60">
                  Connect all your tools, access open-source AI, and join a global community building technology for
                  good. Every product we create is designed to serve people, not exploit them.
                </span>{' '}
                Free and open source.
              </p>
              {/* Official store artwork, served as files. Commons is live on
                  Google Play; the App Store link waits on the iOS listing and
                  points at the ecosystem page until then. */}
              <div className="flex flex-wrap items-center gap-3 max-lg:justify-center">
                <a href="/apps" aria-label="Download on the App Store" className="inline-flex w-fit transition-opacity hover:opacity-80">
                  <img src="/images/badges/app-store.svg" alt="Download on the App Store" width={128} height={38} />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=so.oxy.commons"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get it on Google Play"
                  className="inline-flex w-fit transition-opacity hover:opacity-80"
                >
                  <img src="/images/badges/google-play.svg" alt="Get it on Google Play" width={128} height={38} />
                </a>
              </div>
            </div>
          </div>

          <motion.div
            style={reduce ? undefined : { y: phoneY }}
            className="col-span-full self-end max-lg:mt-4 lg:col-span-6 lg:col-start-7"
          >
            <img
              src={`${IMG}/identity-app.webp`}
              alt="Oxy self-custody identity on iOS"
              className="mx-auto h-auto w-full max-w-[320px] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)] sm:max-w-[440px] lg:max-w-none"
              width={577}
              height={433}
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Trusted By                                                         */
/* ------------------------------------------------------------------ */
// Previously rendered real third-party logos (Strava, Polestar, Merck, ...)
// cloned from another marketing site. Replaced with an empty list and
// gated behind FEATURES.SHOW_TRUSTED_LOGOS until real Oxy partner / user
// logos are available.
const TRUSTED_LOGOS: string[] = []

function TrustedBySection() {
  return (
    <div className="bg-surface text-foreground">
      <section className="container">
        <div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-full py-10 pb-[50px]">
              <h3 className="text-[22px] leading-[1.2] font-[450] mb-10 max-w-[720px]">
                Built by the community, for the community.
              </h3>
              <div className="grid grid-cols-8 max-[950px]:grid-cols-2 gap-x-5 items-center">
                {TRUSTED_LOGOS.map((logo) => (
                  <div key={logo} className="flex justify-center items-center">
                    <img src={`${IMG}/${logo}.svg`} alt={logo} className="max-h-[66px] w-auto dark:invert" width={224} height={66} loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  return (
    <>
      <SEO
        title="Oxy, an open-source ecosystem of ethical technology"
        description="Oxy is an independent, open-source ecosystem of ethical technology built to empower people, not exploit them. Apps, AI, an operating system, a browser, identity and more."
        canonicalPath="/"
      />
      <Navbar transparent />
      <main className="oxy-landing">
        <HomeHero />
        {FEATURES.SHOW_TRUSTED_LOGOS && <PartnerLogos />}
        <BuildForEveryoneSection />
        <ValuesSection />
        <FeaturesSection />
        {(FEATURES.SHOW_HOMEPAGE_STATS || FEATURES.SHOW_TESTIMONIALS) && <StatsAndTestimonialsSection />}
        <IndependentEcosystemSection />
        <EcosystemStack />
        <EcosystemSection />
        <FairCoinSection />
        <PartnershipSection />
        <AIResearchSection />
        <CommonsAppSection />
        {FEATURES.SHOW_TRUSTED_LOGOS && <TrustedBySection />}
        <FaqSection
          title="Frequently asked questions."
          items={homeFaqs}
          borderTop={FEATURES.SHOW_TRUSTED_LOGOS}
          borderBottom
        />
      </main>
      <Footer hideTopDivider />
    </>
  )
}
