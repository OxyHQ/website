import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'

const IMG = '/images/landing'

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
const ROTATING_WORDS = ['Deep research', 'Sales prep', 'Customer support', 'Contract review', 'Data analysis']

function HeroSection() {
  const [wordIdx, setWordIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % ROTATING_WORDS.length)
        setVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center px-8 pt-32 pb-12 text-center">
        <h1 className="text-5xl leading-tight font-semibold tracking-tight text-black md:text-7xl md:leading-[1.1]">
          <span
            className={`inline-block transition-all duration-400 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
          >
            {ROTATING_WORDS[wordIdx]}
          </span>
          <br />
          done with&nbsp;AI
        </h1>
        <p className="mt-6 max-w-xl text-lg text-black/70">
          Accelerate work with AI agents that collaborate, automate, and think alongside your teams.
        </p>
        <a
          href="/book-intro"
          className="mt-8 inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/80"
        >
          Book an intro
        </a>
      </div>
      <div className="relative mx-auto max-w-7xl px-8">
        <img
          src={`${IMG}/AgentsHero.webp`}
          alt="AI Agents hero"
          className="w-full rounded-xl"
        />
      </div>
    </section>
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
  const [logos, setLogos] = useState(ALL_LOGOS.slice(0, 7))

  useEffect(() => {
    const id = setInterval(() => {
      setLogos((prev) => {
        const shown = new Set(prev)
        const pool = ALL_LOGOS.filter((l) => !shown.has(l))
        if (pool.length === 0) return prev
        const next = [...prev]
        const swapIdx = Math.floor(Math.random() * next.length)
        const newLogo = pool[Math.floor(Math.random() * pool.length)]
        next[swapIdx] = newLogo
        return next
      })
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-3 gap-8 px-8 md:grid-cols-7">
        {logos.map((logo) => (
          <div
            key={logo}
            className="flex h-16 items-center justify-center transition-opacity duration-1000 md:h-24"
          >
            <img
              src={`${IMG}/${logo}.svg`}
              alt={logo}
              className="h-auto max-h-full w-full max-w-full object-contain"
              width={224}
              height={90}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  All-in-One Section                                                 */
/* ------------------------------------------------------------------ */
function AllInOneSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-8 text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Your all-in-one<br className="hidden md:block" />
          AI platform for real work
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-black/60">
          A seamless, beautiful way to bring AI into your company's apps, knowledge, and culture.
        </p>
        <a
          href="/book-intro"
          className="mt-8 inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/80"
        >
          Book an intro
        </a>
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
    heading: 'Run complex, multi-step processes.',
    thumb: `${IMG}/video-thumb-automate.webp`,
  },
  {
    id: 'create',
    label: 'Create',
    heading: 'Generate collaborative content in any format',
    thumb: `${IMG}/video-thumb-create.webp`,
  },
  {
    id: 'analyze',
    label: 'Analyze',
    heading: 'Turn data into live dashboards and reports',
    thumb: `${IMG}/video-thumb-analyze.webp`,
  },
  {
    id: 'act',
    label: 'Act',
    heading: 'Take instant actions across your tools',
    thumb: `${IMG}/video-thumb-act.webp`,
  },
  {
    id: 'find',
    label: 'Find',
    heading: 'All the latest company docs and data',
    thumb: `${IMG}/agents_carousel_search.webp`,
  },
]

function FeaturesSection() {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const AUTO_DURATION = 6000

  const resetAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setProgress(0)
    const start = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / AUTO_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        setActive((prev) => (prev + 1) % FEATURE_TABS.length)
      }
    }, 50)
  }, [])

  useEffect(() => {
    resetAutoplay()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [active, resetAutoplay])

  const tab = FEATURE_TABS[active]

  return (
    <section className="relative overflow-hidden py-0">
      <div className="relative">
        {/* Background */}
        <img
          src={`${IMG}/agents-features-bg.webp`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <img
          src={`${IMG}/agents-features-icons.svg`}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
        />
        {/* Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-8 py-16">
          {/* Tab Nav */}
          <nav className="mb-12 flex flex-wrap items-center justify-center gap-6">
            {FEATURE_TABS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                className="group flex flex-col items-center"
              >
                <span
                  className={`text-sm font-semibold transition ${i === active ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
                >
                  {t.label}
                </span>
                <div className="mt-2 h-0.5 w-16 overflow-hidden rounded-full bg-white/20">
                  {i === active && (
                    <div
                      className="h-full rounded-full bg-white transition-none"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </div>
              </button>
            ))}
          </nav>

          {/* Active Tab Content */}
          <div className="text-center text-white">
            <h2 className="mb-8 text-3xl font-semibold md:text-5xl">{tab.heading}</h2>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-2xl">
              <img
                src={tab.thumb}
                alt={tab.label}
                className="w-full"
              />
            </div>
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

function StatsSection() {
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
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Testimonials Carousel                                              */
/* ------------------------------------------------------------------ */
const TESTIMONIALS = [
  {
    quote: 'All of a sudden, a valuation memo that our CFO previously spent almost a week preparing was completed within three or four hours.',
    role: 'Chief Sustainability Officer',
    company: 'Leading renewable energy company',
    bg: `${IMG}/agents-quote-bg-01.webp`,
    light: true,
  },
  {
    quote: 'If we removed Sana Agents, there would be a revolt.',
    role: 'Managing Director',
    company: 'Global private equity firm',
    bg: `${IMG}/agents-quote-bg-02.webp`,
    light: false,
  },
  {
    quote: 'With Sana, our sales prep is now 10x quicker. Instead of spending hours gathering data manually, our team can instantly access the research insights they need\u2014freeing them to focus on designing more meaningful, strategic client conversations.',
    role: 'Product Operations Lead',
    company: 'International research and analytics firm',
    bg: `${IMG}/agents-quote-bg-03.webp`,
    light: true,
  },
  {
    quote: 'We\u2019re leveraging our AI agents to find and compare product information, build sales arguments, support R&D, and much more. We see real operational efficiency, and Sana has already provided us with a quick payback.',
    role: 'CEO',
    company: 'Global industrial automation company',
    bg: `${IMG}/agents-quote-bg-04.webp`,
    light: true,
  },
  {
    quote: 'Sana gives us control over the AI, allowing us to choose the material it accesses and tailor its parameters to our specific needs.',
    role: 'Executive Vice President',
    company: 'Global medical technology provider',
    bg: `${IMG}/agents-quote-bg-05.webp`,
    light: true,
  },
  {
    quote: 'With Sana Agents, even colleagues who aren\u2019t tech-savvy can leverage AI in their everyday work. It\u2019s empowered everyone, not just the experts.',
    role: 'Head of Digitalization',
    company: 'Major real estate group',
    bg: `${IMG}/agents-quote-bg-06.webp`,
    light: true,
  },
  {
    quote: 'With Sana, we\u2019re creating assistants to accelerate everything from deal analysis to portfolio reviews, transforming the way our investment teams operate.',
    role: 'Chief Digital Officer',
    company: 'Leading private equity firm',
    bg: `${IMG}/agents-quote-bg-07.webp`,
    light: true,
  },
  {
    quote: 'Asking Sana in Slack for someone\u2019s actions from the last meeting, or our definition of retention\u2014it\u2019s a game-changer.',
    role: 'CTO',
    company: 'Leading mobility startup',
    bg: `${IMG}/agents-quote-bg-08.webp`,
    light: true,
  },
]

function TestimonialsSection() {
  return (
    <div className="gc gc-12">
      <div
        className="image-card-slider"
        style={{ display: 'flex', gap: '1rem', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="slide" style={{ flex: '0 0 auto', scrollSnapAlign: 'start' }}>
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
  )
}

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
                  Only use the AI models that work best for you. With Sana, you can choose and switch between leading models as you need.
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
              Only use the AI models that work best for you. With Sana, you can choose and switch between leading models as you need.
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

function TypewriterText({ texts }: { texts: string[] }) {
  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

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
    <span className="text-white">
      {texts[textIdx].slice(0, charIdx)}
      <span className="animate-pulse">|</span>
    </span>
  )
}

function TeamsSection() {
  const [active, setActive] = useState(0)
  const tab = TEAM_TABS[active]

  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-8 md:grid-cols-2">
        {/* Left - Video/Image with prompt */}
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <img
            src={tab.thumb}
            alt={tab.label}
            className="w-full"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-16">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <TypewriterText texts={tab.prompts} />
            </div>
          </div>
        </div>

        {/* Right - Tabs */}
        <div className="flex flex-col justify-between">
          <div>
            <p className="mb-4 text-sm font-semibold text-red-500">Every team gets smarter with Sana</p>
            <nav className="flex flex-col gap-2">
              {TEAM_TABS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-lg font-semibold transition ${i === active ? 'text-black' : 'text-black/30 hover:text-black/50'}`}
                >
                  <span className="text-base">&rarr;</span> {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-8">
            <p className="max-w-md text-base text-black/60">{tab.desc}</p>
            <a
              href="/book-intro"
              className="mt-6 inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/80"
            >
              Book an intro
            </a>
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

function PartnershipSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-8">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-500">Enterprise partnership services</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Driving AI adoption together</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-black/60">
            AI is revolutionizing work in real time. Our partnership-led approach helps your organization become truly AI-first.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={`${IMG}/agents-partnerships.webp`}
              alt="Enterprise partnerships"
              className="h-full w-full object-cover"
              style={{ objectPosition: '50% 30%' }}
            />
          </div>
          <div className="flex flex-col gap-4">
            {PARTNERSHIP_ITEMS.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-black/5 px-5 py-4"
              >
                <svg className="h-5 w-5 shrink-0 text-black/40" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{item}</span>
              </div>
            ))}
            <a
              href="/book-intro"
              className="mt-2 flex items-center justify-center gap-3 rounded-xl bg-black px-5 py-4 font-medium text-white transition hover:bg-black/80"
            >
              Book an intro
            </a>
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
  { name: 'Custom user roles', icon: 'agents-security-icons-01.svg' },
  { name: 'Encryption', icon: 'agents-security-icons-02.svg' },
  { name: 'Flexible groups', icon: 'agents-security-icons-03.svg' },
  { name: 'User provisioning', icon: 'agents-security-icons-04.svg' },
  { name: 'SOC 2 Type 2', icon: 'agents-security-icons-05.svg' },
  { name: 'GDPR compliant', icon: 'agents-security-icons-06.svg' },
  { name: 'ISO 27001', icon: 'agents-security-icons-07.svg' },
  { name: 'SAML single sign-on', icon: 'agents-security-icons-08.svg' },
  { name: 'Advanced permissions', icon: 'agents-security-icons-09.svg' },
  { name: 'Domain verification', icon: 'agents-security-icons-10.svg' },
  { name: 'Regional deploys', icon: 'agents-security-icons-11.svg' },
  { name: 'Audit logging', icon: 'agents-security-icons-12.svg' },
]

function IntegrationsSecuritySection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-8">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl" style={{ maxWidth: '50rem', margin: '0 auto' }}>
            Enterprise-grade integrations and security
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-black/60">
            Sana connects with 100+ applications and unifies your company's data securely.
          </p>
        </div>

        {/* Integrations Card */}
        <div className="mb-6 rounded-2xl border border-black/5 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
            <p className="text-base font-semibold">Connect your daily tools automatically</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {INTEGRATIONS.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <img src={`${IMG}/${item.icon}`} alt={item.name} width={20} height={20} className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <a
            href="/integrations"
            className="mt-6 inline-flex items-center rounded-full bg-black/5 px-5 py-2.5 text-sm font-medium transition hover:bg-black/10"
          >
            See full integrations list
          </a>
        </div>

        {/* Security Card */}
        <div className="rounded-2xl border border-black/5 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
            <p className="text-base font-semibold">Security you can stand by</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {SECURITY_ITEMS.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <img src={`${IMG}/${item.icon}`} alt="" width={16} height={16} className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <a
            href="/security"
            className="mt-6 inline-flex items-center rounded-full bg-black/5 px-5 py-2.5 text-sm font-medium transition hover:bg-black/10"
          >
            Read more about privacy
          </a>
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
    <div className="mx-auto max-w-6xl px-8 py-4">
      <div className="overflow-hidden rounded-2xl">
        <img
          src={`${IMG}/agents-banner-01.webp`}
          alt="Agents banner"
          className="w-full object-cover"
          style={{ objectPosition: '40% 50%' }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  iOS App                                                            */
/* ------------------------------------------------------------------ */
function IOSAppSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-500">Agents iOS app</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">A polymath in your pocket</h2>
        <div className="mx-auto mt-8 max-w-3xl">
          <img
            src={`${IMG}/agents-ios-app.webp`}
            alt="Agents iOS app"
            className="w-full"
          />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-sm text-black/60">
          Connect all your work apps to get instant answers to anything and solve hours of complex tasks in seconds. Missed a meeting? No problem. The recap is just a tap away. Built on any LLM you want. Now available on iOS.
        </p>
        <a
          href="https://apps.apple.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block"
        >
          <div className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-white">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] leading-tight">Download on the</div>
              <div className="text-base font-semibold leading-tight">App Store</div>
            </div>
          </div>
        </a>
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
    <section className="bg-[#f5f0e8] py-20">
      <div className="mx-auto max-w-6xl px-8">
        <h3 className="mb-12 max-w-3xl text-3xl font-semibold md:text-4xl">
          Sana is trusted by leading<br className="hidden md:block" /> enterprises across industries
        </h3>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:grid-cols-8">
          {TRUSTED_LOGOS.map((logo) => (
            <div key={logo} className="flex items-center justify-center">
              <img
                src={`${IMG}/${logo}.svg`}
                alt={logo}
                className="h-auto max-h-8 w-full max-w-full object-contain"
              />
            </div>
          ))}
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
    ctaStyle: 'bg-black text-white hover:bg-black/80',
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
    ctaStyle: 'bg-black/5 text-black hover:bg-black/10',
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
    ctaStyle: 'bg-black/5 text-black hover:bg-black/10',
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
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-8">
        <h2 className="mb-12 text-center text-4xl font-semibold tracking-tight md:text-5xl">Pricing</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} className="flex flex-col rounded-2xl border border-black/5 p-8">
              <p className="text-2xl font-semibold">{plan.name}</p>
              <p className="mt-3 font-semibold">{plan.price}</p>
              <a
                href={plan.ctaHref}
                className={`mt-4 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition ${plan.ctaStyle}`}
              >
                {plan.cta}
              </a>
              <hr className="my-6 border-black/10" />
              <ul className="flex flex-col gap-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-black/70">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-black/40" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-white">
      <SEO
        title="Oxy \u2014 Build expert AI agents in minutes"
        description="One platform for creating expert AI agents grounded in your company's knowledge. No coding required. Connect all your data quickly and securely."
        canonicalPath="/"
      />
      <Navbar />
      <main className="bg-white">
        <HeroSection />
        <PartnerLogos />
        <AllInOneSection />
        <FeaturesSection />
        <StatsSection />
        <TestimonialsSection />
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
    </div>
  )
}
