import { useState, useCallback, useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, BookOpenText, Bug, Code, HandHeart, Megaphone, Translate, UsersThree } from '@phosphor-icons/react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HomeHero from '../components/homepage/HomeHero'
import FairCoinSection from '../components/sections/FairCoinSection'
import FaqSection from '../components/sections/FaqSection'
import { usePage, type PageSection } from '../api/hooks'
import { FEATURES } from '../constants'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import type SwiperType from 'swiper'
import 'swiper/css'
import '../styles/landing.css'
import AIResearchSection from '../components/ai/AIResearchSection'
import AIResearchFeatureGrid from '../components/ai/AIResearchFeatureGrid'
import OxyCommunityTicker from '../components/sections/OxyCommunityTicker'
import OxyUseCasesRolo from '../components/sections/OxyUseCasesRolo'
import PhotoCardCarousel, { type PhotoCard } from '../components/sections/PhotoCardCarousel'
import { Link } from 'react-router-dom'
import { AnimatedTitle } from '../components/ui/AnimatedTitle'
import { useTranslation } from '../lib/i18n'

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
const IMG = '/images/landing'

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

const BUILD_FOR_EVERYONE_LINKS: Array<Omit<ResourceLink, 'label'> & { key: string }> = [
  { key: 'home.buildLinkNewsroom', href: '/newsroom' },
  { key: 'home.buildLinkDocs', href: '/developers/docs' },
  { key: 'home.buildLinkCode', href: 'https://github.com/OxyHQ', external: true },
  { key: 'home.buildLinkTeam', href: '/company/team' },
]

