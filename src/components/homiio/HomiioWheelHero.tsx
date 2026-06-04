import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from 'framer-motion'
import { Check, Prohibit } from '@phosphor-icons/react'
import HomiioPropertyCard from './HomiioPropertyCard'
import HomiioMatchCard from './HomiioMatchCard'
import HomiioFeatureCards from './HomiioFeatureCards'
import { CoinGlyph } from './icons'
import { HOMIIO_LISTINGS, type HomiioListing } from './data'

const byId = (id: string): HomiioListing =>
  HOMIIO_LISTINGS.find((l) => l.id === id) ?? HOMIIO_LISTINGS[0]

/** Three laps of the deck pack a dense, near-touching ring. */
const WHEEL_CARDS: readonly HomiioListing[] = [...HOMIIO_LISTINGS, ...HOMIIO_LISTINGS, ...HOMIIO_LISTINGS]

/* ------------------------------------------------------------------ */
/* Rotating wheel                                                      */
/* ------------------------------------------------------------------ */

function Wheel({ rotate }: { rotate: MotionValue<number> }) {
  const n = WHEEL_CARDS.length
  return (
    <motion.div
      style={{ rotate }}
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-0 w-0 [--wheel-r:clamp(300px,50vh,540px)]"
    >
      {WHEEL_CARDS.map((listing, i) => {
        const angle = (360 / n) * i
        return (
          <div
            key={`${listing.id}-${i}`}
            className="absolute left-0 top-0"
            style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(-1 * var(--wheel-r)))` }}
          >
            <HomiioPropertyCard listing={listing} className="scale-90 opacity-95" />
          </div>
        )
      })}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

/** Wide rounded panel — used for the Meet Sindi feature row. */
function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-full max-w-4xl rounded-[44px] bg-white px-8 py-10 shadow-[0_50px_140px_-50px_rgba(0,0,0,0.4)] sm:rounded-[72px] sm:px-16 sm:py-14 ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * The signature Homiio scene shell: a wide white stadium (a fully-rounded
 * rectangle — straight top/bottom, semicircular ends) holding a heading on one
 * side and a tinted inset (with the relevant card) on the other, exactly like
 * the original landing's 960×490 / 600px-radius panel. Stacks to a rounded card
 * on narrow screens.
 */
function StadiumPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex w-full max-w-[780px] flex-col items-center justify-center gap-8 rounded-[40px] bg-white px-8 py-10 shadow-[0_50px_140px_-50px_rgba(0,0,0,0.4)] sm:h-[380px] sm:flex-row sm:justify-center sm:gap-12 sm:rounded-full sm:px-12 sm:py-6 ${className}`}
    >
      {children}
    </div>
  )
}

/** Tinted rounded inset that frames a card inside an ellipse scene. */
function GrayInset({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid shrink-0 place-items-center rounded-[28px] bg-neutral-100 p-6 sm:min-w-[330px] sm:p-7 ${className}`}>
      {children}
    </div>
  )
}

function SceneHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[clamp(1.35rem,2.6vw,2rem)] font-semibold uppercase leading-tight tracking-tight text-neutral-900">
      {children}
    </h2>
  )
}

function SceneText({ children }: { children: ReactNode }) {
  return <p className="mt-3 max-w-[15rem] text-base leading-snug text-neutral-400">{children}</p>
}

function TrustCard({ listing, ok }: { listing: HomiioListing; ok: boolean }) {
  return (
    <div className="w-[104px] rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.4)] ring-1 ring-black/5">
      <div className="relative overflow-hidden rounded-xl">
        <img src={listing.image} alt={listing.title} className="h-[78px] w-full object-cover" draggable={false} />
        <div className="absolute inset-0 grid place-items-center">
          {ok ? (
            <Check weight="bold" className="h-9 w-9 text-emerald-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
          ) : (
            <Prohibit weight="bold" className="h-9 w-9 text-red-500 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
          )}
        </div>
      </div>
      <p className="mt-1 line-clamp-2 px-0.5 text-[9px] font-semibold leading-tight text-neutral-900">{listing.title}</p>
      <div className="flex items-center gap-0.5 px-0.5 pb-0.5">
        <CoinGlyph className="h-3 w-3 text-neutral-900" />
        <span className="text-xs font-extrabold text-neutral-900">{listing.price}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

function HeroScene() {
  return (
    <h1 className="mx-auto max-w-2xl text-center font-display text-[clamp(2.25rem,5.5vw,4rem)] font-semibold uppercase leading-[1.05] tracking-tight text-white">
      <span className="text-[#FFC233]">Homiio.</span> Rental made easy
    </h1>
  )
}

function TransparentScene() {
  return (
    <StadiumPanel>
      <div className="text-center sm:max-w-[230px] sm:text-left">
        <SceneHeading>Transparent listings</SceneHeading>
        <SceneText>See property histories, report issues, and know your landlord&rsquo;s record before you rent&mdash;fairness first.</SceneText>
      </div>
      <GrayInset>
        <HomiioPropertyCard listing={byId('teresa-pamies')} />
      </GrayInset>
    </StadiumPanel>
  )
}

function RoommateScene() {
  return (
    <StadiumPanel>
      <GrayInset>
        <HomiioMatchCard />
      </GrayInset>
      <div className="text-center sm:max-w-[230px] sm:text-left">
        <SceneHeading>Roommate harmony</SceneHeading>
        <SceneText>Match with like-minded people through values-based profiles and shared-living compatibility.</SceneText>
      </div>
    </StadiumPanel>
  )
}

function TrustScene() {
  return (
    <StadiumPanel>
      <div className="text-center sm:max-w-[230px] sm:text-left">
        <SceneHeading>Trusted Score system</SceneHeading>
        <SceneText>Powered by Oxy&rsquo;s karma, Homiio highlights trustworthy users and properties, and reveals unethical behavior.</SceneText>
      </div>
      <GrayInset className="!p-4 sm:!p-5">
        <div className="flex gap-2">
          <TrustCard listing={byId('torrent-olla')} ok={false} />
          <TrustCard listing={byId('sant-antoni')} ok />
          <TrustCard listing={byId('manso')} ok />
        </div>
      </GrayInset>
    </StadiumPanel>
  )
}

function SindiScene() {
  return (
    <div className="flex w-full max-w-5xl flex-col items-center">
      <h2 className="mb-6 text-center font-display text-[clamp(1.75rem,4vw,3rem)] font-semibold uppercase leading-tight tracking-tight text-neutral-900">
        Meet Sindi
      </h2>
      <Panel className="sm:py-14">
        <HomiioFeatureCards />
      </Panel>
    </div>
  )
}

const SCENES: readonly ReactNode[] = [
  <HeroScene key="hero" />,
  <TransparentScene key="transparent" />,
  <RoommateScene key="roommate" />,
  <TrustScene key="trust" />,
  <SindiScene key="sindi" />,
]

/* ------------------------------------------------------------------ */
/* Hero (pinned scrollytelling) + reduced-motion fallback             */
/* ------------------------------------------------------------------ */

const GRADIENT = 'bg-[linear-gradient(180deg,#0047BD_0%,#1f6fd0_26%,#bcd8ef_44%,#FFF7D8_58%,#FFF7D8_100%)]'

export default function HomiioWheelHero() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 105])
  const panelsY = useTransform(scrollYProgress, [0, 1], ['0vh', `-${(SCENES.length - 1) * 100}vh`])

  if (reduce) {
    return (
      <div className={`relative overflow-hidden ${GRADIENT}`}>
        {SCENES.map((scene, i) => (
          <section key={i} className="flex min-h-[70vh] w-full items-center justify-center px-6 py-16">
            {scene}
          </section>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className={`relative ${GRADIENT}`} style={{ height: `${SCENES.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <Wheel rotate={rotate} />
        <motion.div style={{ y: panelsY }} className="absolute inset-0 z-10">
          {SCENES.map((scene, i) => (
            <div key={i} className="flex h-screen w-full items-center justify-center px-6">
              {scene}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
