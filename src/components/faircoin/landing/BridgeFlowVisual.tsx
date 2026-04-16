import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'

/**
 * Visual flow diagram for the FAIR ↔ WFAIR bridge.
 *
 * Three pure-CSS coin tokens (FAIR / WFAIR / FAIR), connected by animated
 * arrows that illustrate the wrap and unwrap directions. Uses framer-motion
 * for the staggered reveal and a subtle path animation along the arrows.
 */
export default function BridgeFlowVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 -bottom-6 -z-10 h-32 rounded-[100%] bg-primary/30 opacity-30 blur-3xl"
      />

      <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto_1fr]">
        {/* Native FAIR coin */}
        <CoinCard
          symbol="F"
          name="FAIR"
          chain="FairCoin chain"
          accent="primary"
          delay={0.1}
        />

        {/* Arrow group (desktop = horizontal, mobile = vertical) */}
        <div className="flex items-center justify-center sm:flex-col sm:gap-2">
          <ArrowGroup direction="horizontal" />
          <ArrowGroup direction="vertical" mobileOnly />
        </div>

        {/* Wrapped WFAIR coin */}
        <CoinCard
          symbol="W"
          name="WFAIR"
          chain="Base mainnet"
          accent="blue"
          delay={0.3}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-6 text-center text-xs text-muted-foreground"
      >
        1:1 redemption · Bridge custody secured by signed multi-party setup
      </motion.p>
    </div>
  )
}

interface CoinCardProps {
  symbol: string
  name: string
  chain: string
  accent: 'primary' | 'blue'
  delay: number
}

function CoinCard({ symbol, name, chain, accent, delay }: CoinCardProps) {
  const accentBg =
    accent === 'primary'
      ? 'from-primary via-primary/90 to-primary/70'
      : 'from-blue-500 via-blue-500/90 to-blue-500/70'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-popover/60 p-6 backdrop-blur-sm"
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${accentBg} shadow-[inset_0_2px_8px_rgba(255,255,255,0.4),0_12px_30px_-10px] shadow-primary/40`}
      >
        <span className="text-2xl font-bold text-white">{symbol}</span>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">{name}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{chain}</p>
      </div>
    </motion.div>
  )
}

function ArrowGroup({
  direction,
  mobileOnly = false,
}: {
  direction: 'horizontal' | 'vertical'
  mobileOnly?: boolean
}) {
  if (direction === 'vertical') {
    return (
      <div className={mobileOnly ? 'flex flex-col items-center gap-1.5 sm:hidden' : 'flex flex-col items-center gap-1.5'}>
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary"
        >
          <ArrowDown className="h-4 w-4" />
        </motion.span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Bridge
        </span>
      </div>
    )
  }
  return (
    <div className="hidden flex-col items-center gap-1.5 sm:flex">
      <motion.span
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary"
      >
        <ArrowRight className="h-4 w-4" />
      </motion.span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        wrap
      </span>
      <motion.span
        initial={{ opacity: 0, x: 8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-500"
      >
        <ArrowRight className="h-4 w-4 -scale-x-100" />
      </motion.span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        unwrap
      </span>
    </div>
  )
}
