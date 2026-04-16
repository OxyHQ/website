import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Activity, ShieldCheck, Coins } from 'lucide-react'
import { formatUnits } from 'viem'
import { useReadContract } from 'wagmi'
import { base } from 'wagmi/chains'
import { fc } from '../../../lib/faircoin-links'
import { useBridgeReserves } from '../../../hooks/use-faircoin-bridge-stats'
import { WFAIR_ABI, WFAIR_ADDRESS, WFAIR_DECIMALS } from '../../../lib/wfair-contract'
import BridgeFlowVisual from './BridgeFlowVisual'

const WFAIR_BASESCAN_URL = `https://basescan.org/address/${WFAIR_ADDRESS}`
const UNISWAP_SWAP_URL = `https://app.uniswap.org/swap?outputCurrency=${WFAIR_ADDRESS}&chain=base`

/**
 * Live WFAIR + bridge dashboard. Fetches the on-chain WFAIR supply via wagmi
 * and pairs it with the bridge reserves snapshot so users can see at a glance
 * that the peg is fully backed.
 */
export default function LiveBridgeSection() {
  const reservesQuery = useBridgeReserves()
  const supplyQuery = useReadContract({
    address: WFAIR_ADDRESS,
    abi: WFAIR_ABI,
    functionName: 'totalSupply',
    chainId: base.id,
    query: { refetchInterval: 30_000 },
  })

  const wfairSupply = useMemo(() => {
    if (typeof supplyQuery.data === 'bigint') {
      return formatNumber(formatUnits(supplyQuery.data, WFAIR_DECIMALS), 4)
    }
    if (reservesQuery.data) {
      try {
        return formatNumber(formatUnits(BigInt(reservesQuery.data.wfairSupplyWei), WFAIR_DECIMALS), 4)
      } catch {
        return '—'
      }
    }
    return '—'
  }, [supplyQuery.data, reservesQuery.data])

  const fairCustody = useMemo(() => {
    if (!reservesQuery.data) return '—'
    try {
      const sats = BigInt(reservesQuery.data.fairCustodySats)
      const fair = Number(sats) / 1e8
      return formatNumber(fair.toString(), 4)
    } catch {
      return '—'
    }
  }, [reservesQuery.data])

  const pegHealthy = reservesQuery.data?.pegHealthy ?? null
  const snapshotAt = reservesQuery.data?.snapshotAt
    ? new Date(reservesQuery.data.snapshotAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto px-4 py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          {/* Left: copy */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              WFAIR · Live on Base
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-5 text-balance text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]"
            >
              The bridge to{' '}
              <span className="bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                Ethereum DeFi
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
              className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground"
            >
              WFAIR is a 1:1 wrapped representation of FAIR on Base. Trade it in
              Uniswap, hold it in any EVM wallet, redeem it back to native FAIR
              any time. Fully backed by FairCoin chain reserves.
            </motion.p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={UNISWAP_SWAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-8px] shadow-primary/40 transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
              >
                Trade WFAIR
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link
                to={fc('/unwrap')}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background/60 px-5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/50"
              >
                Redeem WFAIR
              </Link>
              <Link
                to={fc('/bridge')}
                className="inline-flex h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                How the bridge works →
              </Link>
            </div>
          </div>

          {/* Right: visual + live tiles */}
          <div className="flex flex-col gap-6">
            <BridgeFlowVisual />
            <div className="grid gap-3">
              <StatTile
                icon={Coins}
                label="WFAIR supply on Base"
                value={wfairSupply}
                suffix="WFAIR"
                isLoading={supplyQuery.isLoading && reservesQuery.isLoading}
                href={WFAIR_BASESCAN_URL}
              />
              <StatTile
                icon={ShieldCheck}
                label="FAIR in bridge custody"
                value={fairCustody}
                suffix="FAIR"
                isLoading={reservesQuery.isLoading}
              />
              <PegHealthTile pegHealthy={pegHealthy} snapshotAt={snapshotAt} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface StatTileProps {
  icon: typeof Coins
  label: string
  value: string
  suffix: string
  isLoading: boolean
  href?: string
}

function StatTile({ icon: Icon, label, value, suffix, isLoading, href }: StatTileProps) {
  const inner = (
    <div className="group relative flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-background">
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </span>
          <span className="flex items-baseline gap-2 font-semibold text-foreground">
            <span className="text-2xl tabular-nums sm:text-[28px]">
              {isLoading ? <Shimmer width="6rem" /> : value}
            </span>
            <span className="text-xs font-medium text-muted-foreground">{suffix}</span>
          </span>
        </div>
      </div>
      {href ? (
        <ArrowRight
          aria-hidden
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
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

function PegHealthTile({
  pegHealthy,
  snapshotAt,
}: {
  pegHealthy: boolean | null
  snapshotAt: string | null
}) {
  const status: 'healthy' | 'unknown' | 'attention' =
    pegHealthy === true ? 'healthy' : pegHealthy === false ? 'attention' : 'unknown'
  const label =
    status === 'healthy'
      ? 'Peg fully backed'
      : status === 'attention'
        ? 'Peg attention required'
        : 'Awaiting first snapshot'
  const dotClass =
    status === 'healthy'
      ? 'bg-emerald-500'
      : status === 'attention'
        ? 'bg-destructive'
        : 'bg-muted-foreground/40'
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Activity className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Peg health
          </span>
          <span className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="relative flex h-2 w-2">
              {status === 'healthy' ? (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotClass}`} />
              ) : null}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
            </span>
            {label}
          </span>
          {snapshotAt ? (
            <span className="text-[11px] text-muted-foreground">
              Snapshot {snapshotAt}
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
      className="inline-block h-7 animate-pulse rounded-md bg-muted align-middle"
      style={{ width }}
    />
  )
}

function formatNumber(raw: string, maxFractionDigits: number): string {
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return raw
  if (numeric === 0) return '0'
  return numeric.toLocaleString(undefined, {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  })
}
