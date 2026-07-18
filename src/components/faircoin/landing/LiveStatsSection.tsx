import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { formatUnits } from 'viem'
import { useReadContract } from 'wagmi'
import { base } from 'wagmi/chains'
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Clock,
  Cpu,
  Database,
  DollarSign,
  Droplets,
  Hash,
  Layers,
  ShieldCheck,
  Server,
} from 'lucide-react'
import AnimatedNumber from './AnimatedNumber'
import { useFaircoinNetworkStats, useUniswapPoolStats } from '../../../hooks/use-faircoin-network-stats'
import { useBridgeReserves } from '../../../hooks/use-faircoin-bridge-stats'
import { useWallClockSecond } from '../buy/useWallClockSecond'
import { WFAIR_ABI, WFAIR_ADDRESS, WFAIR_DECIMALS } from '../../../lib/wfair-contract'

const FAIR_EXPLORER_BASE = 'https://explorer.fairco.in'
const BASESCAN_BASE = 'https://basescan.org'
const UNISWAP_POOL_EXPLORE_URL =
  'https://app.uniswap.org/explore/tokens/base/0xf2853ceddf47a05fee0b4b24dff2925d59737fb3'

/**
 * "Network at a glance" — three rails of live tiles powered by the FairCoin
 * Explorer REST API, on-chain reads via wagmi (Base mainnet WFAIR contract +
 * Uniswap pool), and the bridge `/api/bridge/reserves` snapshot.
 *
 * Tiles refresh on the React Query polling cadence (15s for chain tip, 30s
 * for pool stats / reserves). Numbers smoothly count between values via
 * `AnimatedNumber` so updates feel alive rather than jarring.
 */
