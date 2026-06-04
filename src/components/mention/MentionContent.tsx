import { useRef, useState, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion, type MotionValue } from 'framer-motion'
import { Lightning, PencilSimple, Cloud } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import MBrush from '../../assets/mention/m-brush.svg?react'
import sky from '../../assets/mention/sky.jpg'
import logo from '../../assets/mention/logo.png'
import phoneFrame from '../../assets/mention/phone.png'
import pinterestLogo from '../../assets/mention/integrations/pinterest.svg'
import discordLogo from '../../assets/mention/integrations/discord.svg'
import behanceLogo from '../../assets/mention/integrations/behance.svg'
import facebookLogo from '../../assets/mention/integrations/facebook.svg'
import threadsLogo from '../../assets/mention/integrations/threads.svg'
import mastodonLogo from '../../assets/mention/integrations/mastodon.svg'
import instagramLogo from '../../assets/mention/integrations/instagram.svg'
import devLogo from '../../assets/mention/integrations/devdotto.svg'
import mediumLogo from '../../assets/mention/integrations/medium.svg'
import MentionPostCard from './MentionPostCard'
import MentionProfileCard from './MentionProfileCard'
import MentionPhone from './MentionPhone'
import { MENTION_POSTS, MENTION_PROFILES, MENTION_HANDLES, type MentionPost } from './data'

