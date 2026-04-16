import { motion } from 'framer-motion'

/**
 * PhoneMockup — a 1:1 web replica of the FAIRWallet home screen.
 *
 * The real app lives at `FAIRWallet/app/(tabs)/index.tsx` and uses NativeWind
 * classes on top of Bloom's faircoin theme (Phudu display font, primary green,
 * dark background). Every pixel here mirrors that screen.
 *
 * Theme: the wallet always renders in its own theme, not the website's. The
 * `.phone-mockup-dark` scope (defined in `styles/faircoin-theme.css`) pins the
 * dark FairCoin palette inside the phone bezel so the mockup stays consistent
 * regardless of the site's light/dark mode toggle. Inside that scope we use
 * plain Tailwind tokens — `bg-background`, `text-foreground`, `bg-primary` —
 * which resolve to the FairCoin dark values.
 *
 * Structure top→bottom (matches `FAIRWallet/app/(tabs)/index.tsx`):
 *  - Status bar (9:41 / signal / wifi / battery) — purely cosmetic
 *  - Hero image (the actual wallet hero asset) with a gradient fade into bg
 *  - Top bar overlaid on hero: wallet name (chevron) + sync pill
 *  - Balance: Phudu-light symbol, Phudu-black amount, USD subtitle, +badge
 *  - Action row: Send / Receive / Buy / Places / Contacts / Nodes
 *  - Activity header: "Activity" + transaction count
 *  - Transaction list: 4 realistic items mirroring real `TransactionItem`
 *  - Bottom tab bar: Home (active), Send, Receive, Buy, Settings
 *
 * Inert: no data wiring, realistic constants only. Single fadeIn+scale on
 * viewport entry; no continuous animation.
 */

const WALLET_HERO_URL = '/images/faircoin/wallet-hero.jpg'

const PHUDU_BLACK: React.CSSProperties = {
  fontFamily: "'Phudu', system-ui, sans-serif",
  fontWeight: 900,
}
const PHUDU_LIGHT: React.CSSProperties = {
  fontFamily: "'Phudu', system-ui, sans-serif",
  fontWeight: 300,
}
const PHUDU_SEMIBOLD: React.CSSProperties = {
  fontFamily: "'Phudu', system-ui, sans-serif",
  fontWeight: 700,
}

const TEXT_SHADOW_LIGHT: React.CSSProperties = {
  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
}

const TAB_ITEMS = [
  { label: 'Home', icon: 'wallet', active: true },
  { label: 'Send', icon: 'arrow-up', active: false },
  { label: 'Receive', icon: 'arrow-down', active: false },
  { label: 'Buy', icon: 'plus', active: false },
  { label: 'Settings', icon: 'cog', active: false },
] as const

const ACTION_ITEMS = [
  { label: 'Send', icon: 'arrow-up' as const },
  { label: 'Receive', icon: 'arrow-down' as const },
  { label: 'Buy', icon: 'plus' as const },
  { label: 'Places', icon: 'pin' as const },
  { label: 'Contacts', icon: 'people' as const },
  { label: 'Nodes', icon: 'server' as const },
]

type IconName =
  | 'arrow-up'
  | 'arrow-down'
  | 'plus'
  | 'pin'
  | 'people'
  | 'server'
  | 'cog'
  | 'wallet'

type TxType = 'receive' | 'send' | 'masternode_reward'

interface TxItem {
  type: TxType
  title: string
  address: string
  amount: string
  time: string
}

const TX_ITEMS: readonly TxItem[] = [
  {
    type: 'receive',
    title: 'Received',
    address: 'fRh8vK...Lk9Pzm',
    amount: '+12.50',
    time: '2m ago',
  },
  {
    type: 'send',
    title: 'Sent',
    address: 'fQa3xN...Jw2Rbc',
    amount: '-4.00',
    time: '1h ago',
  },
  {
    type: 'masternode_reward',
    title: 'Masternode reward',
    address: 'fMz9cP...Yq4Vtn',
    amount: '+0.18',
    time: '3h ago',
  },
  {
    type: 'receive',
    title: 'Received',
    address: 'fT7bWu...Hs1Kdx',
    amount: '+50.00',
    time: 'Yesterday',
  },
]

const TX_STYLE: Record<
  TxType,
  { bg: string; icon: IconName; iconColor: string; amountColor: string }