export default function LiveStatsSection() {
  const networkQuery = useFaircoinNetworkStats()
  const poolQuery = useUniswapPoolStats()
  const reservesQuery = useBridgeReserves()
  const supplyQuery = useReadContract({
    address: WFAIR_ADDRESS,
    abi: WFAIR_ABI,
    functionName: 'totalSupply',
    chainId: base.id,
    query: { refetchInterval: 30_000 },
  })

  const stats = networkQuery.data
  const lastBlockTime = stats?.lastBlock.time
  const explorerLastBlockHref = stats?.lastBlock.hash
    ? `${FAIR_EXPLORER_BASE}/block/${stats.lastBlock.hash}`
    : `${FAIR_EXPLORER_BASE}/blocks`

  // Real-time "X seconds ago" for last block — derived from the wall-clock
  // tick so the label updates without a re-fetch.
  const nowSeconds = useWallClockSecond()
  const lastBlockAgoLabel = useMemo(() => {
    if (!lastBlockTime) return null
    const ago = Math.max(0, nowSeconds - lastBlockTime)
    return formatRelativeSeconds(ago)
  }, [nowSeconds, lastBlockTime])

  const wfairSupplyOnBase = useMemo<number | null>(() => {
    if (typeof supplyQuery.data === 'bigint') {
      return Number(formatUnits(supplyQuery.data, WFAIR_DECIMALS))
    }
    if (reservesQuery.data) {
      try {
        return Number(formatUnits(BigInt(reservesQuery.data.wfairSupplyWei), WFAIR_DECIMALS))
      } catch {
        return null
      }
    }
    return null
  }, [supplyQuery.data, reservesQuery.data])

  const fairCustody = useMemo<number | null>(() => {
    if (!reservesQuery.data) return null
    try {
      return Number(BigInt(reservesQuery.data.fairCustodySats)) / 1e8
    } catch {
      return null
    }
  }, [reservesQuery.data])

  const peg = reservesQuery.data?.pegHealthy ?? null
  const reservesSnapshot = reservesQuery.data?.snapshotAt
    ? new Date(reservesQuery.data.snapshotAt)
    : null

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-12 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-20">
        {/* Section header */}
        <div className="flex flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Live network · Updates every 15s
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-5 text-balance text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]"
          >
            Network at a glance
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="mt-3 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            Live data straight from the FairCoin chain, the Base WFAIR contract
            and the bridge custody snapshot. No CMS, no caching. What you see
            is what is on-chain right now.
          </motion.p>
        </div>

        {/* Native chain rail */}
        <RailHeader
          title="Native FairCoin chain"
          hint="Source: explorer.fairco.in"
          dotClass="bg-primary"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile
            icon={Layers}
            eyebrow="Latest block"
            value={stats?.blockHeight ?? null}
            decimals={0}
            href={explorerLastBlockHref}
            isLoading={networkQuery.isLoading}
          />
          <StatTile
            icon={Clock}
            eyebrow="Last block age"
            valueLabel={lastBlockAgoLabel}
            isLoading={networkQuery.isLoading}
          />
          <StatTile
            icon={Server}
            eyebrow="Active masternodes"
            value={stats?.masternodeCount ?? null}
            decimals={0}
            isLoading={networkQuery.isLoading}
          />
          <StatTile
            icon={Cpu}
            eyebrow={`Network hashrate (${stats?.phase ?? 'PoW'})`}
            value={stats?.hashrate ?? null}
            decimals={0}
            valueFormatter={formatHashrate}
            isLoading={networkQuery.isLoading}
          />
          <StatTile
            icon={Boxes}
            eyebrow="Circulating supply"
            value={stats?.circulatingSupply ?? null}
            decimals={0}
            suffix="FAIR"
            isLoading={networkQuery.isLoading}
          />
          <StatTile
            icon={Hash}
            eyebrow="Total transactions"
            value={stats?.totalTransactions ?? null}
            decimals={0}
            isLoading={networkQuery.isLoading}
          />
        </div>

        {/* WFAIR / Base rail */}
        <RailHeader
          title="WFAIR on Base"
          hint="Source: on-chain via viem"
          dotClass="bg-blue-500"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile
            icon={Database}
            eyebrow="WFAIR supply on Base"
            value={wfairSupplyOnBase}
            decimals={2}
            suffix="WFAIR"
            href={`${BASESCAN_BASE}/address/${WFAIR_ADDRESS}`}
            isLoading={supplyQuery.isLoading && reservesQuery.isLoading}
          />
          <StatTile
            icon={DollarSign}
            eyebrow="WFAIR price"
            value={poolQuery.data?.wfairPriceUsdc ?? null}
            decimals={4}
            prefix="$"
            href={UNISWAP_POOL_EXPLORE_URL}
            isLoading={poolQuery.isLoading}
          />
          <StatTile
            icon={Droplets}
            eyebrow="Uniswap pool TVL"
            value={poolQuery.data?.tvlUsdc ?? null}
            decimals={2}
            prefix="$"
            href={UNISWAP_POOL_EXPLORE_URL}
            isLoading={poolQuery.isLoading}
          />
        </div>

        {/* Bridge rail */}
        <RailHeader
          title="Bridge"
          hint="Source: bridge.fairco.in"
          dotClass="bg-emerald-500"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile
            icon={ShieldCheck}
            eyebrow="FAIR in bridge custody"
            value={fairCustody}
            decimals={2}
            suffix="FAIR"
            isLoading={reservesQuery.isLoading}
          />
          <StatTile
            icon={Database}
            eyebrow="WFAIR supply (snapshot)"
            value={wfairSupplyOnBase}
            decimals={2}
            suffix="WFAIR"
            isLoading={reservesQuery.isLoading && supplyQuery.isLoading}
          />
          <PegHealthTile
            healthy={peg}
            snapshotAt={reservesSnapshot}
            isLoading={reservesQuery.isLoading}
          />
        </div>
      </div>
    </section>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────

function RailHeader({
  title,
  hint,
  dotClass,
}: {
  title: string
  hint: string
  dotClass: string
}) {
  return (
    <div className="mt-12 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </h3>
      </div>
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {hint}
      </span>
    </div>
  )
}

interface StatTileProps {
  icon: typeof Layers
  eyebrow: string
  /** Numeric value rendered via AnimatedNumber. */
  value?: number | null
  /** Pre-formatted text rendered instead of a numeric value. */
  valueLabel?: string | null
  decimals?: number
  prefix?: string
  suffix?: string
  /** Pre-format the number entirely (e.g. for hashrate units). */
  valueFormatter?: (n: number) => string
  href?: string
  isLoading?: boolean
}

