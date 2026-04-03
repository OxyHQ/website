import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HeroCarousel from '../components/homepage/HeroCarousel'
import { heroCarouselSlots } from '../data/heroCarousel'
import '../styles/landing.css'

const IMG = '/images/landing'

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function HeroSection() {
  return (
    <>
      <div className="hero-oxy">
        {/* Background image */}
        <div className="hero-oxy-bg">
          <img src={`${IMG}/hero-bg.avif`} alt="" />
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
      </div>

      {/* Carousel lives outside hero-oxy so no ancestor clips 3D */}
      <div className="hero-carousel-wrapper">
        <HeroCarousel slots={heroCarouselSlots} />
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Partner Logos                                                       */
/* ------------------------------------------------------------------ */
const ALL_LOGOS = [
  'strava', 'piab', 'robinhood', 'asics', 'polestar', 'voi', 'brex',
  'apollo.io', 'b-lab-europe', 'veoneer', 'merck', 'ahlsell',
  'electrolux', 'swile', 'truecaller', 'kearney', 'foodora', 'hinge',
]

function PartnerLogos() {
  const initialLogos = ALL_LOGOS.slice(0, 7)
  const [visibleLogos, setVisibleLogos] = useState<string[]>(initialLogos)
  const [hiddenSlot, setHiddenSlot] = useState<number | null>(null)
  const availablePoolRef = useRef<string[]>([...ALL_LOGOS.slice(7)])

  const swapLogo = useCallback(() => {
    const slotIndex = Math.floor(Math.random() * visibleLogos.length)
    setHiddenSlot(slotIndex)
    setTimeout(() => {
      setVisibleLogos((prev) => {
        const next = [...prev]
        const currentLogo = next[slotIndex]
        if (availablePoolRef.current.length === 0) {
          availablePoolRef.current = [...ALL_LOGOS.slice(7)]
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
  }, [visibleLogos.length])

  useEffect(() => {
    const interval = setInterval(swapLogo, 2000)
    return () => clearInterval(interval)
  }, [swapLogo])

  return (
    <div className="partners">
      <div className="columns">
        <div className="gc">
          <div className="partner-logo-grid" id="partner-grid">
            {visibleLogos.map((logo, index) => (
              <div className={`slot${hiddenSlot === index ? ' hidden' : ''}`} key={index}>
                <div className="logo" data-logo={logo}>
                  <img
                    src={`${IMG}/${logo}.svg`}
                    alt={logo.charAt(0).toUpperCase() + logo.slice(1)}
                    width={224}
                    height={90}
                    decoding="async"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  All-in-One Section                                                 */
/* ------------------------------------------------------------------ */
function AllInOneSection() {
  return (
    <section>
      <div className="columns">
        <div className="gc text-c flow">
          <h2>
            Your all-in-one<br className="hide-small" />
            AI platform for real work
          </h2>
          <p style={{ maxWidth: '44rem' }}>A seamless, beautiful way to bring AI into your company&apos;s apps, knowledge, and culture.</p>
          <a href="#book-intro" className="btn bg-black white">Book an intro</a>
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
    id: 'automate',
    label: 'Automate',
    heading: 'Run complex,<br>multi-step processes.',
    thumb: `${IMG}/video-thumb-automate.webp`,
  },
  {
    id: 'create',
    label: 'Create',
    heading: 'Generate collaborative<br>content in any format',
    thumb: `${IMG}/video-thumb-create.webp`,
  },
  {
    id: 'analyze',
    label: 'Analyze',
    heading: 'Turn data into live<br>dashboards and reports',
    thumb: `${IMG}/video-thumb-analyze.webp`,
  },
  {
    id: 'act',
    label: 'Act',
    heading: 'Take instant actions<br>across your tools',
    thumb: `${IMG}/video-thumb-act.webp`,
  },
  {
    id: 'find',
    label: 'Find',
    heading: 'All the latest company<br>docs and data',
    thumb: `${IMG}/agents_carousel_search.webp`,
  },
]

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
    <section className="no-padding">
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
        <div className="agents-features-content white">
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
                <path d="M0.895149 12C0.594679 12 0.369327 11.9157 0.219092 11.7471C0.0730308 11.5785 0 11.3255 0 10.9883V1.00468C0 0.672131 0.0751174 0.421546 0.225352 0.252927C0.375587 0.0843091 0.598852 0 0.895149 0H2.3662C2.65832 0 2.8795 0.0819672 3.02973 0.245902C3.18414 0.409836 3.26135 0.662763 3.26135 1.00468V10.9883C3.26135 11.3255 3.18414 11.5785 3.02973 11.7471C2.8795 11.9157 2.65832 12 2.3662 12H0.895149ZM5.64006 12C5.33959 12 5.11424 11.9157 4.96401 11.7471C4.81377 11.5785 4.73865 11.3255 4.73865 10.9883V1.00468C4.73865 0.672131 4.81377 0.421546 4.96401 0.252927C5.11424 0.0843091 5.33959 0 5.64006 0H7.09859C7.39906 0 7.62441 0.0819672 7.77465 0.245902C7.92488 0.409836 8 0.662763 8 1.00468V10.9883C8 11.3255 7.92488 11.5785 7.77465 11.7471C7.62441 11.9157 7.39906 12 7.09859 12H5.64006Z" fill="#0A0A0A"/>
              </svg>
              <svg width="10" height="11" className="play" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 9.96835V1.03165C0 0.681435 0.0904393 0.421941 0.271318 0.253165C0.452196 0.0843882 0.667528 0 0.917313 0C1.14126 0 1.3652 0.0611814 1.58915 0.183544L9.21835 4.55063C9.49397 4.70675 9.69208 4.85443 9.81266 4.99367C9.93755 5.13291 10 5.30169 10 5.5C10 5.69409 9.93755 5.86287 9.81266 6.00633C9.69208 6.14557 9.49397 6.29325 9.21835 6.44937L1.58915 10.8165C1.3652 10.9388 1.14126 11 0.917313 11C0.667528 11 0.452196 10.9135 0.271318 10.7405C0.0904393 10.5717 0 10.3143 0 9.96835Z" fill="#0A0A0A"/>
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
                      <img src={t.thumb} alt={t.label} />
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
  { label: 'Fintech scale-up', value: '10 hours', desc: 'saved per week, per\u00a0employee' },
  { label: 'Global law firm', value: '62%', desc: 'prep time saved' },
  { label: 'Leading manufacturer', value: '95%', desc: 'faster product answers' },
  { label: 'Mining manufacturer', value: '50%', desc: 'time saved in R&D' },
  { label: 'Renewable energy company', value: '66%', desc: 'time saved in R&D' },
  { label: 'Industrial leader', value: '2\u00d7', desc: 'more customer service issues resolved' },
]

function StatsAndTestimonialsSection() {
  return (
    <section>
      <div className="columns">
        <div className="gc gc-12 margin-s">
          <div className="roi-stats">
            {STATS.map((s) => (
              <div key={s.label} className="roi-stat">
                <div className="top">
                  <p className="type-small"><strong>{s.label}</strong></p>
                </div>
                <div className="bottom">
                  <p className="h2">{s.value}</p>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="gc gc-12">
          <div className="image-card-slider">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="slide">
                <div className={`image-card${t.light ? ' white' : ''}`}>
                  <div className="top">
                    <p>&ldquo;{t.quote}&rdquo;</p>
                  </div>
                  <div className="bottom">
                    <p className="small">
                      <span className="fade">{t.role}</span><br />
                      {t.company}
                    </p>
                  </div>
                  <div className="bg">
                    <img src={t.bg} alt="" />
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
/*  Testimonials Data                                                  */
/* ------------------------------------------------------------------ */
const TESTIMONIALS = [
  {
    quote: 'All of a sudden, a valuation memo that our CFO previously spent almost a\u00a0week preparing was completed within three or four hours.',
    role: 'Chief Sustainability Officer',
    company: 'Leading renewable energy company',
    bg: `${IMG}/agents-quote-bg-01.webp`,
    light: true,
  },
  {
    quote: 'If we removed Oxy Agents, there would be a revolt.',
    role: 'Managing Director',
    company: 'Global private equity firm',
    bg: `${IMG}/agents-quote-bg-02.webp`,
    light: false,
  },
  {
    quote: 'With Oxy, our sales prep is now 10x quicker. Instead of spending hours gathering data manually, our team can instantly access the research insights they need\u2014freeing them to focus on designing more meaningful, strategic client conversations.',
    role: 'Product Operations Lead',
    company: 'International research and analytics firm',
    bg: `${IMG}/agents-quote-bg-03.webp`,
    light: true,
  },
  {
    quote: 'We\u2019re leveraging our AI agents to find and compare product information, build sales arguments, support R&D, and much more. We see real operational efficiency, and Oxy has already provided us with a quick payback.',
    role: 'CEO',
    company: 'Global industrial automation company',
    bg: `${IMG}/agents-quote-bg-04.webp`,
    light: true,
  },
  {
    quote: 'Oxy gives us control over the AI, allowing us to choose the material it accesses and tailor its parameters to our specific needs.',
    role: 'Executive Vice President',
    company: 'Global medical technology provider',
    bg: `${IMG}/agents-quote-bg-05.webp`,
    light: true,
  },
  {
    quote: 'With Oxy Agents, even colleagues who aren\u2019t tech-savvy can leverage AI in their everyday work. It\u2019s empowered everyone, not just the experts.',
    role: 'Head of Digitalization',
    company: 'Major real estate group',
    bg: `${IMG}/agents-quote-bg-06.webp`,
    light: true,
  },
  {
    quote: 'With Oxy, we\u2019re creating assistants to accelerate everything from deal analysis to portfolio reviews, transforming the way our investment teams operate.',
    role: 'Chief Digital Officer',
    company: 'Leading private equity firm',
    bg: `${IMG}/agents-quote-bg-07.webp`,
    light: true,
  },
  {
    quote: 'Asking Oxy in Slack for someone\u2019s actions from the last meeting, or our definition of retention\u2014it\u2019s a game-changer.',
    role: 'CTO',
    company: 'Leading mobility startup',
    bg: `${IMG}/agents-quote-bg-08.webp`,
    light: true,
  },
]

/* ------------------------------------------------------------------ */
/*  Model Agnostic                                                     */
/* ------------------------------------------------------------------ */
function ModelAgnosticSection() {
  return (
    <section className="reduced-padding">
      <div className="columns">
        <div className="gc">
          <div className="model-agnostic-wrap">
            <div className="columns model-agnostic-content">
              <div className="gc gc-6 model-agnostic-image">
                <img src={`${IMG}/model-agnostic-popover.svg`} alt="Model selector" />
              </div>
              <div className="gc gc-4 model-agnostic-text hide-small" style={{ '--start': 8 } as React.CSSProperties}>
                <p className="eyebrow"><strong>Model agnostic</strong></p>
                <p className="h3" style={{ maxWidth: '42rem' }}>
                  Only use the AI models that work best for you. With Oxy, you can choose and switch between leading models as you need.
                </p>
              </div>
            </div>
            <div className="bg">
              <img src={`${IMG}/agents-model-agnostic.webp`} alt="Model agnostic" />
            </div>
          </div>
          <div className="text-content show-small" style={{ paddingInline: '1.2rem' }}>
            <p className="eyebrow"><strong>Model agnostic</strong></p>
            <p className="h3" style={{ maxWidth: '42rem' }}>
              Only use the AI models that work best for you. With Oxy, you can choose and switch between leading models as you need.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Teams Tabs (Side by Side)                                          */
/* ------------------------------------------------------------------ */
const TEAM_TABS = [
  {
    id: 'sales-teams',
    label: 'Sales teams',
    desc: 'Optimize every stage of the deal lifecycle with AI that helps you prep for calls, answers your RFPs, and updates your CRM.',
    thumb: `${IMG}/video-thumb-sales-teams.webp`,
    prompts: ['Create a proposal doc with Acme and share with Julie Hoefler', 'Summarize the BANCT criteria for today\'s Acme call', 'Put your answers to the Acme RFP into a table'],
  },
  {
    id: 'customer-support',
    label: 'Customer support',
    desc: 'Increase customer satisfaction at scale with AI that assigns tickets, answers product questions, and analyzes all your support calls.',
    thumb: `${IMG}/video-thumb-customer-support.webp`,
    prompts: ['What are some similar products? Add a comparison table', 'How do I explain today\'s authentication errors more simply', 'Give me feedback on yesterday\'s support call with Acme'],
  },
  {
    id: 'in-house-ops',
    label: 'In-house operations',
    desc: 'Drive efficiency with AI that answers company FAQs, drafts contracts, and automates manual reporting.',
    thumb: `${IMG}/video-thumb-in-house-ops.webp`,
    prompts: ['Outline the Q3 board deck based on Q2 actuals', 'Analyze the latest 20 interviews for unconscious bias', 'Flag any missing terms in the draft contract for Acme'],
  },
  {
    id: 'financial-services',
    label: 'Financial services',
    desc: 'AI that augments everything from deal prospecting and due diligence to performance reports and investor comms.',
    thumb: `${IMG}/video-thumb-financial-services.webp`,
    prompts: ['Complete the Acme DDQ based on the latest data in SAP', 'Summarize Acme\'s consolidated statement of operations', 'Generate the Q4 investor memo in line with our template'],
  },
  {
    id: 'industrial-companies',
    label: 'Industrial companies',
    desc: 'Accelerate everything from RFP processes to support times with AI that understands your complex product data.',
    thumb: `${IMG}/video-thumb-industrial-companies.webp`,
    prompts: ['Give me all spare parts for product PF6000', 'What battery should our latest power-resist device have', 'How do we fix the problem on this customer\'s locking kit'],
  },
  {
    id: 'law-firms',
    label: 'Law firms',
    desc: 'AI that analyzes case outcomes, highlights liabilities, drafts contracts, and more to increase efficiency.',
    thumb: `${IMG}/video-thumb-law-firms.webp`,
    prompts: ['Create a table based on the acme-term-sheet.pdf', 'Flag any missing terms in the contract for Acme Inc.', 'Find me all relevant docs for today\'s dispute meeting'],
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
    <section className="reduced-padding">
      <div className="columns side-by-side-tabs">
        <div className="gc gc-6">
          <div className="tabs tabs-fade">
            {TEAM_TABS.map((t) => (
              <div key={t.id} className={`tab${t.id === activeId ? ' active' : ''}`} data-tab={t.id}>
                <div className="media-with-prompt">
                  <div className="media rounded-l" style={{ aspectRatio: '181 / 145' }}>
                    <img src={t.thumb} alt={t.label} />
                  </div>
                  <div className="prompt-overlay">
                    <div className="prompt-box-bg" />
                    <div className="prompt-box-blur" />
                    <div className="typewrite white">
                      {t.id === activeId && <TypewriterText texts={t.prompts} resetKey={resetKey} />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="gc gc-5" style={{ '--start': 8 } as React.CSSProperties}>
          <div className="top">
            <p className="red margin-s"><strong>Every team gets smarter with Oxy</strong></p>
            <div className="tabs-nav no-default teams-tabs-nav">
              {TEAM_TABS.map((t) => (
                <a
                  key={t.id}
                  className={`h3${t.id === activeId ? ' active' : ''}`}
                  data-tab={t.id}
                  onClick={() => handleTabClick(t.id)}
                >
                  <span>&rarr;</span> {t.label}
                </a>
              ))}
            </div>
          </div>
          <div className="bottom flow">
            <div className="tabs">
              {TEAM_TABS.map((t) => (
                <div key={t.id} className={`tab${t.id === activeId ? ' active' : ''}`} data-tab={t.id}>
                  <p className="fade-8" style={{ maxWidth: '49rem' }}>{t.desc}</p>
                </div>
              ))}
            </div>
            <a href="#book-intro" className="btn bg-black white">Book an intro</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Enterprise Partnership Services                                    */
/* ------------------------------------------------------------------ */
const PARTNERSHIP_ITEMS = [
  'Dedicated deployment lead',
  'Complete implementation support',
  'Tailored onboarding',
  'Priority support',
  'AI strategy and consulting',
  'Change management model',
  'Community, events, and resources',
]

{/* tick-filled-white from SVG icon */}
function TickFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor">
      <path d="M32 16c0 8.837-7.163 16-16 16s-16-7.163-16-16c0-8.837 7.163-16 16-16s16 7.163 16 16z" />
      <path fill="#fff" d="M14.386 22.634c0.507 0 0.938-0.235 1.245-0.69l7.024-10.553c0.184-0.294 0.369-0.616 0.369-0.939 0-0.66-0.615-1.086-1.245-1.086-0.399 0-0.784 0.235-1.076 0.661l-6.379 9.775-3.028-3.743c-0.369-0.47-0.707-0.587-1.122-0.587-0.676 0-1.199 0.514-1.199 1.159 0 0.323 0.138 0.631 0.354 0.91l3.75 4.403c0.384 0.484 0.799 0.69 1.306 0.69z" />
    </svg>
  )
}

{/* tick (check-badge) from SVG icon */}
function TickIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'inline-icon'} viewBox="0 0 32 32" fill="currentColor">
      <path d="M7.732 27.587c-1.196 0-2.079-0.285-2.65-0.857s-0.857-1.455-0.857-2.65v-2.892c0-0.268-0.089-0.495-0.268-0.683l-2.048-2.061c-0.848-0.839-1.272-1.66-1.272-2.463s0.424-1.629 1.272-2.476l2.048-2.061c0.178-0.187 0.268-0.411 0.268-0.669v-2.905c0-1.205 0.286-2.088 0.857-2.65 0.571-0.571 1.455-0.857 2.65-0.857h2.905c0.268 0 0.491-0.089 0.669-0.268l2.061-2.048c0.848-0.848 1.673-1.272 2.476-1.272 0.803-0.009 1.624 0.415 2.463 1.272l2.061 2.048c0.187 0.178 0.415 0.268 0.683 0.268h2.891c1.205 0 2.088 0.29 2.65 0.87 0.571 0.571 0.857 1.45 0.857 2.637v2.905c0 0.259 0.094 0.482 0.281 0.669l2.048 2.061c0.839 0.848 1.258 1.673 1.258 2.476 0.009 0.803-0.41 1.624-1.258 2.463l-2.048 2.061c-0.188 0.187-0.281 0.415-0.281 0.683v2.892c0 1.205-0.286 2.088-0.857 2.65-0.571 0.571-1.455 0.857-2.65 0.857h-2.891c-0.268 0-0.495 0.094-0.683 0.281l-2.061 2.048c-0.839 0.839-1.66 1.258-2.463 1.258-0.803 0.009-1.629-0.411-2.476-1.258l-2.061-2.048c-0.178-0.187-0.402-0.281-0.669-0.281h-2.905zM14.345 22.514c0.232 0 0.442-0.054 0.629-0.161s0.352-0.268 0.495-0.482l6.292-9.919c0.080-0.134 0.156-0.277 0.228-0.428s0.107-0.303 0.107-0.455c0-0.312-0.116-0.558-0.348-0.736-0.232-0.187-0.491-0.281-0.776-0.281-0.393 0-0.714 0.205-0.964 0.616l-5.716 9.183-2.717-3.507c-0.17-0.223-0.335-0.375-0.495-0.455-0.152-0.080-0.326-0.12-0.522-0.12-0.303 0-0.558 0.112-0.763 0.335-0.205 0.214-0.308 0.473-0.308 0.776 0 0.152 0.027 0.303 0.080 0.455 0.062 0.143 0.143 0.281 0.241 0.415l3.36 4.123c0.178 0.232 0.361 0.397 0.549 0.495s0.397 0.147 0.629 0.147z" />
    </svg>
  )
}

function PartnershipSection() {
  return (
    <section>
      <div className="columns margin-m">
        <div className="gc gc-12 text-c">
          <p className="eyebrow blue"><strong>Enterprise partnership services</strong></p>
          <h2 className="margin-s">Driving AI adoption together</h2>
          <p className="fade-8" style={{ maxWidth: '50rem' }}>AI is revolutionizing work in real time. Our partnership-led approach helps your organization become truly AI-first.</p>
        </div>
      </div>
      <div className="columns">
        <div className="gc gc-6">
          <div className="media autofit-height landscape rounded-l">
            <img src={`${IMG}/agents-partnerships.webp`} alt="Agents partnerships" style={{ objectPosition: '50% 30%' }} />
          </div>
        </div>
        <div className="gc gc-6">
          <div className="partnership-services">
            {PARTNERSHIP_ITEMS.map((item) => (
              <div key={item} className="partnership-service">
                <TickFilledIcon className="inline-icon fade-4" />
                {item}
              </div>
            ))}
            <a href="#book-intro" className="bg-black white partnership-service">Book an intro</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Integrations & Security                                            */
/* ------------------------------------------------------------------ */
const INTEGRATIONS = [
  { name: 'Google Meet', icon: 'google-meet.svg' },
  { name: 'Google Drive', icon: 'google-drive.svg' },
  { name: 'Google Calendar', icon: 'google-calendar.svg' },
  { name: 'Dropbox', icon: 'dropbox.svg' },
  { name: 'Confluence', icon: 'confluence.svg' },
  { name: 'Jira', icon: 'jira.svg' },
  { name: 'Service Now', icon: 'servicenow.svg' },
  { name: 'Salesforce', icon: 'salesforce.svg' },
  { name: 'Microsoft Teams', icon: 'teams.svg' },
  { name: 'Microsoft Sharepoint', icon: 'sharepoint.svg' },
  { name: 'Workday', icon: 'workday.svg' },
  { name: 'Slack', icon: 'slack.svg' },
]

const SECURITY_ITEMS = [
  { name: 'Custom user roles', icon: 'agents-security-icons-01.svg', size: 16 },
  { name: 'Encryption', icon: 'agents-security-icons-02.svg', size: 16 },
  { name: 'Flexible groups', icon: 'agents-security-icons-03.svg', size: 16 },
  { name: 'User provisioning', icon: 'agents-security-icons-04.svg', size: 16 },
  { name: 'SOC 2 Type 2', icon: 'agents-security-icons-05.svg', size: 20 },
  { name: 'GDPR compliant', icon: 'agents-security-icons-06.svg', size: 25 },
  { name: 'ISO 27001', icon: 'agents-security-icons-07.svg', size: 23 },
  { name: 'SAML single sign-on', icon: 'agents-security-icons-08.svg', size: 16 },
  { name: 'Advanced permissions', icon: 'agents-security-icons-09.svg', size: 16 },
  { name: 'Domain verification', icon: 'agents-security-icons-10.svg', size: 16 },
  { name: 'Regional deploys', icon: 'agents-security-icons-11.svg', size: 16 },
  { name: 'Audit logging', icon: 'agents-security-icons-12.svg', size: 16 },
]

function IntegrationsSecuritySection() {
  return (
    <section>
      <div className="columns margin-m">
        <div className="gc gc-12 text-c">
          <h2 className="margin-s" style={{ maxWidth: '50rem' }}>Enterprise-grade integrations and security</h2>
          <p className="fade-8" style={{ maxWidth: '35rem' }}>Oxy connects with 100+ applications and unifies your company's data securely.</p>
        </div>
      </div>
      <div className="columns">
        <div className="gc gc-12">
          <div className="integrations-card-wrapper">
            <div className="columns">
              <div className="gc gc-4"><p><strong>Connect your daily tools automatically</strong></p></div>
              <div className="gc gc-7">
                <div className="integrations-list type-small">
                  {INTEGRATIONS.map((item) => (
                    <div key={item.name} className="integrations-list-item">
                      <div className="integrations-list-item-icon">
                        <img src={`${IMG}/${item.icon}`} width={20} height={20} alt={`${item.name} icon`} />
                      </div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <a className="btn" style={{ background: 'rgba(0,0,0,0.05)' }} href="#integrations">See full integrations list</a>
          </div>
          <div className="integrations-card-wrapper">
            <div className="columns">
              <div className="gc gc-4"><p><strong>Security you can stand by</strong></p></div>
              <div className="gc gc-7">
                <div className="integrations-list type-small">
                  {SECURITY_ITEMS.map((item) => (
                    <div key={item.name} className="integrations-list-item">
                      <div className="integrations-list-item-icon">
                        <img src={`${IMG}/${item.icon}`} width={item.size} height={item.size} alt="security icon" />
                      </div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <a className="btn" style={{ background: 'rgba(0,0,0,0.05)' }} href="#security">Read more about privacy</a>
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
    <div className="media banner margin-s">
      <img src={`${IMG}/agents-banner-01.webp`} alt="Agents banner" style={{ objectPosition: '40% 50%' }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  iOS App                                                            */
/* ------------------------------------------------------------------ */
function IOSAppSection() {
  return (
    <section>
      <div className="columns margin-m">
        <div className="gc gc-12 text-c">
          <p className="eyebrow blue"><strong>Agents iOS app</strong></p>
          <h2 className="margin-s">A polymath in your pocket</h2>
        </div>
      </div>
      <div className="columns">
        <div className="gc gc-8 text-c" style={{ '--start': 3 } as React.CSSProperties}>
          <div className="media natural margin-s">
            <img src={`${IMG}/agents-ios-app.webp`} alt="Agents iOS app" />
          </div>
          <p className="type-small margin-s" style={{ maxWidth: '53rem' }}>
            <span className="fade">Connect all your work apps to get instant answers to anything and solve hours of complex tasks in seconds. Missed a meeting? No problem. The recap is just a tap away. Built on any LLM you want.</span> Now available on iOS.
          </p>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <svg width="144" height="48" viewBox="0 0 144 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_appstore)">
                <path d="M11.4414 0.600586H132.595L133.459 0.602539C133.821 0.604857 134.192 0.611296 134.56 0.617188H134.562C135.335 0.625791 136.106 0.693368 136.868 0.820312V0.821289C137.604 0.946475 138.317 1.17951 138.984 1.51465V1.51562C140.233 2.15679 141.263 3.15013 141.95 4.36914L142.083 4.61621C142.416 5.27974 142.647 5.98987 142.768 6.72266L142.769 6.72559C142.897 7.48906 142.968 8.26106 142.982 9.03516V9.03613C142.987 9.39958 142.987 9.76527 142.987 10.1338V10.1465C142.996 10.5736 142.997 11.0029 142.997 11.4434V36.5576C142.997 37.0017 142.996 37.429 142.987 37.8574V37.8701C142.987 38.2431 142.987 38.6006 142.982 38.9688C142.968 39.7432 142.897 40.5155 142.769 41.2793L142.768 41.2822C142.647 42.0171 142.416 42.7295 142.081 43.3945C141.742 44.0528 141.302 44.654 140.776 45.1758L140.773 45.1787C140.317 45.6394 139.798 46.0335 139.232 46.3496L138.987 46.4805C138.32 46.8171 137.607 47.0531 136.871 47.1807C136.108 47.3069 135.335 47.3751 134.562 47.3848H134.556C134.194 47.3928 133.823 47.3975 133.463 47.3975H133.459C133.03 47.3998 132.593 47.4004 132.162 47.4004H11.4414C11.0012 47.4004 10.5677 47.3998 10.1309 47.3975H10.1279C9.76567 47.3975 9.40538 47.3928 9.03809 47.3848H9.0332C8.25741 47.3745 7.48337 47.3064 6.71777 47.1807C5.98468 47.0541 5.27449 46.8186 4.61133 46.4814L4.61035 46.4805C3.94879 46.1451 3.34548 45.7054 2.82324 45.1787L2.81836 45.1738C2.2919 44.6544 1.85276 44.0533 1.51855 43.3936V43.3926C1.18124 42.7283 0.94718 42.0162 0.825195 41.2812V41.2793L0.739258 40.7051C0.689903 40.3215 0.65627 39.9361 0.636719 39.5498L0.618164 38.9697V38.959L0.599609 37.8613V10.1426C0.605641 9.7642 0.607202 9.40927 0.618164 9.04688V9.03516C0.627348 8.2611 0.696751 7.48897 0.825195 6.72559V6.72461C0.947519 5.98978 1.18144 5.27758 1.51855 4.61328V4.6123C1.85322 3.94969 2.29239 3.34513 2.81934 2.82227L2.82129 2.82129C3.3463 2.29614 3.95047 1.85621 4.61133 1.51758C5.27464 1.18123 5.98458 0.94585 6.71777 0.821289L6.71875 0.822266C7.48363 0.69558 8.25698 0.627289 9.03223 0.618164H9.03516C9.40856 0.612256 9.76829 0.604914 10.1318 0.602539L10.1309 0.601562C10.5678 0.599173 11.0012 0.600586 11.4414 0.600586Z" stroke="#0A0A0A" strokeWidth="1.2" />
                <path d="M29.7206 24.3618C29.7335 23.3602 29.9996 22.3781 30.494 21.507C30.9885 20.6358 31.6952 19.9039 32.5485 19.3793C32.0064 18.6051 31.2913 17.968 30.4599 17.5185C29.6285 17.069 28.7038 16.8196 27.7591 16.7901C25.744 16.5786 23.7905 17.9959 22.7636 17.9959C21.7169 17.9959 20.1359 16.8111 18.4334 16.8461C17.3322 16.8817 16.259 17.2019 15.3184 17.7756C14.3777 18.3492 13.6017 19.1568 13.0659 20.1195C10.7451 24.1376 12.4762 30.0429 14.6994 33.2908C15.8117 34.8813 17.1116 36.6578 18.8125 36.5948C20.477 36.5258 21.0987 35.5334 23.1078 35.5334C25.0983 35.5334 25.6816 36.5948 27.417 36.5547C29.2031 36.5258 30.3284 34.9573 31.4016 33.3518C32.2008 32.2185 32.8158 30.9661 33.2237 29.6408C32.1861 29.2019 31.3006 28.4673 30.6776 27.5285C30.0547 26.5898 29.7219 25.4884 29.7206 24.3618Z" fill="#0A0A0A" />
                <path d="M26.4427 14.6526C27.4166 13.4836 27.8963 11.9809 27.7802 10.4639C26.2924 10.6201 24.9181 11.3312 23.9311 12.4554C23.4485 13.0046 23.0789 13.6435 22.8434 14.3356C22.6079 15.0278 22.5111 15.7595 22.5586 16.4891C23.3028 16.4967 24.039 16.3354 24.7118 16.0173C25.3846 15.6992 25.9764 15.2326 26.4427 14.6526Z" fill="#0A0A0A" />
                <path d="M50.7596 32.5662H45.0795L43.7154 36.594H41.3096L46.6897 21.6924H49.1893L54.5693 36.594H52.1224L50.7596 32.5662ZM45.6678 30.7076H50.1702L47.9506 24.1709H47.8885L45.6678 30.7076Z" fill="#0A0A0A" />
                <path d="M66.1881 31.1598C66.1881 34.536 64.3811 36.7051 61.6541 36.7051C60.9634 36.7413 60.2764 36.5821 59.6718 36.246C59.0672 35.9098 58.5696 35.4102 58.2358 34.8043H58.1842V40.1856H55.9541V25.727H58.1127V27.534H58.1537C58.5029 26.9311 59.009 26.4341 59.6181 26.0958C60.2273 25.7576 60.9167 25.5909 61.6131 25.6133C64.3705 25.6133 66.1881 27.793 66.1881 31.1598ZM63.8959 31.1598C63.8959 28.9602 62.7592 27.5141 61.0248 27.5141C59.3209 27.5141 58.1748 28.9907 58.1748 31.1598C58.1748 33.3489 59.3209 34.8149 61.0248 34.8149C62.7592 34.8149 63.8959 33.3794 63.8959 31.1598Z" fill="#0A0A0A" />
                <path d="M78.1451 31.1598C78.1451 34.536 76.3381 36.7051 73.6112 36.7051C72.9204 36.7413 72.2334 36.5821 71.6288 36.246C71.0243 35.9098 70.5266 35.4102 70.1928 34.8043H70.1412V40.1856H67.9111V25.727H70.0697V27.534H70.1107C70.4599 26.9311 70.966 26.434 71.5751 26.0958C72.1843 25.7576 72.8737 25.5909 73.5701 25.6133C76.3276 25.6133 78.1451 27.793 78.1451 31.1598ZM75.853 31.1598C75.853 28.9602 74.7162 27.5141 72.9819 27.5141C71.278 27.5141 70.1319 28.9907 70.1319 31.1598C70.1319 33.3489 71.278 34.8149 72.9819 34.8149C74.7162 34.8149 75.853 33.3793 75.853 31.1598Z" fill="#0A0A0A" />
                <path d="M86.0495 32.4415C86.2147 33.9192 87.6503 34.8895 89.612 34.8895C91.4916 34.8895 92.844 33.9192 92.844 32.5867C92.844 31.4301 92.0284 30.7375 90.0971 30.2629L88.1659 29.7977C85.4295 29.1367 84.1592 27.857 84.1592 25.7805C84.1592 23.2094 86.3998 21.4434 89.5815 21.4434C92.7303 21.4434 94.8889 23.2094 94.9616 25.7805H92.7104C92.5756 24.2934 91.3463 23.3957 89.5498 23.3957C87.7533 23.3957 86.524 24.3039 86.524 25.6258C86.524 26.6793 87.3092 27.2992 89.2299 27.7738L90.8717 28.1769C93.9291 28.9 95.1994 30.1281 95.1994 32.3078C95.1994 35.0957 92.9787 36.8418 89.4467 36.8418C86.142 36.8418 83.9107 35.1367 83.7666 32.4414L86.0495 32.4415Z" fill="#0A0A0A" />
                <path d="M100.012 23.1592V25.7303H102.078V27.4963H100.012V33.4857C100.012 34.4162 100.425 34.8498 101.334 34.8498C101.579 34.8455 101.824 34.8283 102.067 34.7982V36.5537C101.659 36.63 101.244 36.6645 100.829 36.6568C98.6289 36.6568 97.7711 35.8306 97.7711 33.7236V27.4963H96.1914V25.7303H97.7711V23.1592H100.012Z" fill="#0A0A0A" />
                <path d="M103.274 31.1611C103.274 27.7428 105.288 25.5947 108.427 25.5947C111.577 25.5947 113.581 27.7427 113.581 31.1611C113.581 34.5889 111.588 36.7275 108.427 36.7275C105.268 36.7275 103.274 34.5889 103.274 31.1611ZM111.309 31.1611C111.309 28.8162 110.234 27.4322 108.427 27.4322C106.62 27.4322 105.547 28.8268 105.547 31.1611C105.547 33.5154 106.62 34.8889 108.427 34.8889C110.234 34.8889 111.309 33.5154 111.309 31.1611Z" fill="#0A0A0A" />
                <path d="M115.419 25.7269H117.546V27.5761H117.598C117.741 26.9986 118.08 26.4882 118.556 26.1307C119.032 25.7732 119.616 25.5905 120.211 25.6132C120.468 25.6123 120.724 25.6402 120.975 25.6964V27.7824C120.65 27.6832 120.312 27.6377 119.973 27.6476C119.649 27.6345 119.326 27.6916 119.026 27.815C118.726 27.9385 118.457 28.1254 118.236 28.3629C118.015 28.6003 117.848 28.8828 117.747 29.1908C117.646 29.4988 117.612 29.825 117.649 30.1472V36.5913H115.419V25.7269Z" fill="#0A0A0A" />
                <path d="M131.258 33.4018C130.958 35.374 129.038 36.7275 126.58 36.7275C123.42 36.7275 121.458 34.61 121.458 31.2127C121.458 27.8049 123.43 25.5947 126.487 25.5947C129.492 25.5947 131.383 27.6596 131.383 30.9537V31.7178H123.709V31.8525C123.674 32.2524 123.724 32.6552 123.856 33.0342C123.988 33.4132 124.2 33.7597 124.476 34.0508C124.752 34.3418 125.088 34.5708 125.459 34.7223C125.831 34.8739 126.231 34.9446 126.632 34.9299C127.159 34.9793 127.688 34.8572 128.14 34.5819C128.592 34.3065 128.943 33.8926 129.141 33.4017L131.258 33.4018ZM123.72 30.1592H129.151C129.171 29.7997 129.117 29.4399 128.991 29.1024C128.866 28.765 128.672 28.4571 128.421 28.1982C128.171 27.9393 127.87 27.7349 127.537 27.5978C127.204 27.4608 126.847 27.394 126.487 27.4018C126.123 27.3996 125.763 27.4694 125.427 27.6071C125.091 27.7447 124.786 27.9476 124.529 28.204C124.271 28.4603 124.067 28.7651 123.929 29.1007C123.79 29.4363 123.719 29.796 123.72 30.1592Z" fill="#0A0A0A" />
                <path d="M45.391 10.4779C45.8585 10.4443 46.3277 10.5149 46.7646 10.6847C47.2016 10.8544 47.5954 11.1189 47.9177 11.4593C48.24 11.7996 48.4827 12.2073 48.6284 12.6528C48.7741 13.0983 48.8191 13.5706 48.7602 14.0357C48.7602 16.3232 47.5238 17.6381 45.391 17.6381H42.8047V10.4779H45.391ZM43.9168 16.6255H45.2668C45.6009 16.6454 45.9352 16.5906 46.2455 16.4651C46.5557 16.3396 46.8341 16.1464 47.0602 15.8998C47.2864 15.6531 47.4548 15.3591 47.553 15.0391C47.6512 14.7192 47.6769 14.3814 47.6281 14.0503C47.6734 13.7205 47.6451 13.3847 47.5454 13.0671C47.4456 12.7495 47.2769 12.4579 47.0512 12.2132C46.8255 11.9685 46.5485 11.7767 46.24 11.6516C45.9315 11.5266 45.5992 11.4713 45.2668 11.4897H43.9168V16.6255Z" fill="#0A0A0A" />
                <path d="M50.0169 14.9326C49.983 14.5775 50.0236 14.2192 50.1362 13.8807C50.2488 13.5422 50.4309 13.231 50.6708 12.967C50.9108 12.703 51.2032 12.4921 51.5295 12.3478C51.8557 12.2035 52.2085 12.1289 52.5652 12.1289C52.9219 12.1289 53.2747 12.2035 53.6009 12.3478C53.9271 12.4921 54.2196 12.703 54.4595 12.967C54.6994 13.231 54.8816 13.5422 54.9942 13.8807C55.1068 14.2192 55.1474 14.5775 55.1134 14.9326C55.148 15.288 55.1079 15.6468 54.9956 15.9858C54.8833 16.3249 54.7013 16.6366 54.4613 16.9011C54.2213 17.1656 53.9286 17.377 53.6021 17.5216C53.2755 17.6663 52.9223 17.741 52.5652 17.741C52.208 17.741 51.8548 17.6663 51.5283 17.5216C51.2017 17.377 50.9091 17.1656 50.6691 16.9011C50.4291 16.6366 50.2471 16.3249 50.1348 15.9858C50.0225 15.6468 49.9823 15.288 50.0169 14.9326ZM54.0165 14.9326C54.0165 13.7613 53.4904 13.0763 52.5669 13.0763C51.64 13.0763 51.1185 13.7613 51.1185 14.9326C51.1185 16.1132 51.64 16.7929 52.5669 16.7929C53.4904 16.7929 54.0166 16.1085 54.0166 14.9326Z" fill="#0A0A0A" />
                <path d="M61.8885 17.6398H60.7822L59.6654 13.6602H59.5811L58.469 17.6398H57.3732L55.8838 12.2363H56.9654L57.9334 16.3595H58.0131L59.124 12.2363H60.1471L61.258 16.3595H61.3424L62.3057 12.2363H63.3721L61.8885 17.6398Z" fill="#0A0A0A" />
                <path d="M64.624 12.2336H65.6506V13.092H65.7303C65.8655 12.7837 66.0935 12.5253 66.3825 12.3527C66.6716 12.1802 67.0072 12.1021 67.3428 12.1293C67.6057 12.1096 67.8697 12.1492 68.1152 12.2453C68.3607 12.3414 68.5815 12.4916 68.7611 12.6846C68.9407 12.8776 69.0746 13.1086 69.1528 13.3603C69.2311 13.6121 69.2517 13.8783 69.2131 14.1391V17.6371H68.1467V14.4069C68.1467 13.5385 67.7693 13.1067 66.9807 13.1067C66.8022 13.0984 66.624 13.1288 66.4583 13.1958C66.2926 13.2628 66.1434 13.3648 66.0209 13.4948C65.8983 13.6249 65.8053 13.7799 65.7483 13.9493C65.6913 14.1186 65.6715 14.2983 65.6904 14.476V17.6372H64.624V12.2336Z" fill="#0A0A0A" />
                <path d="M70.9111 10.125H71.9775V17.6379H70.9111V10.125Z" fill="#0A0A0A" />
                <path d="M73.4612 14.9327C73.4273 14.5775 73.4679 14.2192 73.5806 13.8807C73.6932 13.5422 73.8754 13.231 74.1153 12.967C74.3553 12.7031 74.6477 12.4921 74.974 12.3478C75.3002 12.2035 75.653 12.1289 76.0098 12.1289C76.3665 12.1289 76.7193 12.2035 77.0456 12.3478C77.3718 12.4921 77.6643 12.7031 77.9043 12.967C78.1442 13.231 78.3263 13.5422 78.439 13.8807C78.5516 14.2192 78.5923 14.5775 78.5583 14.9327C78.5929 15.2881 78.5527 15.6469 78.4404 15.986C78.328 16.325 78.146 16.6368 77.906 16.9012C77.666 17.1657 77.3733 17.3771 77.0467 17.5217C76.7201 17.6664 76.3669 17.7411 76.0098 17.7411C75.6526 17.7411 75.2994 17.6664 74.9729 17.5217C74.6463 17.3771 74.3536 17.1657 74.1136 16.9012C73.8736 16.6368 73.6915 16.325 73.5792 15.986C73.4668 15.6469 73.4267 15.2881 73.4612 14.9327ZM77.4608 14.9327C77.4608 13.7614 76.9347 13.0764 76.0112 13.0764C75.0843 13.0764 74.5628 13.7614 74.5628 14.9327C74.5628 16.1133 75.0843 16.793 76.0112 16.793C76.9347 16.793 77.4609 16.1086 77.4609 14.9327Z" fill="#0A0A0A" />
                <path d="M79.6807 16.1086C79.6807 15.1359 80.4049 14.5752 81.6904 14.4955L83.1541 14.4111V13.9447C83.1541 13.374 82.7768 13.0518 82.0479 13.0518C81.4525 13.0518 81.04 13.2703 80.9217 13.6523H79.8893C79.9982 12.7242 80.8713 12.1289 82.0971 12.1289C83.4518 12.1289 84.2158 12.8033 84.2158 13.9447V17.6367H83.1893V16.8773H83.1049C82.9336 17.1497 82.6931 17.3718 82.408 17.5208C82.1228 17.6699 81.8032 17.7406 81.4818 17.7257C81.255 17.7493 81.0257 17.7251 80.8088 17.6547C80.5919 17.5843 80.3922 17.4691 80.2225 17.3168C80.0528 17.1644 79.9169 16.9782 79.8236 16.7701C79.7302 16.562 79.6816 16.3366 79.6807 16.1086ZM83.1541 15.6469V15.1951L81.8346 15.2795C81.0904 15.3293 80.7529 15.5824 80.7529 16.0588C80.7529 16.5451 81.1748 16.8281 81.7549 16.8281C81.9249 16.8453 82.0966 16.8282 82.2598 16.7776C82.423 16.7271 82.5744 16.6443 82.7049 16.5341C82.8355 16.4239 82.9425 16.2885 83.0197 16.1361C83.0968 15.9837 83.1426 15.8173 83.1541 15.6469Z" fill="#0A0A0A" />
                <path d="M85.6162 14.9338C85.6162 13.2264 86.494 12.1447 87.8592 12.1447C88.1969 12.1292 88.532 12.2101 88.8255 12.3779C89.1189 12.5458 89.3585 12.7937 89.5162 13.0927H89.5959V10.125H90.6623V17.6379H89.6404V16.7842H89.5561C89.3861 17.0812 89.1382 17.326 88.8391 17.4922C88.54 17.6584 88.2011 17.7395 87.8592 17.7269C86.4846 17.727 85.6162 16.6453 85.6162 14.9338ZM86.7178 14.9338C86.7178 16.0799 87.2581 16.7696 88.1616 16.7696C89.0604 16.7696 89.6159 16.07 89.6159 14.9385C89.6159 13.8123 89.0545 13.1028 88.1616 13.1028C87.2639 13.1028 86.7178 13.7971 86.7178 14.9338Z" fill="#0A0A0A" />
                <path d="M95.0755 14.9326C95.0416 14.5775 95.0822 14.2192 95.1948 13.8807C95.3074 13.5422 95.4895 13.231 95.7294 12.967C95.9694 12.703 96.2618 12.4921 96.588 12.3478C96.9143 12.2035 97.2671 12.1289 97.6238 12.1289C97.9805 12.1289 98.3333 12.2035 98.6595 12.3478C98.9857 12.4921 99.2782 12.703 99.5181 12.967C99.758 13.231 99.9401 13.5422 100.053 13.8807C100.165 14.2192 100.206 14.5775 100.172 14.9326C100.207 15.288 100.166 15.6468 100.054 15.9858C99.9419 16.3249 99.7599 16.6366 99.5199 16.9011C99.2799 17.1656 98.9872 17.377 98.6607 17.5216C98.3341 17.6663 97.9809 17.741 97.6238 17.741C97.2666 17.741 96.9134 17.6663 96.5869 17.5216C96.2603 17.377 95.9677 17.1656 95.7277 16.9011C95.4877 16.6366 95.3057 16.3249 95.1934 15.9858C95.081 15.6468 95.0409 15.288 95.0755 14.9326ZM99.0751 14.9326C99.0751 13.7613 98.549 13.0763 97.6255 13.0763C96.6986 13.0763 96.1771 13.7613 96.1771 14.9326C96.1771 16.1132 96.6986 16.7929 97.6255 16.7929C98.549 16.7929 99.0751 16.1085 99.0751 14.9326Z" fill="#0A0A0A" />
                <path d="M101.603 12.2336H102.629V13.092H102.709C102.844 12.7837 103.072 12.5253 103.361 12.3527C103.65 12.1802 103.986 12.1021 104.321 12.1293C104.584 12.1096 104.848 12.1492 105.094 12.2453C105.339 12.3414 105.56 12.4916 105.74 12.6846C105.919 12.8776 106.053 13.1086 106.131 13.3603C106.21 13.6121 106.23 13.8783 106.192 14.1391V17.6371H105.125V14.4069C105.125 13.5385 104.748 13.1067 103.959 13.1067C103.781 13.0984 103.602 13.1288 103.437 13.1958C103.271 13.2628 103.122 13.3648 102.999 13.4948C102.877 13.6249 102.784 13.7799 102.727 13.9493C102.67 14.1186 102.65 14.2983 102.669 14.476V17.6372H101.603V12.2336Z" fill="#0A0A0A" />
                <path d="M112.219 10.8906V12.2605H113.39V13.1588H112.219V15.9373C112.219 16.5033 112.453 16.7512 112.983 16.7512C113.119 16.7507 113.255 16.7425 113.39 16.7266V17.6148C113.199 17.6491 113.004 17.6673 112.81 17.6693C111.624 17.6693 111.152 17.2521 111.152 16.2103V13.1587H110.294V12.2605H111.152V10.8906H112.219Z" fill="#0A0A0A" />
                <path d="M114.845 10.125H115.902V13.1027H115.986C116.128 12.7916 116.362 12.5316 116.657 12.3584C116.952 12.1852 117.293 12.1071 117.634 12.1348C117.895 12.1205 118.157 12.1642 118.399 12.2627C118.642 12.3611 118.86 12.5119 119.038 12.7043C119.216 12.8967 119.349 13.126 119.428 13.3757C119.507 13.6255 119.53 13.8896 119.495 14.1492V17.6379H118.427V14.4123C118.427 13.5492 118.025 13.1121 117.272 13.1121C117.088 13.0971 116.904 13.1223 116.732 13.1859C116.559 13.2496 116.402 13.3502 116.273 13.4807C116.143 13.6112 116.044 13.7684 115.981 13.9413C115.919 14.1143 115.895 14.2988 115.911 14.482V17.6379H114.845V10.125Z" fill="#0A0A0A" />
                <path d="M125.712 16.1778C125.567 16.6717 125.253 17.0988 124.825 17.3846C124.397 17.6704 123.882 17.7966 123.371 17.7411C123.015 17.7505 122.661 17.6823 122.334 17.5413C122.007 17.4002 121.715 17.1897 121.477 16.9244C121.24 16.659 121.063 16.3451 120.959 16.0046C120.855 15.664 120.826 15.3048 120.875 14.952C120.827 14.5982 120.856 14.2383 120.96 13.8967C121.064 13.5551 121.24 13.2397 121.476 12.972C121.712 12.7044 122.003 12.4905 122.329 12.3451C122.655 12.1996 123.009 12.126 123.366 12.129C124.87 12.129 125.777 13.1562 125.777 14.853V15.2251H121.961V15.2849C121.944 15.4832 121.969 15.6828 122.034 15.8709C122.099 16.059 122.203 16.2314 122.338 16.3772C122.474 16.5229 122.638 16.6387 122.821 16.7172C123.004 16.7957 123.201 16.8351 123.4 16.8329C123.655 16.8635 123.914 16.8176 124.142 16.7009C124.371 16.5843 124.56 16.4022 124.686 16.1778L125.712 16.1778ZM121.961 14.4364H124.69C124.704 14.2551 124.679 14.0729 124.618 13.9016C124.557 13.7304 124.46 13.5738 124.335 13.442C124.21 13.3101 124.058 13.206 123.891 13.1362C123.723 13.0664 123.542 13.0324 123.36 13.0366C123.176 13.0343 122.993 13.0689 122.822 13.1385C122.651 13.208 122.496 13.311 122.365 13.4415C122.235 13.5719 122.132 13.7272 122.063 13.8981C121.993 14.0689 121.959 14.252 121.961 14.4364Z" fill="#0A0A0A" />
              </g>
              <defs>
                <clipPath id="clip0_appstore">
                  <rect width="143.597" height="48" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Trusted By                                                         */
/* ------------------------------------------------------------------ */
const TRUSTED_LOGOS = ['strava', 'polestar', 'merck', 'apollo.io', 'robinhood', 'amgen', 'electrolux', 'piab']

function TrustedBySection() {
  return (
    <section className="bg-sand" style={{ paddingBlockEnd: '5rem' }}>
      <div className="columns">
        <div className="gc gc-12">
          <h3 className="margin-l" style={{ maxWidth: '72rem' }}>
            Oxy is trusted by leading <br className="hide-small" />enterprises across industries
          </h3>
          <div className="static-logos" style={{ '--numLogos': 8, '--numLogosMobile': 2 } as React.CSSProperties}>
            {TRUSTED_LOGOS.map((logo) => (
              <div key={logo} className="static-logo">
                <img src={`${IMG}/${logo}.svg`} alt={logo} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Pricing                                                            */
/* ------------------------------------------------------------------ */
const PLANS = [
  {
    name: 'Enterprise',
    price: 'Custom pricing',
    cta: 'Book an intro',
    ctaHref: '/book-intro',
    features: [
      'Unlimited members per workspace and documents per integration',
      'Enterprise integrations',
      'Domain verification, SAML-based SSO, and SCIM',
      'Extended range of LLMs',
      'Analytics dashboard to measure impact',
      'Dedicated success team, priority support, and SLA',
      'API access for building your own integrations',
    ],
  },
  {
    name: 'Team',
    price: '$30 per user / month',
    cta: 'Sign up',
    ctaHref: '/',
    features: [
      'Unlimited queries and meeting recordings',
      'Up to 50 members per workspace',
      'Our most popular integrations incl. Asana, Gmail, Outlook email, Zendesk, and more.',
      'OpenAI and Claude model selection',
      'Enterprise data processing agreement',
      '10,000 documents per integration',
      'Priority in email and chat support',
    ],
  },
  {
    name: 'Free',
    price: '$0',
    cta: 'Try it free',
    ctaHref: '/',
    features: [
      '10 meetings per month \u2014 invite members for more',
      'Up to 5 members per workspace',
      'Unlimited assistants and prompt templates',
      'Meeting integrations with Calendar, Drive, Meet, Teams, and Zoom',
      'Data integrations with Confluence, Google Drive, OneDrive, Notion, and Sharepoint',
      '1,000 documents per integration',
      'Help center support',
    ],
  },
]

function PricingSection() {
  return (
    <section>
      <div className="columns">
        <div className="gc gc-12">
          <h2 className="margin-l" style={{ textAlign: 'center' }}>Pricing</h2>
          <div className="margin-xl">
            <div className="flex-cols" style={{ '--vertical': '6rem' } as React.CSSProperties}>
              {PLANS.map((plan) => (
                <div key={plan.name} className="flex-col">
                  <p className="h3" style={{ marginBottom: '1.2rem' }}>{plan.name}</p>
                  <p className="margin-s"><strong>{plan.price}</strong></p>
                  {plan.name === 'Enterprise' ? (
                    <a className="btn bg-black white" href="#book-intro">{plan.cta}</a>
                  ) : plan.name === 'Team' ? (
                    <a className="btn" style={{ background: 'rgb(0, 0, 0, 0.05)' }} href={plan.ctaHref} target="_blank" rel="noopener noreferrer">{plan.cta}</a>
                  ) : (
                    <a className="btn" style={{ backgroundColor: 'rgb(0, 0, 0, 0.05)' }} href={plan.ctaHref} target="_blank" rel="noopener noreferrer">{plan.cta}</a>
                  )}
                  <hr />
                  <ul className="checklist">
                    {plan.features.map((f, i) => (
                      <li key={i}>
                        <TickIcon />
                        {f}
                      </li>
                    ))}
                  </ul>
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
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Landing4() {
  return (
    <>
      <SEO
        title="Oxy \u2014 Build expert AI agents in minutes"
        description="One platform for creating expert AI agents grounded in your company's knowledge. No coding required. Connect all your data quickly and securely."
        canonicalPath="/"
      />
      <Navbar transparent />
      <main className="oxy-landing">
        <HeroSection />
        <PartnerLogos />
        <AllInOneSection />
        <FeaturesSection />
        <StatsAndTestimonialsSection />
        <ModelAgnosticSection />
        <TeamsSection />
        <PartnershipSection />
        <IntegrationsSecuritySection />
        <BannerSection />
        <IOSAppSection />
        <TrustedBySection />
        <PricingSection />
      </main>
      <Footer />
    </>
  )
}
