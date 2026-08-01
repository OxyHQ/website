import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { PAY_ACCOUNTS } from './data'

/**
 * The savings-goal cards drifting behind the headline.
 *
 * Depth drives everything: a card's blur, opacity, scale, stacking order and
 * how far it travels as the section scrolls. Near cards move most and stay
 * sharp; far cards barely shift and sit behind the blur. One value per card
 * keeps the parallax internally consistent instead of hand-tuned per property.
 */
function AccountCard({ index }: { index: number }) {
  const account = PAY_ACCOUNTS[index]
  const Icon = account.icon
  const { depth } = account

  return (
    <div
      className="flex h-32 w-[179px] flex-col items-start justify-between bg-bg-primary p-3 text-fg-primary"
      style={{ filter: `blur(${((1 - depth) * 2).toFixed(2)}px)`, opacity: 0.3 + depth * 0.7 }}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-bg-inputs">
          <Icon width={account.iconSize} height={account.iconSize} />
        </span>
        <span className="font-display text-stat-label">{account.label}</span>
      </div>
      <div className="flex flex-col items-start whitespace-nowrap">
        <span className="text-caption text-fg-secondary">Saving for</span>
        <span className="font-display text-account-balance">{account.balance}</span>
      </div>
    </div>
  )
}

export default function PayAccountsCloud() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  return (
    <div
      ref={ref}
      aria-label="Industry-leading interest"
      className="pointer-events-none relative aspect-[5/6] w-full select-none overflow-hidden bg-bg-secondary tablet-lg:aspect-[2/1]"
      role="img"
    >
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2"
        style={{ height: 536, width: 1120, transform: 'translate(-50%, -50%) scale(0.825)' }}
      >
        {PAY_ACCOUNTS.map((account, index) => (
          <CloudItem key={`${account.label}-${index}`} index={index} progress={scrollYProgress} reduced={Boolean(reduced)} />
        ))}
      </div>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center"
        style={{ zIndex: 8000, transform: 'scale(1.21212)' }}
      >
        <p className="font-display text-h3 text-fg-primary tablet-lg:text-display">One balance, many pots</p>
        <p className="text-caption text-fg-secondary">Name them, move between them, close them whenever you want.</p>
      </div>

      <div className="absolute inset-x-0 top-0 z-[99999] h-[97px] bg-[linear-gradient(180deg,var(--pay-bg-secondary)_0%,transparent_100%)]" />
      <div className="absolute inset-x-0 bottom-0 z-[99999] h-[97px] bg-[linear-gradient(180deg,transparent_0%,var(--pay-bg-secondary)_100%)]" />
    </div>
  )
}

function CloudItem({
  index,
  progress,
  reduced,
}: {
  index: number
  progress: ReturnType<typeof useScroll>['scrollYProgress']
  reduced: boolean
}) {
  const account = PAY_ACCOUNTS[index]
  const { depth } = account
  /** Near cards sweep further and scale up; far cards stay small and still. */
  const travel = 40 + depth * 150
  const y = useTransform(progress, [0, 1], [travel, -travel])
  const x = useTransform(progress, [0, 1], [travel * 0.25, -travel * 0.25])

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        left: account.left,
        top: account.top,
        zIndex: Math.round(depth * 16000),
        scale: 0.72 + depth * 0.47,
        x: reduced ? 0 : x,
        y: reduced ? 0 : y,
      }}
    >
      <AccountCard index={index} />
    </motion.div>
  )
}