function StatTile({
  icon: Icon,
  eyebrow,
  value,
  valueLabel,
  decimals = 0,
  prefix,
  suffix,
  valueFormatter,
  href,
  isLoading = false,
}: StatTileProps) {
  // Subtle pulse highlight whenever the value changes, so users notice updates.
  const valueKey = value ?? valueLabel ?? '—'
  const [lastSig, setLastSig] = useState(valueKey)
  const [pulse, setPulse] = useState(false)
  if (lastSig !== valueKey && !isLoading && (value !== null || valueLabel !== null)) {
    setLastSig(valueKey)
    setPulse(true)
    window.setTimeout(() => setPulse(false), 700)
  }

  const inner = (
    <div className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-popover/60 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-popover">
      {/* Hover-only glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--primary) 15%, transparent) 0%, transparent 60%)',
        }}
      />
      {/* Update pulse — fades from primary tint */}
      <span
        aria-hidden
        className={[
          'pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-primary/20 transition-opacity duration-700',
          pulse ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
      <div className="flex flex-1 items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </span>
          <span className="font-mono text-xl font-semibold leading-tight text-foreground sm:text-[22px]">
            {isLoading ? (
              <Shimmer width="6rem" />
            ) : valueLabel ? (
              valueLabel
            ) : valueFormatter && typeof value === 'number' ? (
              <span>
                {valueFormatter(value)}
                {suffix ? (
                  <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                    {suffix}
                  </span>
                ) : null}
              </span>
            ) : (
              <AnimatedNumber
                value={value ?? null}
                decimals={decimals}
                prefix={prefix}
                suffix={suffix}
              />
            )}
          </span>
        </div>
      </div>
      {href ? (
        <ArrowUpRight
          aria-hidden
          className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
        />
      ) : null}
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }
  return inner
}

interface PegHealthTileProps {
  healthy: boolean | null
  snapshotAt: Date | null
  isLoading: boolean
}

function PegHealthTile({ healthy, snapshotAt, isLoading }: PegHealthTileProps) {
  const status: 'healthy' | 'unknown' | 'attention' = isLoading
    ? 'unknown'
    : healthy === true
      ? 'healthy'
      : healthy === false
        ? 'attention'
        : 'unknown'
  const label =
    status === 'healthy'
      ? 'Fully backed'
      : status === 'attention'
        ? 'Attention'
        : 'Awaiting snapshot'
  const dotClass =
    status === 'healthy'
      ? 'bg-emerald-500'
      : status === 'attention'
        ? 'bg-destructive'
        : 'bg-muted-foreground/40'
  const valueColor =
    status === 'healthy'
      ? 'text-emerald-600 dark:text-emerald-400'
      : status === 'attention'
        ? 'text-destructive'
        : 'text-muted-foreground'

  return (
    <div className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-popover/60 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-popover">
      <div className="flex flex-1 items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Activity className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Peg health
          </span>
          <span className={`font-mono text-xl font-semibold leading-tight sm:text-[22px] ${valueColor}`}>
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {status === 'healthy' ? (
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotClass}`} />
                ) : null}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
              </span>
              {label}
            </span>
          </span>
          {snapshotAt ? (
            <span className="text-xs text-muted-foreground">
              Snapshot{' '}
              {snapshotAt.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Shimmer({ width = '4rem' }: { width?: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-6 animate-pulse rounded-md bg-muted align-middle"
      style={{ width }}
    />
  )
}

function formatRelativeSeconds(seconds: number): string {
  if (seconds < 1) return 'just now'
  if (seconds < 60) return `${Math.round(seconds)}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatHashrate(value: number): string {
  if (value === 0) return '0 H/s'
  const units = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s']
  let v = value
  let i = 0
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  const decimals = v >= 100 ? 0 : v >= 10 ? 1 : 2
  return `${v.toFixed(decimals)} ${units[i]}`
}