function BuildForEveryoneSection() {
  const { t, locale } = useTranslation()
  const { data: pageData } = usePage('home')
  const sections = pageData?.sections
  // Heading is stored as a single string with a pipe separator so the CMS can
  // drive line-breaks at the exact point used by the current layout. Fall
  // back to the pre-CMS two-line split when nothing has been published yet.
  const headingFallback = `${t('home.allInOneHeadingLine1')}|${t('home.allInOneHeadingLine2')}`
  const headingRaw = locale === 'en'
    ? pageHeading(sections, 'all-in-one', headingFallback)
    : headingFallback
  const [headingLine1, headingLine2] = headingRaw.includes('|')
    ? headingRaw.split('|', 2)
    : [headingRaw, '']
  const body = locale === 'en'
    ? pageContent(sections, 'all-in-one', t('home.allInOneBody'))
    : t('home.allInOneBody')

  return (
    <section id="build-for-everyone" className="scroll-mt-[var(--site-header-height)]">
      <div className="container">
        <motion.div
          className="grid grid-cols-1 items-start gap-8 py-8 min-[951px]:grid-cols-2 min-[951px]:gap-12 min-[951px]:py-12"
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
              <p className="mt-4 max-w-[460px] opacity-80">{body}</p>
            </div>

            {/* Right — resource links */}
            <ul className="flex flex-col gap-2">
              {BUILD_FOR_EVERYONE_LINKS.map((link) => {
                const rowClass = `group flex items-center justify-between gap-4 rounded-full bg-surface px-5 py-3 font-display text-xl font-[450] transition-opacity duration-200 hover:opacity-60`
                const arrow = (
                  <ArrowUpRight
                    weight="regular"
                    className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                )
                return (
                  <li key={link.key}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noreferrer" className={rowClass}>
                        <span>{t(link.key)}</span>
                        {arrow}
                      </a>
                    ) : (
                      <Link to={link.href} className={rowClass}>
                        <span>{t(link.key)}</span>
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
const VALUES: Array<Pick<PhotoCard, 'image'>> = [
  {
    image: '/images/hero/hero-4.webp',
  },
  {
    image: '/images/hero/hero-1.webp',
  },
  {
    image: '/images/hero/hero-5.jpg',
  },
  {
    image: '/images/hero/hero-3.webp',
  },
]

function ValuesSection() {
  const { t } = useTranslation()
  const cards = [
    { image: VALUES[0].image, title: t('home.valueHumanTitle'), description: t('home.valueHumanDescription') },
    { image: VALUES[1].image, title: t('home.valueDataTitle'), description: t('home.valueDataDescription') },
    { image: VALUES[2].image, title: t('home.valuePurposeTitle'), description: t('home.valuePurposeDescription') },
    { image: VALUES[3].image, title: t('home.valueOpenTitle'), description: t('home.valueOpenDescription') },
  ]
  return <PhotoCardCarousel title={t('home.valuesHeading')} cards={cards} />
}

/* ------------------------------------------------------------------ */
/*  Features Tabs                                                      */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  ROI Stats                                                          */
/* ------------------------------------------------------------------ */
const STATS = [
  { labelKey: 'home.statsOpenSource', value: '100%', descKey: 'home.statsOpenSourceDesc' },
  { labelKey: 'home.statsCommunity', value: '50K+', descKey: 'home.statsCommunityDesc' },
  { labelKey: 'home.statsProducts', value: '6', descKey: 'home.statsProductsDesc' },
  { labelKey: 'home.statsDataSold', value: '$0', descKey: 'home.statsDataSoldDesc' },
  { labelKey: 'home.statsCountries', value: '120+', descKey: 'home.statsCountriesDesc' },
]

function StatsAndTestimonialsSection() {
  const { t } = useTranslation()
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
                spaceBetween={16}
                grabCursor
                className="roi-stats-swiper my-6"
                breakpoints={{
                  1460: { slidesPerView: STATS.length, spaceBetween: 24 },
                }}
              >
                {STATS.map((s) => (
                  <SwiperSlide key={s.labelKey} className="!w-auto">
                    <div className="min-w-[230px] px-6 max-[1460px]:min-w-[250px] max-[950px]:min-w-[150px]">
                      <div>
                    <p className="text-sm leading-4 tracking-wide font-[450] opacity-80 mb-[34px]">{t(s.labelKey)}</p>
                      </div>
                      <div>
                        <p className="text-heading-responsive-lg mb-[9px]">{s.value}</p>
                        <p className="max-w-[210px]">{t(s.descKey)}</p>
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
                {TESTIMONIALS.map((testimonial, i) => (
                  <SwiperSlide key={i} style={{ height: 'auto' }}>
                    <div
                      className={`relative overflow-hidden rounded-3xl aspect-[4/5] max-[950px]:aspect-[4/6] ${testimonial.light ? 'text-white' : 'text-foreground/80'}`}
                    >
                      {/* Below the fold, inside a carousel — `eager` made every
                          slide's background a blocking request on first paint. */}
                      <img src={testimonial.bg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" width={800} height={1000} loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="relative z-10 flex flex-col justify-between gap-12 px-7 py-8 max-[950px]:p-8 h-full">
                        <div>
                            <p className="text-base leading-relaxed tracking-tight">&ldquo;{t(testimonial.quoteKey)}&rdquo;</p>
                        </div>
                        <div>
                          <p className="text-sm leading-relaxed">
                            <span className="opacity-60">{t(testimonial.roleKey)}</span><br />
                            {t('home.valuesHeading')}
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
                  aria-label={playing ? t('home.statsPause') : t('home.statsPlay')}
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
    quoteKey: 'home.valueHumanDescription',
    roleKey: 'home.valueHumanTitle',
    bg: `${IMG}/agents-quote-bg-01.webp`,
    light: true,
  },
  {
    quoteKey: 'home.valueDataDescription',
    roleKey: 'home.valueDataTitle',
    bg: `${IMG}/agents-quote-bg-02.webp`,
    light: false,
  },
  {
    quoteKey: 'home.valuePurposeDescription',
    roleKey: 'home.valuePurposeTitle',
    bg: `${IMG}/agents-quote-bg-03.webp`,
    light: true,
  },
  {
    quoteKey: 'home.valueOpenDescription',
    roleKey: 'home.valueOpenTitle',
    bg: `${IMG}/agents-quote-bg-04.webp`,
    light: true,
  },
]

/* ------------------------------------------------------------------ */
/*  Enterprise Partnership Services                                    */
/* ------------------------------------------------------------------ */
const PARTNERSHIP_ITEMS = [
  { key: 'home.partnershipContribute', Icon: Code },
  { key: 'home.partnershipCommunity', Icon: UsersThree },
  { key: 'home.partnershipBugs', Icon: Bug },
  { key: 'home.partnershipTranslate', Icon: Translate },
  { key: 'home.partnershipDocs', Icon: BookOpenText },
  { key: 'home.partnershipVolunteer', Icon: HandHeart },
  { key: 'home.partnershipSpread', Icon: Megaphone },
]

function PartnershipSection() {
  const { t } = useTranslation()
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <section ref={ref} className="relative isolate overflow-hidden text-foreground">
      <motion.img
        src="/images/landing/partnerships-banner.avif"
        alt=""
        aria-hidden="true"
        style={reduce ? undefined : { y: backgroundY }}
        className="absolute -top-[12%] -z-20 h-[124%] w-full object-cover object-[50%_30%]"
        width={1440}
        height={900}
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 -z-10 bg-background/75" />

      <div className="container">
        <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-8 lg:py-8">
          <div className="px-4 lg:px-2">
            <p className="mb-4 text-primary">{t('home.partnershipEyebrow')}</p>
            <AnimatedTitle as="h2" className="text-heading-responsive-lg mb-4">{t('home.partnershipTitle')}</AnimatedTitle>
            <p className="max-w-[500px] text-muted-foreground">
              {t('home.partnershipDescription')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-[650px]:grid-cols-1">
            {PARTNERSHIP_ITEMS.map(({ key, Icon }) => (
              <div
                key={key}
                className="flex min-h-16 items-center gap-3 rounded-full bg-background/75 px-4 py-3 text-base leading-snug transition-colors hover:bg-background/90"
              >
                <Icon size={20} weight="regular" className="text-muted-foreground" aria-hidden="true" />
                <span>{t(key)}</span>
              </div>
            ))}
            <a
              href="/sustain"
              className="flex min-h-16 items-center rounded-full bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-opacity duration-300 hover:opacity-80"
            >
              {t('home.partnershipCta')}
            </a>
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
  const { t } = useTranslation()
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
    <section ref={ref} className="relative isolate overflow-hidden">
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
            <AnimatedTitle as="h2" className="mb-5 text-heading-responsive-lg lg:text-[4rem] lg:leading-[1.05]">{t('home.commonsTitle')}</AnimatedTitle>
            <p className="max-w-[500px] text-lg leading-relaxed opacity-80 lg:text-xl max-lg:mx-auto">
              {t('home.commonsDescription')}
            </p>

            <div className="mt-10 flex flex-col gap-5 max-lg:items-center lg:mt-12">
              <p className="max-w-[530px] font-[450] text-[13px] leading-relaxed tracking-wide">
                <span className="opacity-60">
                  {t('home.commonsDetails')}
                </span>{' '}
                {t('home.commonsFree')}
              </p>
              {/* Official store artwork, served as files. Commons is live on
                  Google Play; the App Store link waits on the iOS listing and
                  points at the ecosystem page until then. */}
              <div className="flex flex-wrap items-center gap-3 max-lg:justify-center">
                <a href="/apps" aria-label={t('home.appStore')} className="inline-flex w-fit overflow-hidden rounded-full transition-opacity hover:opacity-80">
                  <img src="/images/badges/app-store.svg" alt={t('home.appStore')} width={128} height={38} />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=so.oxy.commons"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('home.googlePlay')}
                  className="inline-flex w-fit overflow-hidden rounded-full transition-opacity hover:opacity-80"
                >
                  <img src="/images/badges/google-play.svg" alt={t('home.googlePlay')} width={128} height={38} />
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
              alt={t('home.commonsImageAlt')}
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
  const { t } = useTranslation()
  return (
    <div className="bg-surface text-foreground">
      <section className="container">
        <div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-full py-10 pb-[50px]">
              <h3 className="text-[22px] leading-[1.2] font-[450] mb-10 max-w-[720px]">
                {t('home.trustedHeading')}
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
  const { t } = useTranslation()
  const homeFaqs = [
    { question: t('home.faq1Question'), answer: t('home.faq1Answer') },
    { question: t('home.faq2Question'), answer: t('home.faq2Answer') },
    { question: t('home.faq3Question'), answer: t('home.faq3Answer') },
    { question: t('home.faq4Question'), answer: t('home.faq4Answer') },
    { question: t('home.faq5Question'), answer: t('home.faq5Answer') },
    { question: t('home.faq6Question'), answer: t('home.faq6Answer') },
  ]
  return (
    <>
      <SEO
        title={t('home.seoTitle')}
        description={t('home.seoDescription')}
        canonicalPath="/"
      />
      <Navbar transparent />
      <main className="oxy-landing">
        <HomeHero />
        {FEATURES.SHOW_TRUSTED_LOGOS && <PartnerLogos />}
        <BuildForEveryoneSection />
        <OxyUseCasesRolo />
        <ValuesSection />
        {(FEATURES.SHOW_HOMEPAGE_STATS || FEATURES.SHOW_TESTIMONIALS) && <StatsAndTestimonialsSection />}
        <FairCoinSection />
        <AIResearchFeatureGrid />
        <OxyCommunityTicker />
        <PartnershipSection />
        <AIResearchSection />
        <CommonsAppSection />
        {FEATURES.SHOW_TRUSTED_LOGOS && <TrustedBySection />}
        <FaqSection
          title={t('home.faqHeading')}
          items={homeFaqs}
        />
      </main>
      <Footer hideTopDivider />
    </>
  )
}