const post = (id: string): MentionPost => MENTION_POSTS.find((p) => p.id === id) ?? MENTION_POSTS[0]

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function Display({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-display font-semibold uppercase leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(30,60,130,0.35)] ${className}`}>
      {children}
    </h2>
  )
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}

function GiantM({ className = '' }: { className?: string }) {
  return <MBrush className={`[&_path]:fill-[#3a55dd] ${className}`} />
}

/* ------------------------------------------------------------------ */
/* Pinned hero: scattered cards converge into the sticky phone feed    */
/* ------------------------------------------------------------------ */

interface FlyIn {
  /** Hero scatter offset relative to this post's resting slot in the feed. */
  x: number
  y: number
  rot: number
  enter: number
}

interface FeedSpec {
  id: string
  /** Scattered hero start; present only for the cards that fly in. */
  fly?: FlyIn
}

/**
 * The phone feed is a real flex column (so posts are always back-to-back, no
 * gaps). The first cards are scattered across the hero and fly in to their
 * natural slot; the rest fade in below so a normal scroll reveals them.
 */
// fly.y is the hero scatter offset measured *from each post's flex slot*, so the
// cards start at the original ring positions even though the feed is a column.
// Every feed post flies in from the hero — no extras, no duplicates.
const FEED: readonly FeedSpec[] = [
  { id: 'vecna-1', fly: { x: 300, y: -39, rot: 5, enter: 0.44 } },
  { id: 'athina-1', fly: { x: -390, y: -127, rot: -6, enter: 0.42 } },
  { id: 'nate-3', fly: { x: -90, y: -329, rot: 4, enter: 0.46 } },
  { id: 'oxy-1', fly: { x: 480, y: -181, rot: 6, enter: 0.45 } },
  { id: 'oxy-2', fly: { x: 150, y: 71, rot: 7, enter: 0.43 } },
  { id: 'joan-1', fly: { x: -250, y: -10, rot: -5, enter: 0.45 } },
  { id: 'nate-1', fly: { x: 370, y: -211, rot: -3, enter: 0.47 } },
  { id: 'vecna-2', fly: { x: -470, y: -279, rot: -2, enter: 0.43 } },
]

/** One feed post; flies in from the hero scatter to its flex slot, or fades in. */
function FeedPost({ spec, progress, flat }: { spec: FeedSpec; progress: MotionValue<number>; flat: boolean }) {
  const fly = spec.fly
  const range: [number, number] = fly ? [0.26, fly.enter] : [0, 1]
  const x = useTransform(progress, range, fly ? [fly.x, 0] : [0, 0])
  const y = useTransform(progress, range, fly ? [fly.y, 0] : [0, 0])
  // Hero cards are bigger; in the feed they sit at full (compact, flat) size.
  const scale = useTransform(progress, range, fly ? [1.28, 1] : [1, 1])
  const rotate = useTransform(progress, range, fly ? [fly.rot, 0] : [0, 0])
  const opacity = useTransform(progress, fly ? [0, 0.04] : [0.4, 0.47], [fly ? 1 : 0, 1])
  return (
    <motion.div style={{ x, y, scale, rotate, opacity }} className="w-full shrink-0">
      <MentionPostCard post={post(spec.id)} flat={flat} className="w-full" />
    </motion.div>
  )
}

function HeroCopy({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <motion.div style={{ opacity }} className="pointer-events-none absolute inset-0 z-30 flex items-center">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="max-w-[600px]">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="size-12 rounded-full object-cover sm:size-14" />
            <span className="font-display text-3xl font-semibold uppercase tracking-tight text-white sm:text-4xl">Mention</span>
          </div>
          <Display className="mt-4 text-left text-[clamp(2rem,4.4vw,3.6rem)]">
            Every one of your posts displayed in an intelligent feed
          </Display>
          <p className="mt-4 max-w-md font-display text-sm font-semibold uppercase tracking-wide text-white/85 sm:text-base">
            All your posts to loved ones and peers all around
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/** Phone-box width; the feed sits in a box of the same size so it lines up. */
const PHONE_W = 270
/** Screen clip, as insets of the phone box — measured from phone.png's screen
 *  (thin bezel: ~1.2% sides, ~0.2% top, ~2.8% bottom). */
const PHONE_SCREEN_CLIP = 'inset(0.4% 1.3% 2.8% 1.3% round 40px)'

function FeedExperience() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [clipped, setClipped] = useState(false)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setClipped(v >= 0.47))

  const heroCopyOpacity = useTransform(scrollYProgress, [0, 0.1, 0.22], [1, 1, 0])
  const subHeadingOpacity = useTransform(scrollYProgress, [0.16, 0.24, 0.34, 0.42], [0, 1, 1, 0])
  const frameScale = useTransform(scrollYProgress, [0.1, 0.24], [0.85, 1])
  const frameOpacity = useTransform(scrollYProgress, [0.12, 0.22], [0, 1])
  // Once the cards have landed, the whole feed scrolls up — a normal app scroll.
  const feedScroll = useTransform(scrollYProgress, [0.5, 1], [0, -660])

  if (reduce) {
    return (
      <section className="relative flex flex-col items-center gap-12 px-6 pb-24 pt-32">
        <Display className="text-center text-[clamp(2rem,5vw,4rem)]">Every one of your posts displayed in an intelligent feed</Display>
        <MentionPhone />
      </section>
    )
  }

  return (
    <section ref={ref} className="relative h-[360vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <GiantM className="pointer-events-none absolute left-1/2 top-1/2 h-[104vh] w-auto -translate-x-1/2 -translate-y-1/2 opacity-40" />

        <HeroCopy opacity={heroCopyOpacity} />

        <motion.div style={{ opacity: subHeadingOpacity }} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <Display className="text-center text-[clamp(2rem,5vw,4rem)]">Your profile.<br />Your content.</Display>
        </motion.div>

        {/* Screen background — the feed sits on it; follows the theme (white in
            light mode, near-black in dark mode). */}
        <motion.div
          style={{ scale: frameScale, opacity: frameOpacity, width: PHONE_W, clipPath: PHONE_SCREEN_CLIP }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-[500/1046] -translate-x-1/2 -translate-y-1/2 bg-background"
        />

        {/* The feed lives in a box the exact size + position of the phone, so the
            screen clip lines up perfectly. Cards fly in, land as posts, then the
            whole feed scrolls up like the app. */}
        <div
          style={{ width: PHONE_W, clipPath: clipped ? PHONE_SCREEN_CLIP : undefined }}
          className="absolute left-1/2 top-1/2 z-10 aspect-[500/1046] -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            className="absolute inset-x-[4%] top-[7.5%] flex flex-col"
            style={{ y: feedScroll }}
          >
            {FEED.map((spec) => (
              <FeedPost key={spec.id} spec={spec} progress={scrollYProgress} flat={clipped} />
            ))}
          </motion.div>
        </div>

        {/* Phone frame (transparent screen) — in front of the feed, so the bezel
            and dynamic island sit over it like a real device. */}
        <motion.div
          style={{ scale: frameScale, opacity: frameOpacity, width: PHONE_W }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_40px_80px_-30px_rgba(20,40,90,0.5)]"
        >
          <img src={phoneFrame} alt="" draggable={false} className="w-full select-none" />
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Other sections                                                      */
/* ------------------------------------------------------------------ */

function TypographySection() {
  return (
    <section className="relative px-6 py-[12vh] text-center">
      <Display className="mx-auto max-w-5xl text-[clamp(2.2rem,6.5vw,5.5rem)]">
        Posts. Communities. Feeds. Photos. Polls. Streams. Questions. Videos. Chat.
      </Display>
      <Display className="mx-auto mt-10 max-w-3xl text-[clamp(1.4rem,3.2vw,2.4rem)]">
        All your things are in Mention.
      </Display>
    </section>
  )
}

const INTEGRATIONS = [
  { src: pinterestLogo, name: 'Pinterest' },
  { src: discordLogo, name: 'Discord' },
  { src: behanceLogo, name: 'Behance' },
  { src: facebookLogo, name: 'Facebook' },
  { src: threadsLogo, name: 'Threads' },
  { src: mastodonLogo, name: 'Mastodon' },
  { src: instagramLogo, name: 'Instagram' },
  { src: devLogo, name: 'DEV' },
  { src: mediumLogo, name: 'Medium' },
] as const

function IntegrationsSection() {
  return (
    <section className="relative px-6 py-[8vh] text-center">
      <p className="font-display text-lg font-semibold text-white/90">Integrations coming soon…</p>
      <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-4">
        {INTEGRATIONS.map(({ src, name }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="grid size-12 place-items-center rounded-full bg-white shadow-[0_10px_30px_-12px_rgba(30,60,130,0.45)]"
          >
            <img src={src} alt={name} draggable={false} className="size-7" />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/**
 * The username slot in mention.earth/@…, rolling vertically through the handles
 * one at a time (holds on each, then rolls to the next, looping forever).
 */
function UsernameRoll() {
  const names = MENTION_HANDLES
  const N = names.length
  const unit = 100 / (N + 1)
  const HOLD = 0.6
  const yframes: string[] = []
  const times: number[] = []
  for (let i = 0; i < N; i++) {
    const y = (-i * unit).toFixed(3) + '%'
    yframes.push(y, y)
    times.push(i / N, (i + HOLD) / N)
  }
  yframes.push((-N * unit).toFixed(3) + '%')
  times.push(1)

  const longest = names.reduce((a, b) => (b.length > a.length ? b : a))
  return (
    // The invisible handle stays in flow: it sets the width *and* the text
    // baseline (so it lines up with the prefix). The roll is layered on top and
    // clipped to a single line.
    <span className="relative inline-block whitespace-nowrap text-left text-foreground">
      <span className="invisible">{longest}</span>
      <span className="absolute inset-0 overflow-hidden">
        <motion.span
          className="flex flex-col"
          animate={{ y: yframes }}
          transition={{ duration: N * 1.5, times, ease: [0.76, 0, 0.24, 1], repeat: Infinity }}
        >
          {[...names, names[0]].map((h, i) => (
            <span key={i} className="block">{h}</span>
          ))}
        </motion.span>
      </span>
    </span>
  )
}

function UniqueLinkSection() {
  return (
    <section className="relative px-6 py-[12vh]">
      <div className="text-center">
        <Display className="text-[clamp(1.8rem,4.5vw,3.4rem)]">Your unique link.</Display>
        <p className="mx-auto mt-3 font-display text-sm font-semibold uppercase tracking-wide text-white/85">
          And btw, the good ones are still free.
        </p>
      </div>

      <div className="relative mx-auto mt-12 w-full max-w-4xl">
        <div className="mx-auto w-fit max-w-full rounded-full bg-surface px-6 py-5 shadow-[0_50px_140px_-50px_rgba(20,40,90,0.5)] sm:px-12 sm:py-6">
          <p className="flex items-baseline justify-center gap-x-[0.08em] font-display text-[clamp(1.5rem,4.5vw,3.25rem)] font-semibold leading-[1.15] tracking-tight">
            <span className="text-muted-foreground">mention.earth/@</span>
            <UsernameRoll />
          </p>
        </div>
        <Reveal className="hidden -left-2 -top-10 sm:block sm:-left-10 lg:-left-24" delay={0.1}><MentionProfileCard profile={MENTION_PROFILES[0]} className="rotate-[-5deg]" /></Reveal>
        <Reveal className="hidden -right-2 top-1/2 sm:block sm:-right-10 lg:-right-24" delay={0.2}><MentionProfileCard profile={MENTION_PROFILES[1]} className="rotate-[5deg]" /></Reveal>
      </div>
    </section>
  )
}

function JoinSection() {
  return (
    <section className="relative flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 pb-[12vh] pt-[6vh]">
      <div className="flex items-center gap-4 text-white/80 sm:gap-6">
        <Lightning weight="fill" className="hidden size-7 sm:block" />
        <PencilSimple weight="bold" className="hidden size-7 sm:block" />
        <Link
          to="/inbox"
          className="rounded-full bg-white px-7 py-3 font-display text-base font-semibold uppercase tracking-tight text-neutral-900 shadow-[0_18px_50px_-18px_rgba(20,40,90,0.6)] transition-transform hover:scale-105"
        >
          Join Mention
        </Link>
        <PencilSimple weight="bold" className="hidden size-7 -scale-x-100 sm:block" />
        <Cloud weight="fill" className="hidden size-7 sm:block" />
      </div>
      <Reveal className="bottom-0 left-[14%]" delay={0.1}>
        <MentionPostCard post={post('nate-1')} className="w-[240px] rotate-[-5deg]" />
      </Reveal>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export default function MentionContent() {
  return (
    <div className="relative bg-[#88a6f0] dark:bg-[#070713]">
      {/* Sky — full strength in light mode, dimmed to a night sky in dark mode */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat dark:opacity-20"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(120,150,235,0.15), rgba(190,210,245,0.35)), url(${sky})` }}
      />
      {/* Dark wash only in dark mode */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-b from-[#0a0a1c]/40 to-[#06060f]/70 dark:block" />

      <div className="relative">
        <FeedExperience />
        <TypographySection />
        <IntegrationsSection />
        <UniqueLinkSection />
        <JoinSection />
      </div>
    </div>
  )
}
