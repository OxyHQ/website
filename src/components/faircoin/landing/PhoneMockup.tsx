import { motion } from 'framer-motion'

/**
 * Pure-CSS FAIRWallet phone mockup.
 *
 * No external image dependency — the phone bezel is a styled div, the screen
 * holds a small reproduction of the wallet's home tab (balance + receive/send
 * + transactions list). Style mirrors the actual FAIRWallet (Bloom + faircoin
 * theme), so the visual stays in sync if either app evolves.
 */
export default function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="relative mx-auto w-[280px] sm:w-[320px]"
    >
      {/* Floating shadow */}
      <div
        aria-hidden
        className="absolute inset-x-6 -bottom-8 -z-10 h-24 rounded-[100%] bg-primary/30 opacity-40 blur-3xl"
      />

      {/* Phone bezel */}
      <div
        className="relative overflow-hidden rounded-[44px] border-[10px] border-foreground/90 bg-background shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4),0_8px_30px_-10px_rgba(0,0,0,0.2)]"
        style={{ aspectRatio: '9/19.5' }}
      >
        {/* Speaker / camera notch */}
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-foreground/90" />

        {/* Status bar */}
        <div className="flex items-center justify-between bg-background px-6 pb-1 pt-3 text-[10px] font-semibold text-foreground">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <SignalGlyph />
            <WifiGlyph />
            <BatteryGlyph />
          </span>
        </div>

        {/* Wallet header */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              F
            </span>
            <span className="text-sm font-semibold text-foreground">FAIRWallet</span>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>

        {/* Balance card */}
        <div className="mx-4 mt-4 rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground shadow-inner">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
            Total balance
          </p>
          <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-bold leading-none tracking-tight">
            247.50
            <span className="text-sm font-semibold opacity-80">FAIR</span>
          </p>
          <p className="mt-1 text-[11px] opacity-80">≈ $247.50 USD</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Receive', icon: 'down' },
              { label: 'Send', icon: 'up' },
              { label: 'Buy', icon: 'plus' },
            ].map((action) => (
              <div
                key={action.label}
                className="flex flex-col items-center gap-1 rounded-2xl bg-primary-foreground/15 py-2 backdrop-blur"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20">
                  {action.icon === 'down' ? (
                    <ArrowGlyph direction="down" />
                  ) : action.icon === 'up' ? (
                    <ArrowGlyph direction="up" />
                  ) : (
                    <PlusGlyph />
                  )}
                </span>
                <span className="text-[10px] font-semibold">{action.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="mx-4 mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recent activity
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            <ActivityRow label="Received from FH4z…" value="+12.50" delta="up" timeAgo="2m ago" />
            <ActivityRow label="Sent to FQa3…" value="−4.00" delta="down" timeAgo="1h ago" />
            <ActivityRow label="Stake reward" value="+0.18" delta="up" timeAgo="3h ago" />
          </ul>
        </div>

        {/* Tab bar */}
        <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-6 pb-5 pt-3">
          <div className="flex items-center justify-between text-muted-foreground">
            {[
              { label: 'Home', active: true },
              { label: 'Buy', active: false },
              { label: 'Stake', active: false },
              { label: 'Settings', active: false },
            ].map((tab) => (
              <span
                key={tab.label}
                className={`flex flex-col items-center gap-0.5 ${tab.active ? 'text-primary' : ''}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${tab.active ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                />
                <span className="text-[9px] font-semibold">{tab.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ActivityRow({
  label,
  value,
  delta,
  timeAgo,
}: {
  label: string
  value: string
  delta: 'up' | 'down'
  timeAgo: string
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-background/40 p-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className={[
            'flex h-7 w-7 items-center justify-center rounded-full',
            delta === 'up' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500',
          ].join(' ')}
        >
          <ArrowGlyph direction={delta} />
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-foreground">{label}</span>
          <span className="text-[9px] text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
      <span
        className={[
          'font-mono text-xs font-semibold',
          delta === 'up' ? 'text-emerald-500' : 'text-amber-500',
        ].join(' ')}
      >
        {value}
      </span>
    </li>
  )
}

function ArrowGlyph({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path
        d={direction === 'up' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function SignalGlyph() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
      <rect x="0" y="6" width="2" height="4" rx="0.4" />
      <rect x="3.5" y="4" width="2" height="6" rx="0.4" />
      <rect x="7" y="2" width="2" height="8" rx="0.4" />
      <rect x="10.5" y="0" width="2" height="10" rx="0.4" opacity="0.4" />
    </svg>
  )
}

function WifiGlyph() {
  return (
    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
      <path
        d="M6 8a1 1 0 100-2 1 1 0 000 2zM2.5 4.5C3.5 3.5 4.7 3 6 3s2.5.5 3.5 1.5M.5 2.5C2 1 4 .25 6 .25s4 .75 5.5 2.25"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BatteryGlyph() {
  return (
    <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
      <rect x="0.5" y="0.5" width="18" height="10" rx="2" stroke="currentColor" />
      <rect x="2" y="2" width="13" height="7" rx="1" fill="currentColor" />
      <rect x="20" y="3.5" width="1.5" height="4" rx="0.4" fill="currentColor" />
    </svg>
  )
}
