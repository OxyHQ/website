import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { fc } from '../../../lib/faircoin-links'
import BridgeFlowVisual from '../landing/BridgeFlowVisual'
import LiveBridgeSection from '../landing/LiveBridgeSection'

const CONTRACT_ADDRESS = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3'
const BASESCAN_URL = `https://basescan.org/address/${CONTRACT_ADDRESS}`
const EXPLORER_BRIDGE_URL = 'https://explorer.fairco.in/bridge'
const BRIDGE_SOURCE_URL = 'https://github.com/FairCoinOfficial/faircoin-bridge'
const BRIDGE_SERVICE_URL = 'https://bridge.fairco.in'
const BRIDGE_HEALTH_URL = `${BRIDGE_SERVICE_URL}/health`
const BRIDGE_RESERVES_URL = `${BRIDGE_SERVICE_URL}/api/bridge/reserves`
const UNISWAP_SWAP_URL = `https://app.uniswap.org/swap?outputCurrency=${CONTRACT_ADDRESS}&chain=base`

type Method = 'GET' | 'POST'

interface ApiEndpoint {
  method: Method
  path: string
  description: string
  href?: string
  exampleCurl?: string
}

const API_ENDPOINTS: readonly ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/health',
    description: 'Liveness probe. Returns service status. Open in any browser.',
    href: BRIDGE_HEALTH_URL,
    exampleCurl: `curl ${BRIDGE_HEALTH_URL}`,
  },
  {
    method: 'GET',
    path: '/api/bridge/reserves',
    description:
      'Bridge reserve snapshot: total WFAIR supply on Base versus FAIR custodied on the FairCoin chain. 503 until first snapshot.',
    href: BRIDGE_RESERVES_URL,
    exampleCurl: `curl ${BRIDGE_RESERVES_URL}`,
  },
  {
    method: 'POST',
    path: '/api/bridge/deposit/intent',
    description:
      'Create a deposit intent: pay native FAIR to the returned address, receive WFAIR on Base.',
    exampleCurl: `curl -X POST ${BRIDGE_SERVICE_URL}/api/bridge/deposit/intent \\
  -H 'content-type: application/json' \\
  -d '{"baseAddress":"0x...","fairAmountSats":"1000000000"}'`,
  },
  {
    method: 'POST',
    path: '/api/buy/quote',
    description:
      'Get a USDC→FAIR quote. Used by the web Buy flow to price an order before generating a payment address.',
    exampleCurl: `curl -X POST ${BRIDGE_SERVICE_URL}/api/buy/quote \\
  -H 'content-type: application/json' \\
  -d '{"fairAmount":"10","paymentCurrency":"USDC_BASE","fairDestinationAddress":"F..."}'`,
  },
  {
    method: 'GET',
    path: '/api/buy/status/:id',
    description: 'Poll the status of a Buy order: pending, paid, releasing, delivered.',
    exampleCurl: `curl ${BRIDGE_SERVICE_URL}/api/buy/status/<order-id>`,
  },
  {
    method: 'GET',
    path: '/api/bridge/withdrawal/status/:burnTxHash',
    description:
      'Poll the status of a redemption (WFAIR burn). Used by the Unwrap flow after the user signs the burn.',
    exampleCurl: `curl ${BRIDGE_SERVICE_URL}/api/bridge/withdrawal/status/<base-tx-hash>`,
  },
]

/**
 * Polished bridge page content. Replaces the text-heavy reference page with:
 *   - Hero with status pill + flow visual
 *   - Live "Network at a glance" tiles (reuses LiveBridgeSection)
 *   - API browser with method-coloured chips + copy curl
 *   - Source / explorer / token list reference cards
 */
export default function BridgeContent() {
  return (
    <div className="bg-background text-foreground">
      <BridgeHero />
      <LiveBridgeSection />
      <BridgeFlowSection />
      <ApiBrowser />
      <ReferenceLinks />
    </div>
  )
}

function BridgeHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-primary/[0.10] via-primary/[0.03] to-transparent" />
        <div className="absolute right-[-15%] top-32 h-[480px] w-[480px] rounded-full bg-primary/[0.08] blur-3xl" />
      </div>
      <div className="container mx-auto px-4 pb-12 pt-16 sm:pb-20 sm:pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Live · Bridge service deployed
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="mt-6 text-balance text-[40px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[56px] lg:text-[64px]"
          >
            <span className="bg-gradient-to-br from-foreground via-foreground/85 to-primary bg-clip-text text-transparent">
              The WFAIR bridge
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Wrap native FAIR into WFAIR on Base, or unwrap WFAIR back to native
            FAIR. Open source, fully redeemable, fully verified. This is the
            technical reference for integrators. If you just want FAIR, use{' '}
            <Link to={fc('/buy')} className="text-foreground underline-offset-4 hover:underline">
              Buy FairCoin
            </Link>
            .
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          >
            <a
              href={UNISWAP_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px] shadow-primary/40 transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
            >
              Trade WFAIR
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              to={fc('/unwrap')}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-background/60 px-6 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-background"
            >
              Redeem WFAIR
            </Link>
            <a
              href={BASESCAN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              Contract on Basescan
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function BridgeFlowSection() {
  return (
    <section className="relative isolate">
      <div className="container mx-auto px-4 py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              How it works
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-5 text-balance text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]"
            >
              Burn on one side, mint on the other
            </motion.h2>
            <ul className="mt-5 flex flex-col gap-3 text-base text-muted-foreground">
              {[
                'Wrap: pay native FAIR to a one-time custody address. Once confirmations clear, the bridge mints WFAIR on Base to the address you supplied.',
                'Unwrap: call WFAIR.bridgeBurn from your wallet. The bridge watcher indexes the burn, confirms it, and signs a FAIR payout to the destination.',
                'Reserves are observable on /api/bridge/reserves. Peg health is published live on this page.',
              ].map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-popover/50 p-4 backdrop-blur-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <BridgeFlowVisual />
        </div>
      </div>
    </section>
  )
}

function ApiBrowser() {
  return (
    <section className="relative isolate">
      <div className="container mx-auto px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            HTTP API
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-5 text-balance text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]"
          >
            Public endpoints
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="mt-5 text-pretty text-base text-muted-foreground"
          >
            The bridge service exposes a small HTTP API. All endpoints are
            served from{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
              {BRIDGE_SERVICE_URL}
            </code>
            .
          </motion.p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-3">
          {API_ENDPOINTS.map((endpoint, idx) => (
            <ApiCard key={`${endpoint.method} ${endpoint.path}`} endpoint={endpoint} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ApiCard({ endpoint, idx }: { endpoint: ApiEndpoint; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: idx * 0.04 }}
      className="group overflow-hidden rounded-2xl border border-border bg-popover/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40"
    >
      <div className="flex flex-col gap-1.5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <MethodChip method={endpoint.method} />
          {endpoint.href ? (
            <a
              href={endpoint.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {endpoint.path}
              <ExternalLink aria-hidden className="h-3 w-3 text-muted-foreground" />
            </a>
          ) : (
            <span className="font-mono text-sm font-medium text-foreground">{endpoint.path}</span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{endpoint.description}</p>
      </div>
      {endpoint.exampleCurl ? (
        <div className="border-t border-border/60 bg-background/40">
          <CurlBlock value={endpoint.exampleCurl} />
        </div>
      ) : null}
    </motion.div>
  )
}

function MethodChip({ method }: { method: Method }) {
  const tone =
    method === 'GET'
      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : 'border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300'
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md border px-2 font-mono text-[11px] font-bold tracking-wider ${tone}`}
    >
      {method}
    </span>
  )
}

function CurlBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }, [value])
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-3">
      <pre className="flex-1 overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground/80">
        <code>{value}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy curl command"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function ReferenceLinks() {
  const items = useMemo(
    () => [
      {
        title: 'Bridge source',
        description: 'Full source code for the bridge service and contracts.',
        href: BRIDGE_SOURCE_URL,
        icon: GithubMark,
      },
      {
        title: 'WFAIR contract',
        description: 'Verified on Base mainnet.',
        href: BASESCAN_URL,
        icon: Activity,
      },
      {
        title: 'Explorer bridge view',
        description: 'Live peg, supply and paused state on the FairCoin Explorer.',
        href: EXPLORER_BRIDGE_URL,
        icon: Activity,
      },
      {
        title: 'Token list',
        description: 'Import WFAIR into wallets via the standard token list.',
        href: '/tokenlist.json',
        icon: Activity,
      },
    ],
    [],
  )
  return (
    <section className="relative isolate">
      <div className="container mx-auto max-w-5xl px-4 pb-24 pt-12">
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-popover/60 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </a>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          <Link
            to={fc('/')}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to FairCoin
          </Link>
        </p>
      </div>
    </section>
  )
}

function GithubMark({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}
