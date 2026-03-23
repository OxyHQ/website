import { useState, useEffect, useRef } from 'react'
import { aiHero, aiDemoTabs, aiFeatureCards } from '../../data/ai'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import AnimatedLineGrid from './AnimatedLineGrid'

/* ───────────────────────── Tab Videos Map ───────────────────────── */

const tabVideos: Record<number, string> = {
  0: '/ai/morning-briefing-start.mp4',
  1: '/ai/catch-up.mp4',
  2: '/ai/todo.mp4',
  3: '/ai/todo-assign-ai.mp4',
  4: '/ai/managed-inbox.mp4',
  5: '/ai/meeting.mp4',
  6: '/ai/evening-briefing.mp4',
}

/* ───────────────────────── Demo Video Component ───────────────────────── */

function DemoVideo({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Reset and play when src changes
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }, [src])

  return (
    <div className="flex h-full items-center justify-center overflow-hidden rounded-2xl">
      <video
        ref={videoRef}
        key={src}
        src={src}
        className="h-full w-full rounded-t-[19px] object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster={poster}
      />
    </div>
  )
}

/* ───────────────────────── Placeholder Mockup ───────────────────────── */


/* ───────────────────────── Icon components ───────────────────────── */

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 12 12" fill="currentColor" className={className}>
      <g fill="currentColor">
        <path d="m11.526,5.803l-3.102-1.227-1.227-3.102c-.113-.286-.39-.474-.697-.474s-.584.188-.697.474l-1.227,3.102-3.102,1.227c-.286.113-.474.39-.474.697s.188.584.474.697l3.102,1.227,1.227,3.102c.113.286.39.474.697.474s.584-.188.697-.474l1.227-3.102,3.102-1.227c.286-.113.474-.39.474-.697s-.188-.584-.474-.697Z" strokeWidth="0" />
        <path d="m3.492,1.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316.947-.946.315c-.153.051-.257.194-.257.356s.104.305.257.356l.946.315.316.947c.051.153.194.256.355.256s.305-.104.355-.256l.316-.947.946-.315c.153-.051.257-.194.257-.356s-.104-.305-.257-.356h0Z" fill="currentColor" strokeWidth="0" />
      </g>
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none" className={className}>
      <g clipPath="url(#clip-clock)">
        <path d="M7.00005 13.2218C10.4365 13.2218 13.2223 10.436 13.2223 6.99957C13.2223 3.56313 10.4365 0.777344 7.00005 0.777344C3.56362 0.777344 0.777832 3.56313 0.777832 6.99957C0.777832 10.436 3.56362 13.2218 7.00005 13.2218Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 3.76562V7.00118L9.73778 8.7434" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip-clock">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" className={className}>
      <g fill="currentColor">
        <path d="M5.707,14.875c.094,.018,.191,.025,.385,.039,.403,.051,.787-.234,.842-.645s-.234-.788-.645-.842c-.067-.009-.136-.014-.204-.018-.035-.002-.069-.002-.101-.008-.605-.115-1.188-.332-1.729-.645-.244-.141-.547-.132-.783,.021-.273,.178-.763,.384-1.295,.531,.333-.887,.424-1.888,.062-2.568-.483-.836-.738-1.785-.738-2.742C1.5,4.966,3.967,2.5,6.998,2.5c1.933,0,3.689,.993,4.698,2.656,.215,.353,.675,.466,1.03,.252,.354-.215,.468-.676,.253-1.03-1.284-2.115-3.52-3.377-5.981-3.377C3.14,1,0,4.139,0,7.998c0,1.221,.325,2.428,.927,3.47,.167,.314-.065,1.605-.707,2.248-.209,.209-.276,.522-.17,.798,.105,.276,.364,.465,.659,.481,.073,.004,.146,.006,.222,.006,.992,0,2.162-.337,2.958-.738,.577,.288,1.187,.494,1.818,.613Z" />
        <path d="M17.295,14.367c.461-.797,.705-1.704,.705-2.621,0-2.895-2.355-5.25-5.25-5.25s-5.251,2.355-5.251,5.25,2.355,5.25,5.251,5.25c.325,0,.651-.03,.97-.091,.438-.083,.864-.222,1.27-.414,.597,.281,1.425,.508,2.135,.508,.057,0,.112-.001,.166-.004,.296-.016,.555-.205,.66-.481,.106-.276,.039-.589-.17-.798-.376-.376-.547-1.168-.485-1.349Z" />
      </g>
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <g clipPath="url(#clip-shield)">
        <path d="M9.52793 7.00347C9.20593 7.00347 8.94459 6.74214 8.94459 6.42014V3.89236C8.94459 2.82058 8.07193 1.94792 7.00015 1.94792C5.92837 1.94792 5.0557 2.82058 5.0557 3.89236V6.42014C5.0557 6.74214 4.79437 7.00347 4.47237 7.00347C4.15037 7.00347 3.88904 6.74214 3.88904 6.42014V3.89236C3.88904 2.17658 5.28437 0.78125 7.00015 0.78125C8.71593 0.78125 10.1113 2.17658 10.1113 3.89236V6.42014C10.1113 6.74214 9.84993 7.00347 9.52793 7.00347Z" fill="currentColor" />
        <path d="M9.9168 5.83594H4.08347C2.90358 5.83594 1.94458 6.79494 1.94458 7.97483V11.0859C1.94458 12.2658 2.90358 13.2248 4.08347 13.2248H9.9168C11.0967 13.2248 12.0557 12.2658 12.0557 11.0859V7.97483C12.0557 6.79494 11.0967 5.83594 9.9168 5.83594ZM7.58347 9.91927C7.58347 10.2413 7.32214 10.5026 7.00014 10.5026C6.67814 10.5026 6.4168 10.2413 6.4168 9.91927V9.14149C6.4168 8.81949 6.67814 8.55816 7.00014 8.55816C7.32214 8.55816 7.58347 8.81949 7.58347 9.14149V9.91927Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="clip-shield">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 11 11" fill="none">
      <path d="M0.587891 5.84207V4.55407H8.39989L4.49389 0.914067L5.37589 0.0180664L10.3879 4.79207V5.56207L5.37589 10.3501L4.49389 9.45407L8.37189 5.84207H0.587891Z" fill="currentColor" />
    </svg>
  )
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  sparkle: SparkleIcon,
  clock: ClockIcon,
  chat: ChatIcon,
  shield: ShieldIcon,
}

