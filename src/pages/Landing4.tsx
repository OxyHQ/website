import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HeroCarousel from '../components/homepage/HeroCarousel'
import { heroCarouselSlots } from '../data/heroCarousel'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import type SwiperType from 'swiper'
import 'swiper/css'
import '../styles/landing.css'

const IMG = '/images/landing'

const BTN = 'inline-flex items-center cursor-pointer text-base leading-relaxed font-[450] rounded-full px-4 py-2 max-h-[38px] transition-opacity duration-200 hover:opacity-60'

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function HeroSection() {
  return (
    <div className="hero-oxy">
      {/* Background video */}
      <div className="hero-oxy-bg">
        <video src={`${IMG}/hero-background.mp4`} autoPlay loop muted playsInline />
        <div className="hero-oxy-overlay" />
      </div>

      {/* Text overlay */}
      <div className="hero-oxy-content">
        <div>
          <h1>
            Creating a future where technology empowers individuals
            to live connected, fulfilling, and sustainable lives.
          </h1>
          <p className="hero-oxy-subtitle">
            Built by people who believe in change. Ethical, open, and deeply human.
          </p>
        </div>
      </div>

      {/* Infinite carousel grid */}
      <HeroCarousel slots={heroCarouselSlots} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Oxy Mission                                                        */
/* ------------------------------------------------------------------ */
function AllInOneSection() {
  return (
    <section className="py-10 max-[950px]:py-6">
      <div className="grid grid-cols-12 gap-6 max-w-[1432px] mx-auto px-8 max-[950px]:px-5">
        <div className="col-span-full text-center space-y-[1em]">
          <h2 className="font-serif text-[40px] leading-[1.07] max-[950px]:text-[34px] max-[950px]:leading-none">
            Build for everyone,<br className="max-[950px]:hidden" />
            not just yourself.
          </h2>
          <p className="max-w-[440px] mx-auto">Oxy exists because we believe technology should serve humanity, not exploit it. Through community-driven projects and open-source tools, we prove that helping people and building sustainable systems aren&apos;t competing goals. They&apos;re the same mission.</p>
          <div className="flex flex-col items-center gap-2">
            <a href="/newsroom" className="text-primary hover:opacity-60 transition-opacity duration-200">Oxy Newsroom &rarr;</a>
            <a href="/docs" className="text-primary hover:opacity-60 transition-opacity duration-200">Search documentation &rarr;</a>
            <a href="https://github.com/oxyhq" className="text-primary hover:opacity-60 transition-opacity duration-200">Dig into the code &rarr;</a>
            <a href="/company/team" className="text-primary hover:opacity-60 transition-opacity duration-200">Meet the Oxy team &rarr;</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Products Tabs                                                      */
/* ------------------------------------------------------------------ */
const FEATURE_TABS = [
  {
    id: 'mention',
    label: 'Mention',
    heading: 'Connect authentically.<br>Share what matters.',
    color: 'bg-blue-600',
  },
  {
    id: 'horizon',
    label: 'Horizon',
    heading: 'See the bigger picture.',
    color: 'bg-emerald-600',
  },
  {
    id: 'faircoin',
    label: 'FairCoin',
    heading: 'Currency that cares.',
    color: 'bg-amber-600',
  },
  {
    id: 'homiio',
    label: 'Homiio',
    heading: 'Home for everyone.',
    color: 'bg-rose-600',
  },
  {
    id: 'oxy-ai',
    label: 'Oxy AI',
    heading: 'Intelligence with integrity.',
    color: 'bg-violet-600',
  },
]

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  mention: 'Social networking reimagined without ads or data exploitation.',
  horizon: 'A global community platform for collaboration and impact.',
  faircoin: 'Sustainable cryptocurrency powering ethical commerce.',
  homiio: 'Making affordable housing accessible through technology.',
  'oxy-ai': 'AI tools built to advance justice and sustainability.',
}

function FeaturesSection() {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<number>(Date.now())
  const AUTO_DURATION = 6000

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    startRef.current = Date.now()
    setProgress(0)
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min((elapsed / AUTO_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        setActive((prev) => (prev + 1) % FEATURE_TABS.length)
      }
    }, 50)
  }, [stopTimer])

  useEffect(() => {
    if (playing) {
      startTimer()
    } else {
      stopTimer()
      setProgress(0)
    }
    return stopTimer
  }, [active, playing, startTimer, stopTimer])

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
          <img
            src={`${IMG}/agents-features-bg.webp`}
            alt="Agents features bg"
            style={{ objectPosition: '50% 0%' }}
          />
        </div>
        <div className="agents-features-icons">
          <img
            src={`${IMG}/agents-features-icons.svg`}
            alt="Agents features icons"
            style={{ objectPosition: '50% 50%' }}
          />
        </div>
        <div className="agents-features-content text-white text-center pt-[56px]">
          <div className="agents-features-tabs-nav tabs-nav">
            {FEATURE_TABS.map((t, i) => (
              <a
                key={t.id}
                className={i === active ? 'active' : undefined}
                data-tab={t.id}
                onClick={() => handleTabClick(i)}
              >
                <strong>{t.label}</strong>
                <div
                  className="timer"
                  style={{ width: i === active && playing ? `${progress}%` : '0%' }}
                />
              </a>
            ))}
            <a
              className={`toggle-autoplay${playing ? ' playing' : ''}`}
              onClick={toggleAutoplay}
            >
              <svg width="8" height="12" className="pause" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.895149 12C0.594679 12 0.369327 11.9157 0.219092 11.7471C0.0730308 11.5785 0 11.3255 0 10.9883V1.00468C0 0.672131 0.0751174 0.421546 0.225352 0.252927C0.375587 0.0843091 0.598852 0 0.895149 0H2.3662C2.65832 0 2.8795 0.0819672 3.02973 0.245902C3.18414 0.409836 3.26135 0.662763 3.26135 1.00468V10.9883C3.26135 11.3255 3.18414 11.5785 3.02973 11.7471C2.8795 11.9157 2.65832 12 2.3662 12H0.895149ZM5.64006 12C5.33959 12 5.11424 11.9157 4.96401 11.7471C4.81377 11.5785 4.73865 11.3255 4.73865 10.9883V1.00468C4.73865 0.672131 4.81377 0.421546 4.96401 0.252927C5.11424 0.0843091 5.33959 0 5.64006 0H7.09859C7.39906 0 7.62441 0.0819672 7.77465 0.245902C7.92488 0.409836 8 0.662763 8 1.00468V10.9883C8 11.3255 7.92488 11.5785 7.77465 11.7471C7.62441 11.9157 7.39906 12 7.09859 12H5.64006Z" fill="currentColor"/>
              </svg>
              <svg width="10" height="11" className="play" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 9.96835V1.03165C0 0.681435 0.0904393 0.421941 0.271318 0.253165C0.452196 0.0843882 0.667528 0 0.917313 0C1.14126 0 1.3652 0.0611814 1.58915 0.183544L9.21835 4.55063C9.49397 4.70675 9.69208 4.85443 9.81266 4.99367C9.93755 5.13291 10 5.30169 10 5.5C10 5.69409 9.93755 5.86287 9.81266 6.00633C9.69208 6.14557 9.49397 6.29325 9.21835 6.44937L1.58915 10.8165C1.3652 10.9388 1.14126 11 0.917313 11C0.667528 11 0.452196 10.9135 0.271318 10.7405C0.0904393 10.5717 0 10.3143 0 9.96835Z" fill="currentColor"/>
              </svg>
            </a>
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
                    <img src={`${IMG}/browser.svg`} alt="Browser UI" className="screen-frame" />
                    <div className="screen-content">
                      <div className={`${t.color} w-full h-full flex items-center justify-center`}>
                        <p className="text-white text-2xl font-[450]">{t.label}</p>
                        <p className="text-white/70 text-base mt-2 px-8">{FEATURE_DESCRIPTIONS[t.id]}</p>
                      </div>
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
/*  Impact Stats                                                       */
/* ------------------------------------------------------------------ */
const STATS = [
  { label: 'Open Source', value: '100%', desc: 'of our code is public' },
  { label: 'Community', value: '50K+', desc: 'developers and contributors' },
  { label: 'Products', value: '6', desc: 'platforms serving real needs' },
  { label: 'Data Sold', value: '$0', desc: 'we never sell user data' },
  { label: 'Countries', value: '120+', desc: 'communities worldwide' },
]

/* ------------------------------------------------------------------ */
/*  Values Cards                                                       */
/* ------------------------------------------------------------------ */
const TESTIMONIALS = [
  {
    title: 'Human-first design',
    quote: 'We design tools that empower people, not manipulate them. Every decision starts with the question: does this serve the user?',
    bg: `${IMG}/agents-quote-bg-01.webp`,
    light: true,
  },
  {
    title: 'Your data stays yours',
    quote: 'No ads, no data brokers, no hidden monetization. Your information belongs to you, period.',
    bg: `${IMG}/agents-quote-bg-02.webp`,
    light: false,
  },
  {
    title: 'AI with a purpose',
    quote: 'Every product we ship is built to advance justice, inclusion, or sustainability. If it doesn\u2019t move the needle on what matters, we don\u2019t build it.',
    bg: `${IMG}/agents-quote-bg-03.webp`,
    light: true,
  },
  {
    title: 'Open by default',
    quote: 'Every Oxy tool is open source. We believe transparency isn\u2019t optional \u2014 it\u2019s the foundation of trust.',
    bg: `${IMG}/agents-quote-bg-04.webp`,
    light: true,
  },
]

function StatsAndTestimonialsSection() {
  const swiperRef = useRef<SwiperType>(null)
  const [playing, setPlaying] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef<ReturnType<typeof setInterval>>(null)
  const AUTO_DELAY = 5000

  const startProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    const start = Date.now()
    setProgress(0)
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min((elapsed / AUTO_DELAY) * 100, 100))
    }, 50)
  }, [])

  const stopProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    setProgress(0)
  }, [])

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
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

  // Total number of "pages" (groups) — Swiper handles this via snapGrid
  const totalPages = swiperRef.current
    ? Math.ceil(TESTIMONIALS.length / (swiperRef.current.params.slidesPerView as number || 4))
    : 2

  return (
    <section className="py-10 max-[950px]:py-6">
      <div className="grid grid-cols-12 gap-6 max-w-[1432px] mx-auto px-8 max-[950px]:px-5">
        <div className="col-span-full mb-5">
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
                    <p className="font-serif text-[40px] leading-[1.07] mb-[9px]">{s.value}</p>
                    <p className="max-w-[210px]">{s.desc}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="col-span-full">
          <Swiper
            modules={[Autoplay]}
            onSwiper={(s) => { swiperRef.current = s }}
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
                  className={`relative overflow-hidden rounded-3xl aspect-[4/5] max-[950px]:aspect-[4/6] bg-cover bg-center ${t.light ? 'text-white' : 'text-foreground/80'}`}
                  style={{ backgroundImage: `url(${t.bg})` }}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative z-10 flex flex-col justify-between gap-12 px-7 py-8 max-[950px]:p-8 h-full">
                    <div>
                      <p className="text-base leading-relaxed tracking-tight">{t.quote}</p>
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed">
                        <strong>{t.title}</strong>
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
                  className={`dot${Math.floor(activeIndex / (swiperRef.current?.params.slidesPerView as number || 4)) === i ? ' is-selected' : ''}`}
                  onClick={() => {
                    const perView = swiperRef.current?.params.slidesPerView as number || 4
                    swiperRef.current?.slideTo(i * perView)
                  }}
                >
                  <div
                    className="timer"
                    style={{
                      width: Math.floor(activeIndex / (swiperRef.current?.params.slidesPerView as number || 4)) === i && playing
                        ? `${progress}%`
                        : '0%',
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
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Independent Ecosystem                                              */
/* ------------------------------------------------------------------ */
function ModelAgnosticSection() {
  return (
    <section className="py-8">
      <div className="grid grid-cols-12 gap-6 max-w-[1432px] mx-auto px-8 max-[950px]:px-5">
        <div className="col-span-full">
          <div className="model-agnostic-wrap relative max-[950px]:mb-8">
            <div className="grid grid-cols-12 gap-6 items-center">
              <div className="col-span-6 max-[950px]:col-span-full z-10 flex items-center justify-center py-[85px] pb-[70px]">
              </div>
              <div className="col-span-4 max-[950px]:hidden col-start-8 z-10 text-white">
                <p className="text-[22px] leading-[1.2] font-[450] max-w-[420px]">
                  An independent ecosystem of ethical technology.
                </p>
              </div>
            </div>
            <div className="model-agnostic-bg absolute inset-0 overflow-hidden rounded-3xl z-[1]">
              <img src={`${IMG}/agents-model-agnostic.webp`} alt="Independent ecosystem" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="hidden max-[950px]:block px-3">
            <p className="text-[22px] leading-[1.2] font-[450] max-w-[420px]">
              An independent ecosystem of ethical technology.
            </p>
            <p className="mt-4 opacity-80">
              Radically transparent, fiercely human. No ads. No data selling. No venture capital strings. Just purpose-driven tools designed for real-world impact.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Oxy Products Deep Dive (Side by Side)                              */
/* ------------------------------------------------------------------ */
const TEAM_TABS = [
  {
    id: 'mention',
    label: 'Mention',
    desc: 'A social network built on respect. No algorithms designed to addict. No data harvested for ads. Just genuine human connection.',
    prompts: ['What\'s trending in my community?', 'Show me posts from people I follow', 'Find conversations about sustainability'],
  },
  {
    id: 'horizon',
    label: 'Horizon',
    desc: 'A global platform where communities collaborate on what matters. From local initiatives to worldwide movements.',
    prompts: ['Find local initiatives near me', 'Connect with communities worldwide', 'Start a collaborative project'],
  },
  {
    id: 'faircoin',
    label: 'FairCoin',
    desc: 'Cryptocurrency designed for sustainability, not speculation. Powering ethical commerce and local economies worldwide.',
    prompts: ['What\'s the current exchange rate?', 'Find stores accepting FairCoin', 'Track my transaction history'],
  },
  {
    id: 'homiio',
    label: 'Homiio',
    desc: 'Technology that makes affordable housing accessible. Connecting people with homes they can actually afford.',
    prompts: ['Find affordable housing near me', 'Check my application status', 'Compare neighborhood amenities'],
  },
]

function TypewriterText({ texts, resetKey }: { texts: string[]; resetKey: number }) {
  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setTextIdx(0)
    setCharIdx(0)
    setDeleting(false)
  }, [resetKey])

  useEffect(() => {
    const text = texts[textIdx]
    if (!deleting && charIdx < text.length) {
      const id = setTimeout(() => setCharIdx((c) => c + 1), 40)
      return () => clearTimeout(id)
    }
    if (!deleting && charIdx === text.length) {
      const id = setTimeout(() => setDeleting(true), 2000)
      return () => clearTimeout(id)
    }
    if (deleting && charIdx > 0) {
      const id = setTimeout(() => setCharIdx((c) => c - 1), 20)
      return () => clearTimeout(id)
    }
    if (deleting && charIdx === 0) {
      setDeleting(false)
      setTextIdx((i) => (i + 1) % texts.length)
    }
  }, [charIdx, deleting, textIdx, texts])

  return (
    <span className="typewrap">
      {texts[textIdx].slice(0, charIdx)}
    </span>
  )
}

function TeamsSection() {
  const [activeId, setActiveId] = useState(TEAM_TABS[0].id)
  const [resetKey, setResetKey] = useState(0)

  const handleTabClick = useCallback((id: string) => {
    setActiveId(id)
    setResetKey((k) => k + 1)
  }, [])

  return (
    <section className="py-8">
      <div className="grid grid-cols-12 gap-6 max-w-[1432px] mx-auto px-8 max-[950px]:px-5 side-by-side-tabs">
        <div className="col-span-6 max-[950px]:col-span-full">
          <div className="tabs tabs-fade">
            {TEAM_TABS.map((t) => (
              <div key={t.id} className={`tab${t.id === activeId ? ' active' : ''}`} data-tab={t.id}>
                <div className="media-with-prompt">
                  <div className="media rounded-3xl overflow-hidden" style={{ aspectRatio: '181 / 145' }}>
                    <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                      <p className="text-2xl font-[450] opacity-40">{t.label}</p>
                    </div>
                  </div>
                  <div className="prompt-overlay">
                    <div className="prompt-box-bg" />
                    <div className="prompt-box-blur" />
                    <div className="typewrite text-white">
                      {t.id === activeId && <TypewriterText texts={t.prompts} resetKey={resetKey} />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-5 col-start-8 max-[950px]:col-span-full max-[950px]:col-start-1 flex flex-col gap-12 justify-between">
          <div>
            <p className="text-primary mb-5"><strong>Explore the Oxy Ecosystem</strong></p>
            <div className="teams-tabs-nav flex flex-col [&>a]:cursor-pointer">
              {TEAM_TABS.map((t) => (
                <a
                  key={t.id}
                  className={`text-[22px] leading-[1.2] font-[450] flex items-center justify-start gap-[0.3em] cursor-pointer${t.id === activeId ? ' opacity-100' : ' opacity-30'}`}
                  data-tab={t.id}
                  onClick={() => handleTabClick(t.id)}
                >
                  <span className={t.id === activeId ? 'inline' : 'hidden'}>&rarr;</span> {t.label}
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-[1em]">
            <div className="tabs">
              {TEAM_TABS.map((t) => (
                <div key={t.id} className={`tab${t.id === activeId ? ' active' : ''}`} data-tab={t.id}>
                  <p className="opacity-80 max-w-[490px]">{t.desc}</p>
                </div>
              ))}
            </div>
            <a href="/products" className={`${BTN} bg-primary text-primary-foreground`}>Explore Products</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Get Involved                                                       */
/* ------------------------------------------------------------------ */
const PARTNERSHIP_ITEMS = [
  'Contribute to open-source projects',
  'Join our developer community',
  'Report bugs and suggest features',
  'Translate Oxy for your language',
  'Write documentation and tutorials',
  'Volunteer for community initiatives',
  'Spread the word',
]

function PartnershipSection() {
  return (
    <section className="py-10 max-[950px]:py-6">
      <div className="grid grid-cols-12 gap-6 max-w-[1432px] mx-auto px-8 max-[950px]:px-5 mb-8">
        <div className="col-span-full text-center">
          <p className="mb-6 text-primary"><strong>Join the mission</strong></p>
          <h2 className="font-serif text-[40px] leading-[1.07] max-[950px]:text-[34px] max-[950px]:leading-none mb-5">Build the future with us</h2>
          <p className="opacity-80 max-w-[500px] mx-auto">Whether you&apos;re a developer, designer, activist, or dreamer — there&apos;s a place for you in the Oxy ecosystem.</p>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6 max-w-[1432px] mx-auto px-8 max-[950px]:px-5">
        <div className="col-span-6 max-[950px]:col-span-full">
          <div className="min-[951px]:h-full overflow-hidden rounded-3xl">
            <img src={`${IMG}/partnerships-banner.avif`} alt="Get involved" className="w-full h-full object-cover" style={{ objectPosition: '50% 30%' }} />
          </div>
        </div>
        <div className="col-span-6 max-[950px]:col-span-full">
          <div className="grid grid-cols-2 max-[650px]:grid-cols-1 gap-6">
            {PARTNERSHIP_ITEMS.map((item) => (
              <div key={item} className="p-5 px-6 rounded-3xl bg-foreground/5 flex flex-col gap-[26px]">
                {item}
              </div>
            ))}
            <a href="/get-involved" className="bg-primary text-primary-foreground p-5 px-6 rounded-3xl flex flex-col gap-[26px] justify-end transition-opacity duration-400 hover:opacity-60">Get Involved</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Oxy Resources                                                      */
/* ------------------------------------------------------------------ */
const DEVELOPER_ITEMS = [
  'API Documentation',
  'GitHub Repositories',
  'SDK & Libraries',
  'Developer Blog',
  'Community Forum',
  'Bug Tracker',
]

const EVERYONE_ITEMS = [
  'Help Center',
  'Community Guidelines',
  'Privacy Policy',
  'Terms of Service',
  'Transparency Center',
  'Accessibility',
]

function IntegrationsSecuritySection() {
  return (
    <section className="py-10 max-[950px]:py-6">
      <div className="grid grid-cols-12 gap-6 max-w-[1432px] mx-auto px-8 max-[950px]:px-5 mb-8">
        <div className="col-span-full text-center">
          <h2 className="font-serif text-[40px] leading-[1.07] max-[950px]:text-[34px] max-[950px]:leading-none mb-5 max-w-[500px] mx-auto">Everything you need, all in one place</h2>
          <p className="opacity-80 max-w-[350px] mx-auto">Explore our documentation, contribute to our codebase, and connect with the community.</p>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6 max-w-[1432px] mx-auto px-8 max-[950px]:px-5">
        <div className="col-span-full">
          <div className="relative p-8 rounded-3xl bg-foreground/[0.03]">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-4 max-[950px]:col-span-full"><p><strong>For Developers</strong></p></div>
              <div className="col-span-7 max-[950px]:col-span-full">
                <div className="columns-3 max-[950px]:columns-1 max-[950px]:max-h-[350px] max-[950px]:overflow-hidden text-sm leading-4 tracking-wide font-[450]">
                  {DEVELOPER_ITEMS.map((item) => (
                    <div key={item} className="[&+&]:mt-3">
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <a className={`${BTN} bg-foreground/5 max-[950px]:static absolute bottom-8 left-8`} href="/docs">Explore Developer Hub</a>
          </div>
          <div className="relative p-8 rounded-3xl bg-foreground/[0.03] mt-4">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-4 max-[950px]:col-span-full"><p><strong>For Everyone</strong></p></div>
              <div className="col-span-7 max-[950px]:col-span-full">
                <div className="columns-3 max-[950px]:columns-1 max-[950px]:max-h-[350px] max-[950px]:overflow-hidden text-sm leading-4 tracking-wide font-[450]">
                  {EVERYONE_ITEMS.map((item) => (
                    <div key={item} className="[&+&]:mt-3">
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <a className={`${BTN} bg-foreground/5 max-[950px]:static absolute bottom-8 left-8`} href="/help">Visit Help Center</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Banner                                                             */
/* ------------------------------------------------------------------ */
function BannerSection() {
  return (
    <div className="aspect-[36/19] max-[950px]:aspect-[4/5] overflow-hidden mb-5">
      <img src={`${IMG}/team-banner.jpg`} alt="Team banner" className="w-full h-full object-cover" style={{ objectPosition: '40% 50%' }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Community Message                                                  */
/* ------------------------------------------------------------------ */
function TrustedBySection() {
  return (
    <section className="bg-surface text-foreground py-10 pb-[50px]">
      <div className="grid grid-cols-12 gap-6 max-w-[1432px] mx-auto px-8 max-[950px]:px-5">
        <div className="col-span-full">
          <h3 className="text-[22px] leading-[1.2] font-[450] mb-10 max-w-[720px]">
            Built by the community, <br className="max-[950px]:hidden" />for the community.
          </h3>
          <p className="opacity-80 max-w-[600px] mb-8">Oxy is 100% open source. Every line of code is public, every decision is transparent, and every tool is built with you in mind.</p>
          <a href="https://github.com/oxyhq" className={`${BTN} bg-primary text-primary-foreground`}>View on GitHub</a>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Landing4() {
  return (
    <>
      <SEO
        title="Oxy \u2014 An independent ecosystem of ethical technology"
        description="Creating a future where technology empowers individuals to live connected, fulfilling, and sustainable lives. Open source, human-first, and purpose-driven."
        canonicalPath="/"
      />
      <Navbar transparent />
      <main className="oxy-landing">
        <HeroSection />
        <AllInOneSection />
        <FeaturesSection />
        <StatsAndTestimonialsSection />
        <ModelAgnosticSection />
        <TeamsSection />
        <PartnershipSection />
        <IntegrationsSecuritySection />
        <BannerSection />
        <TrustedBySection />
      </main>
      <Footer />
    </>
  )
}