> = {
  receive: {
    bg: 'bg-primary/10',
    icon: 'arrow-down',
    iconColor: 'text-primary',
    amountColor: 'text-primary',
  },
  send: {
    bg: 'bg-red-500/10',
    icon: 'arrow-up',
    iconColor: 'text-red-400',
    amountColor: 'text-red-400',
  },
  masternode_reward: {
    bg: 'bg-blue-500/10',
    icon: 'server',
    iconColor: 'text-blue-400',
    amountColor: 'text-blue-400',
  },
}

export default function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="relative mx-auto w-[300px] sm:w-[340px]"
    >
      {/* Floating primary-tinted shadow under the phone */}
      <div
        aria-hidden
        className="absolute inset-x-6 -bottom-8 -z-10 h-24 rounded-[100%] bg-primary/30 opacity-40 blur-3xl"
      />

      {/* Phone bezel — separate from the screen so the bezel uses site tokens */}
      <div
        className="relative overflow-hidden rounded-[44px] border-[10px] border-foreground/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4),0_8px_30px_-10px_rgba(0,0,0,0.2)]"
        style={{ aspectRatio: '9/19.5' }}
      >
        {/* Screen — pinned to the dark FairCoin palette */}
        <div className="phone-mockup-dark relative h-full w-full bg-background text-foreground">
          {/* Dynamic island / notch */}
          <div className="absolute left-1/2 top-2 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

          {/* ---- iOS status bar ---- */}
          <div className="relative z-20 flex items-center justify-between px-6 pb-1 pt-3 text-[10px] font-semibold text-white">
            <span style={TEXT_SHADOW_LIGHT}>9:41</span>
            <span
              className="flex items-center gap-1"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
            >
              <SignalGlyph />
              <WifiGlyph />
              <BatteryGlyph />
            </span>
          </div>

          {/* ---- Hero image + gradient fade (matches real HERO_HEIGHT proportion) ---- */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[44%] overflow-hidden"
          >
            <img
              src={WALLET_HERO_URL}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            {/* Linear gradient — transparent from 40% → background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 40%, var(--color-background) 100%)',
              }}
            />
          </div>

          {/* ---- Top bar overlaid on hero: wallet name + sync pill ---- */}
          <div className="relative z-20 flex items-center justify-between px-5 pt-2 pb-3">
            <button
              type="button"
              className="flex items-center gap-0.5 text-white"
              style={TEXT_SHADOW_LIGHT}
            >
              <span className="text-[15px] font-semibold">Main wallet</span>
              <ChevronDownGlyph />
            </button>
            <div className="flex items-center gap-1 text-white" style={TEXT_SHADOW_LIGHT}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[11px]">Synced</span>
            </div>
          </div>

          {/* ---- Spacer so balance sits inside the gradient fade zone ---- */}
          <div className="relative z-10" style={{ height: '14%' }} />

          {/* ---- Balance (matches real BalanceDisplay size="lg") ---- */}
          <div className="relative z-10 flex flex-col items-center pb-6">
            <div className="flex items-baseline">
              <span
                className="mr-1 text-[34px] leading-none text-foreground"
                style={PHUDU_LIGHT}
              >
                {'\u229C'}
              </span>
              <span
                className="text-[42px] leading-none tracking-tight text-foreground"
                style={PHUDU_BLACK}
              >
                247.50
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {'\u2248'} $247.50 USD
            </p>
            <div className="mt-3 rounded-full bg-green-500/15 px-2 py-0.5">
              <span className="text-[11px] font-bold text-green-400">+2.0% today</span>
            </div>
          </div>

          {/* ---- Opaque content area covering the rest of the hero ---- */}
          <div className="relative z-10 bg-background">
            {/* ---- Action buttons (6 items, matches the real wallet's row) ---- */}
            <div className="flex justify-evenly gap-1 px-3 pb-5">
              {ACTION_ITEMS.map((action) => (
                <ActionButton key={action.label} icon={action.icon} label={action.label} />
              ))}
            </div>

            {/* ---- Divider ---- */}
            <div className="mx-5 h-px bg-border" />

            {/* ---- Activity header ---- */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <h3 className="text-[17px] font-semibold text-foreground" style={PHUDU_SEMIBOLD}>
                Activity
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {TX_ITEMS.length} transactions
              </span>
            </div>

            {/* ---- Transaction list ---- */}
            <div className="mx-5 mb-4 overflow-hidden rounded-2xl bg-surface">
              {TX_ITEMS.map((tx, idx) => (
                <div key={`${tx.type}-${idx}`}>
                  <TransactionRow tx={tx} />
                  {idx < TX_ITEMS.length - 1 && (
                    <div className="ml-[60px] h-px bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ---- Bottom tab bar ---- */}
          <div className="absolute inset-x-0 bottom-0 z-20 border-t border-border bg-surface px-3 pb-5 pt-2">
            <div className="flex items-center justify-between">
              {TAB_ITEMS.map((tab) => (
                <div key={tab.label} className="flex w-12 flex-col items-center gap-0.5">
                  <ActionIcon
                    name={tab.icon}
                    size={20}
                    className={tab.active ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <span
                    className={`text-[9px] font-medium ${
                      tab.active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ───────────────────────── Sub-components ───────────────────────── */

function ActionButton({ icon, label }: { icon: IconName; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
        <ActionIcon name={icon} size={18} className="text-primary" />
      </div>
      <span className="mt-1.5 text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

function TransactionRow({ tx }: { tx: TxItem }) {
  const style = TX_STYLE[tx.type]
  return (
    <div className="flex items-center px-3 py-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${style.bg} mr-3`}
      >
        <ActionIcon name={style.icon} size={18} className={style.iconColor} />
      </div>
      <div className="min-w-0 flex-1 pr-2">
        <p className="truncate text-[12px] font-medium text-foreground">{tx.title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{tx.address}</p>
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-[12px] font-semibold ${style.amountColor}`}>
          {tx.amount}
          <span className="ml-0.5 text-[10px] opacity-70">FAIR</span>
        </span>
        <span className="text-[9px] text-muted-foreground">{tx.time}</span>
      </div>
    </div>
  )
}

/* ───────────────────────── Icon glyphs ───────────────────────── */

function ActionIcon({
  name,
  size,
  className = '',
}: {
  name: IconName
  size: number
  className?: string
}) {
  const stroke = 2.2
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    className,
  }
  if (name === 'arrow-up') {
    return (
      <svg {...props}>
        <path
          d="M12 19V5M5 12l7-7 7 7"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (name === 'arrow-down') {
    return (
      <svg {...props}>
        <path
          d="M12 5v14M5 12l7 7 7-7"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (name === 'plus') {
    return (
      <svg {...props}>
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (name === 'pin') {
    return (
      <svg {...props}>
        <path
          d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth={stroke} />
      </svg>
    )
  }
  if (name === 'people') {
    return (
      <svg {...props}>
        <path
          d="M16 14a4 4 0 1 0-8 0m12 7v-1a4 4 0 0 0-3-3.87M4 21v-1a4 4 0 0 1 3-3.87M16 3.13a4 4 0 0 1 0 7.75M8 3.13a4 4 0 0 0 0 7.75"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (name === 'server') {
    return (
      <svg {...props}>
        <rect
          x="3"
          y="4"
          width="18"
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <rect
          x="3"
          y="13"
          width="18"
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <path d="M7 7.5h.01M7 16.5h.01" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'cog') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={stroke} />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 16.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (name === 'wallet') {
    return (
      <svg {...props}>
        <rect
          x="3"
          y="6"
          width="18"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <path
          d="M16 13h.01M21 10h-4a2 2 0 0 0 0 4h4"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return null
}

function ChevronDownGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SignalGlyph() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" className="text-white">
      <rect x="0" y="6" width="2" height="4" rx="0.4" />
      <rect x="3.5" y="4" width="2" height="6" rx="0.4" />
      <rect x="7" y="2" width="2" height="8" rx="0.4" />
      <rect x="10.5" y="0" width="2" height="10" rx="0.4" />
    </svg>
  )
}

function WifiGlyph() {
  return (
    <svg width="12" height="9" viewBox="0 0 12 9" fill="none" className="text-white">
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
    <svg width="22" height="11" viewBox="0 0 22 11" fill="none" className="text-white">
      <rect x="0.5" y="0.5" width="18" height="10" rx="2" stroke="currentColor" />
      <rect x="2" y="2" width="13" height="7" rx="1" fill="currentColor" />
      <rect x="20" y="3.5" width="1.5" height="4" rx="0.4" fill="currentColor" />
    </svg>
  )
}