/* ───────────────────────── Frost Button ───────────────────────── */

function FrostButton({
  children,
  className = '',
  href,
  style,
}: {
  children: React.ReactNode
  className?: string
  href?: string
  style?: React.CSSProperties
}) {
  const classes = `inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-4 py-2 text-lg font-medium text-foreground backdrop-blur-sm transition-shadow shadow-[0px_0px_7px_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0px_0px_8px_1px_rgba(255,255,255,0.15)_inset] ${className}`

  if (href) {
    return (
      <a href={href} className={classes} style={style}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={classes} style={style}>
      {children}
    </button>
  )
}


/* ───────────────────────── Main Page ───────────────────────── */

export default function AIPage() {
  const [activeTab, setActiveTab] = useState(0)
  const ctaRef = useScrollReveal()
  const featuresRef = useScrollReveal()

  // Sun halo scroll effect
  useEffect(() => {
    function handleScroll() {
      const halo = document.getElementById('glow-effect')
      if (halo) {
        const opacity = Math.min(1, window.scrollY / 500)
        halo.style.opacity = String(opacity)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Hero parallax scroll effect
  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY
      const hero = document.getElementById('ai-hero-content')
      if (hero) {
        hero.style.transform = `translateY(${y * 0.15}px)`
        hero.style.opacity = String(Math.max(0, 1 - y / 600))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="text-foreground">
      {/* ── 1. Hero — Split Layout ── */}
      <div className="relative z-0 mx-auto flex min-h-screen w-full max-w-[100rem] flex-col overflow-clip lg:flex-row">
        {/* Layer 1: Gradient */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#4867AF] via-[#9CAFB8] via-[62%] to-[#C49577]" />

        {/* Layer 2: Shadow texture (darkens via color-burn) */}
        <div className="pointer-events-none absolute inset-0 z-[1]" style={{ mixBlendMode: 'color-burn' }}>
          <img src="/ai/shadow-bg.png" alt="" className="h-full w-full object-cover" />
        </div>

        {/* Layer 3: CSS glow effect (fades in on scroll) */}
        <div
          className="pointer-events-none absolute h-screen w-[12rem] rounded-full right-[40rem] top-0 rotate-45 opacity-0 transition-opacity duration-300 ease-in-out z-[2]"
          id="glow-effect"
          style={{
            background: 'rgb(255, 255, 255)',
            boxShadow: 'rgb(255, 255, 255) 0px 6.719px 50.393px 0px inset',
            filter: 'blur(200px)',
          }}
        />

        {/* Layer 4: Animated line grid */}
        <AnimatedLineGrid />

        {/* Left sticky panel */}
        <div className="relative overflow-hidden lg:pointer-events-none lg:sticky lg:inset-0 lg:z-40 lg:flex lg:px-0 lg:max-h-screen lg:max-w-[32rem] mt-12 shrink-0 max-lg:snap-start lg:mt-0 lg:min-h-0 lg:border-r-[0.5px] lg:border-black/10">
          <div className="relative flex w-full lg:pointer-events-auto lg:min-w-[32rem] lg:overflow-y-auto lg:overflow-x-hidden lg:pl-6">
            <div className="mx-auto max-w-lg lg:mx-0 lg:flex lg:w-[32rem] lg:max-w-none lg:flex-col px-8 sm:px-0 lg:px-4">
              <div id="ai-hero-content" className="pb-8 pt-16 lg:flex lg:h-full lg:flex-col lg:pr-10">
                {/* Badge */}
                <h6 className="body-lg text-base text-white">{aiHero.badge}</h6>

                {/* Title */}
                <h1 className="body-md font-geist mt-4 max-w-80 text-4xl font-medium text-white sm:max-w-none sm:text-5xl">
                  {aiHero.title}
                </h1>

                {/* Feature list with icons */}
                <div className="mt-6 flex flex-col gap-3">
                  {aiHero.features.map((f) => {
                    const Icon = iconMap[f.icon] ?? SparkleIcon
                    return (
                      <div key={f.text} className="flex items-start gap-2">
                        <Icon className="mt-0.5 size-4 shrink-0 text-white" />
                        <p className="body-lg text-sm text-white">{f.text}</p>
                      </div>
                    )
                  })}
                </div>

                {/* CTA button */}
                <div className="mb-4 mt-4 w-fit">
                  <FrostButton className="gap-1.5 px-3 py-2 text-sm" href="#">
                    Get Started
                    <ArrowIcon className="size-3" />
                  </FrostButton>
                </div>

                {/* Demo navigation tabs (desktop only) */}
                <div className="mt-auto max-lg:hidden">
                  <h6 className="heading-md mb-4 text-[18px] font-bold text-white">
                    What Oxy AI handles for you
                  </h6>
                  <ul className="flex flex-col items-start max-h-80 overflow-y-auto hide-scrollbar">
                    {aiDemoTabs.map((tab, i) => (
                      <li key={tab.label} className="w-full">
                        <button
                          type="button"
                          onClick={() => setActiveTab(i)}
                          className={`text-base transition-colors duration-200 flex items-center justify-between text-white select-none w-full rounded-[10px] p-2 ${
                            activeTab === i ? 'bg-black/5 ring-inset ring-[#73A7FF]' : 'ring-inset ring-[#73A7FF]'
                          }`}
                        >
                          <div className="flex items-center">
                            {activeTab === i && (
                              <div className="h-5 w-[3px] rounded-[2px] bg-[#73A7FF] mr-1.5" />
                            )}
                            {tab.label}
                          </div>
                          <span className="font-mono font-medium text-white/75 mix-blend-plus-lighter">
                            {tab.number}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right content area — demo screens */}
        <div className="relative z-10 grow bg-black/10">
          {/* SVG pattern border on left edge */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <svg className="absolute top-0 z-10 h-full w-2 px-1.5 pt-1 box-content border-r border-white/10" aria-hidden="true">
              <defs>
                <pattern id="hero-pattern" width="8" height="16" patternUnits="userSpaceOnUse">
                  <path d="M0 0H16M0" className="stroke-white/50" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-pattern)" />
            </svg>
            <div className="fixed top-0 z-50 h-20 w-5 bg-gradient-to-b from-[#4867AF] to-[#4867AF]/0" style={{ left: '512px', opacity: 1 }} />
          </div>

          {/* Demo content area */}
          <div className="relative isolate min-h-screen overscroll-none">
            {/* Mobile tab bar */}
            <div className="ml-5 w-[calc(100%-20px)] pt-8 block lg:hidden sticky top-0 z-50 bg-transparent backdrop-blur-md">
              <p className="text-sm font-bold uppercase tracking-wide text-foreground/50">
                {aiDemoTabs[activeTab]
                  ? `Budapest - 08:00 - ${aiDemoTabs[activeTab].label}`
                  : ''}
              </p>
              <div className="relative mt-4 h-[0.5px] w-full" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.5) 100%)' }}>
                <div className="absolute -top-1 left-0 flex items-center gap-1">
                  <div className="size-2.5 rounded-full bg-white/5 flex items-center justify-center">
                    <div className="size-1 rounded-full bg-white" />
                  </div>
                  <div className="h-[0.5px] w-4 bg-white" />
                </div>
              </div>
            </div>

            {/* Desktop sticky header */}
            <div className="hidden lg:block sticky top-0 z-50">
              <div className="relative px-5 py-4">
                <p className="text-sm font-bold uppercase tracking-wide text-foreground/50">
                  {aiDemoTabs[activeTab]
                    ? `Budapest - 08:00 - ${aiDemoTabs[activeTab].label}`
                    : ''}
                </p>
              </div>
            </div>

            {/* Demo section */}
            <div id={aiDemoTabs[activeTab]?.label.toLowerCase().replace(/\s+/g, '-')} className="relative flex flex-col pl-5 snap-start scroll-mt-[68px] h-screen min-h-screen">
              <div className="relative overflow-y-hidden mx-auto flex h-full w-full flex-col pl-10 pt-10">
                <div className="mb-7 flex flex-col gap-1.5">
                  <h3 className="heading-3xl font-geist text-4xl font-medium text-white">
                    {aiDemoTabs[activeTab]?.label ?? 'Morning Briefing'}
                  </h3>
                  <p className="body-lg pr-10 font-geist text-base text-white/70">
                    {aiDemoTabs[activeTab]?.description ?? 'Your AI assistant prepares your daily briefing.'}
                  </p>
                </div>
                {/* Video */}
                <div className="flex-1 overflow-hidden">
                  <DemoVideo src={tabVideos[activeTab] || '/ai/morning-briefing-start.mp4'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. "Your smartest coworker starts today" CTA ── */}
      <section ref={ctaRef} className="flex flex-col items-center px-6 py-16 text-center md:py-28">
        <h5 className="scroll-reveal heading-md uppercase tracking-widest opacity-50 text-foreground">Get Started</h5>
        <h2 className="scroll-reveal heading-3xl mt-3 text-[40px] font-medium text-foreground sm:text-[50px] sm:leading-[56px]" style={{ transitionDelay: '100ms' }}>
          Your smartest coworker starts today.
        </h2>
        <p className="scroll-reveal body-md mt-3 text-[18px] leading-6 opacity-50 text-foreground" style={{ transitionDelay: '200ms' }}>
          Connect your tools. Oxy AI starts working in under a minute.
        </p>
        <div className="scroll-reveal mt-6" style={{ transitionDelay: '300ms' }}>
          <FrostButton className="text-[18px] gap-1.5 px-4 py-2" href="#">
            Get started today
            <ArrowIcon className="mt-0.5 size-4" />
          </FrostButton>
        </div>
        {/* CTA background images */}
        <div className="scroll-reveal relative mt-8 w-full" style={{ transitionDelay: '400ms' }}>
          <div className="relative hidden w-full select-none overflow-hidden md:block md:aspect-[2772/962]">
            <img alt="CTA Background" src="/ai/cta-desktop-bg.png" className="w-full h-auto object-cover object-bottom" />
          </div>
          <img alt="CTA Background" src="/ai/cta-mobile-bg.png" className="mx-auto w-[50vh] max-w-[80vw] select-none md:hidden" />
        </div>
      </section>

      {/* ── 3. "Built for real work" — Horizontal Scroll Feature Cards ── */}
      <div
        ref={featuresRef}
        id="features"
        className="font-geist pl-0 pt-12 sm:pt-14 md:pb-4 md:pl-14 lg:pb-14 flex flex-col md:flex-row pb-0"
      >
        {/* Left: heading + CTA */}
        <div className="flex shrink-0 flex-col gap-2 py-8 pl-4 pr-20 text-black sm:pl-6 md:max-w-xs md:pl-0">
          <h2 className="scroll-reveal text-5xl font-medium text-foreground">
            Built for real work.
          </h2>
          <div className="scroll-reveal mt-6 md:mt-auto" style={{ transitionDelay: '100ms' }}>
            <FrostButton className="w-fit gap-1.5 px-3 py-2 text-sm font-medium" href="#">
              Get Started
              <ArrowIcon className="mt-0.5 size-3" />
            </FrostButton>
          </div>
        </div>

        {/* Right: horizontal scroll cards */}
        <div className="relative w-full min-w-0 flex-1">
          <div className="overflow-x-auto overflow-y-hidden hide-scrollbar">
            <div className="flex w-full items-center gap-4">
              {aiFeatureCards.map((card, i) => (
                <div
                  key={card.title}
                  className={`scroll-reveal relative shrink-0 overflow-hidden p-8 h-[520px] w-96 rounded-[32px] flex flex-col gap-1 ${i === 0 ? 'ml-4 sm:ml-6 md:ml-0' : ''}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {/* Shader/gradient background */}
                  <div className={`pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-br ${card.gradient ?? 'from-foreground/5 to-foreground/10'}`} />

                  {/* Content */}
                  <p className="relative z-10 heading-3xl text-[32px] font-semibold text-white">{card.title}</p>
                  <p className="relative z-10 heading-xl text-sm font-medium text-white opacity-50 mix-blend-plus-lighter">{card.subtitle}</p>

                  {card.image && (
                    <img
                      alt={card.title}
                      src={`/ai/${card.image}`}
                      className="relative z-10 mt-auto h-auto max-h-[330px] w-full select-none object-contain"
                    />
                  )}
                </div>
              ))}

              {/* Trailing spacer to match original */}
              <div className="h-[520px] w-3 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer handled by shared Footer in page wrapper */}
    </div>
  )
}
