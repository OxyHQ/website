import { motion } from 'framer-motion'
import Button from '../../ui/Button'
import { fc } from '../../../lib/faircoin-links'
import PhoneMockup from './PhoneMockup'

const STATS = [
  { label: 'Since', value: '2014' },
  { label: 'Block time', value: '120s' },
  { label: 'Max supply', value: '33M' },
  { label: 'Algorithm', value: 'Quark' },
] as const

/**
 * Revolut/Wise-style hero. Two-column layout on desktop:
 * - Left: heading + value prop + dual CTAs + trust line
 * - Right: animated FAIRWallet phone mockup with floating chips
 *
 * Falls back to a single-column stack on mobile so the phone mockup sits
 * below the headline, keeping the primary CTA above the fold on small
 * screens. Subtle gradient backdrop + grid decoration for depth.
 *
 * Buttons use the shared Oxy `Button` component — same shape and behaviour
 * as the rest of the site. They are intentionally icon-free in the hero per
 * the FairCoin design rules (icons OK in other sections, not here).
 */
export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[900px] bg-gradient-to-b from-primary/[0.12] via-primary/[0.04] to-transparent" />
        <div className="absolute right-[-10%] top-32 h-[680px] w-[680px] rounded-full bg-primary/[0.08] blur-3xl" />
        <div className="absolute left-[-10%] top-64 h-[480px] w-[480px] rounded-full bg-primary/[0.04] blur-3xl" />
        <GridDecoration />
      </div>

      <div className="container mx-auto px-4 pb-12 pt-16 sm:pb-20 sm:pt-24 lg:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Copy column */}
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Live since 2014
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
              className="mt-6 text-balance text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[60px] lg:text-[72px]"
            >
              <span className="block bg-gradient-to-br from-foreground via-foreground/85 to-primary bg-clip-text text-transparent">
                Decentralized money.
              </span>
              <span className="block">No speculation.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0"
            >
              FairCoin is a community-run cryptocurrency. Hybrid proof-of-work
              and proof-of-stake, hard-capped at 33 million coins. Maintained
              by volunteers since 2014.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-3 lg:items-start lg:justify-start"
            >
              <Button variant="primary" size="lg" href={fc('/buy')}>
                Buy FairCoin
              </Button>
              <Button variant="outline" size="lg" href={fc('/wallet')}>
                Get FAIRWallet
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              Open source. No ICO. No foundation.
            </motion.p>
          </div>

          {/* Phone mockup column */}
          <div className="relative lg:pl-12">
            <PhoneMockup />
            <FloatingChip
              label="WFAIR · Base"
              className="-left-4 top-12 sm:left-0 lg:-left-6"
              delay={0.7}
            />
            <FloatingChip
              label="$0.92 · 24h +2%"
              className="-right-2 top-32 sm:right-0 lg:-right-2"
              delay={0.9}
              accent
            />
            <FloatingChip
              label="Stake · 0.18 FAIR"
              className="-bottom-2 left-8 sm:-bottom-2 lg:-bottom-2"
              delay={1.1}
            />
          </div>
        </div>

        {/* Stat strip */}
        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
          className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:mt-24 sm:grid-cols-4"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 bg-background px-4 py-6"
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="text-2xl font-semibold tabular-nums text-foreground">{stat.value}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}

function FloatingChip({
  label,
  className,
  delay,
  accent = false,
}: {
  label: string
  className: string
  delay: number
  accent?: boolean
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={[
        'absolute inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] backdrop-blur-sm',
        accent
          ? 'border border-primary/40 bg-primary/15 text-primary'
          : 'border border-border bg-popover/95 text-foreground',
        className,
      ].join(' ')}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {label}
    </motion.span>
  )
}

function GridDecoration() {
  return (
    <svg
      aria-hidden
      width="100%"
      height="100%"
      className="absolute inset-0 h-full w-full opacity-[0.05]"
    >
      <defs>
        <pattern
          id="grid-pattern"
          x="0"
          y="0"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path d="M48 0 L0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="grid-mask" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="grid-mask-applied">
          <rect width="100%" height="100%" fill="url(#grid-mask)" />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#grid-pattern)"
        mask="url(#grid-mask-applied)"
      />
    </svg>
  )
}
