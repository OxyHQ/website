import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import { fc } from '../lib/faircoin-links'
import { isFairCoinHost } from '../lib/host'
import {
  useFairCoinFooterBrand,
  useFairCoinFooterColumns,
  useFairCoinFooterCopyright,
  useFairCoinFooterLegalLinks,
  useFairCoinNavCtaButtons,
  useFairCoinNavItems,
  useFairCoinNavbarBrand,
} from '../lib/faircoin-chrome'

const SEO_TITLE = 'FairCoin bridge (WFAIR on Base) — fairco.in'
const SEO_DESCRIPTION =
  'Technical reference for the WFAIR bridge — 1:1 wrapped FairCoin on Base. Contract, source, status, reserves, API endpoints.'

const CONTRACT_ADDRESS = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3'
const BASESCAN_URL = `https://basescan.org/address/${CONTRACT_ADDRESS}`
const EXPLORER_BRIDGE_URL = 'https://explorer.fairco.in/bridge'
const BRIDGE_SOURCE_URL = 'https://github.com/FairCoinOfficial/faircoin-bridge'
const BRIDGE_SERVICE_URL = 'https://bridge.fairco.in'
const BRIDGE_HEALTH_URL = `${BRIDGE_SERVICE_URL}/health`
const BRIDGE_RESERVES_URL = `${BRIDGE_SERVICE_URL}/api/bridge/reserves`
const UNISWAP_SWAP_URL = `https://app.uniswap.org/swap?outputCurrency=${CONTRACT_ADDRESS}&chain=base`

interface ApiEndpoint {
  method: string
  path: string
  description: string
  href?: string
}

const API_ENDPOINTS: readonly ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/health',
    description: 'Liveness probe. Returns service status — open in any browser.',
    href: BRIDGE_HEALTH_URL,
  },
  {
    method: 'GET',
    path: '/api/bridge/reserves',
    description:
      'Bridge reserve snapshot — total WFAIR supply on Base versus FAIR custodied on the FairCoin chain. Returns 503 until the first snapshot is taken.',
    href: BRIDGE_RESERVES_URL,
  },
  {
    method: 'POST',
    path: '/api/bridge/deposit/intent',
    description:
      'Create a deposit intent — pay native FAIR to the returned address, receive WFAIR on Base at the address you supplied.',
  },
  {
    method: 'POST',
    path: '/api/buy/quote',
    description:
      'Get a USDC→FAIR quote. Used by FAIRWallet to price the Buy flow before generating a payment address.',
  },
  {
    method: 'GET',
    path: '/api/buy/status/:id',
    description: 'Poll the status of a Buy order — pending, paid, releasing, delivered.',
  },
]

export default function FairCoinBridgePage() {
  const onFairCoinHost = isFairCoinHost()
  const navbarBrand = useFairCoinNavbarBrand()
  const navItems = useFairCoinNavItems()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()
  const homeHref = useMemo(() => fc('/'), [])
  const buyHref = useMemo(() => fc('/buy'), [])

  // On fairco.in we apply the FairCoin Bloom theme via `.faircoin-theme`. On
  // oxy.so the page reads as an Oxy subpage, so the wrapper is dropped and
  // the active Oxy theme variables stay in effect.
  const rootClass = onFairCoinHost
    ? 'faircoin-surface faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'
    : 'faircoin-surface flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'
  const mainClass = onFairCoinHost ? 'cursor-theme faircoin-theme flex-1' : 'cursor-theme flex-1'

  return (
    <div className={rootClass}>
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin/bridge" />
      <Navbar
        brand={navbarBrand}
        navItems={navItems}
        ctaButtons={ctaButtons}
        hideAuth={onFairCoinHost}
        hideBanner={onFairCoinHost}
        hideLocalePicker={onFairCoinHost}
      />
      <main className={mainClass}>
        <section className="section section--headline">
          <div className="container">
            <div className="mx-auto max-w-prose-medium-wide text-center">
              <div className="mono-tag mb-v1 flex items-center justify-center gap-2 text-sm">
                <span>[</span> <span>Advanced</span> <span>]</span>
              </div>
              <h1 className="type-xl sm:type-2xl text-balance mb-v1 gradient-text">
                The WFAIR bridge
              </h1>
              <p className="type-base text-muted-foreground text-pretty mb-v1 mx-auto max-w-2xl">
                The WFAIR contract is live on Base mainnet and the bridge service is running at{' '}
                <a
                  href={BRIDGE_SERVICE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                >
                  bridge.fairco.in
                </a>
                . This page is a technical reference for integrators. If you just want FAIR, use{' '}
                <Link to={buyHref} className="underline">
                  Buy FairCoin
                </Link>{' '}
                — it uses this bridge under the hood.
              </p>
              <div className="mx-auto mt-v1 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Live now — bridge service deployed, contract verified
              </div>
              <div className="mt-v1 flex justify-center gap-x-g1 items-center flex-wrap">
                <Button href={UNISWAP_SWAP_URL} target="_blank" rel="noopener noreferrer">
                  Trade WFAIR on Uniswap
                </Button>
                <Button
                  variant="outline"
                  href={BASESCAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contract on Basescan
                </Button>
                <Button
                  variant="ghost"
                  href={BRIDGE_HEALTH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Service health
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="mx-auto max-w-prose-medium-wide space-y-12">
              <div>
                <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
                  <span>[</span> <span>What's live</span> <span>]</span>
                </div>
                <h2 className="type-md-lg mb-v1">Status</h2>
                <ul className="type-base text-muted-foreground flex flex-col gap-2">
                  <li>
                    <strong className="text-foreground">WFAIR contract.</strong> Verified on Base
                    mainnet at{' '}
                    <a
                      href={BASESCAN_URL}
                      className="font-mono text-xs underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {CONTRACT_ADDRESS}
                    </a>
                    .
                  </li>
                  <li>
                    <strong className="text-foreground">Uniswap v3 pool.</strong> WFAIR/USDC, 0.3%
                    fee tier, with an initial seed in the $0.50–$2.00 range.{' '}
                    <a
                      href={UNISWAP_SWAP_URL}
                      className="underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Trade now
                    </a>
                    .
                  </li>
                  <li>
                    <strong className="text-foreground">Bridge service.</strong> Deployed on a
                    DigitalOcean droplet at{' '}
                    <a
                      href={BRIDGE_SERVICE_URL}
                      className="underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      bridge.fairco.in
                    </a>{' '}
                    with custody keys configured and workers running.
                  </li>
                  <li>
                    <strong className="text-foreground">FAIR-side delivery.</strong> The end-to-end
                    Buy flow is in beta — USDC payments are processed automatically and queue for
                    FAIR release. Final on-chain delivery to your FairCoin address depends on the
                    full-node install completing on the bridge host. Until then, FAIR delivery may
                    be delayed.
                  </li>
                </ul>
              </div>

              <div>
                <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
                  <span>[</span> <span>API</span> <span>]</span>
                </div>
                <h2 className="type-md-lg mb-v1">Public endpoints</h2>
                <p className="type-base text-muted-foreground mb-v1">
                  The bridge service exposes a small HTTP API. All endpoints are served from{' '}
                  <span className="font-mono text-foreground">{BRIDGE_SERVICE_URL}</span>.
                </p>
                <div className="flex flex-col gap-2">
                  {API_ENDPOINTS.map((endpoint) => (
                    <div
                      key={`${endpoint.method} ${endpoint.path}`}
                      className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                          {endpoint.method}
                        </span>
                        {endpoint.href ? (
                          <a
                            href={endpoint.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground underline"
                          >
                            {endpoint.path}
                          </a>
                        ) : (
                          <span className="text-foreground">{endpoint.path}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
                  <span>[</span> <span>Mint flow</span> <span>]</span>
                </div>
                <h2 className="type-md-lg mb-v1">Wrap FAIR → WFAIR</h2>
                <p className="type-base text-muted-foreground mb-v1">
                  Integrators and advanced users can wrap native FAIR into WFAIR by creating a
                  deposit intent. The flow is: call{' '}
                  <span className="font-mono text-foreground">POST /api/bridge/deposit/intent</span>{' '}
                  with your destination Base address and the amount of FAIR. The service returns a
                  one-time custody address on the FairCoin chain — pay the FAIR there, and after the
                  required confirmations the bridge mints WFAIR to your Base address.
                </p>
                <p className="type-base text-muted-foreground">
                  For end-users, this is wrapped behind FAIRWallet&rsquo;s Buy tab, where the input
                  side is USDC instead of native FAIR. See the{' '}
                  <Link to={buyHref} className="underline">
                    Buy page
                  </Link>{' '}
                  for the easy path.
                </p>
              </div>

              <div>
                <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
                  <span>[</span> <span>References</span> <span>]</span>
                </div>
                <h2 className="type-md-lg mb-v1">Sources and tools</h2>
                <ul className="type-base text-muted-foreground flex flex-col gap-2">
                  <li>
                    Source code at{' '}
                    <a
                      href={BRIDGE_SOURCE_URL}
                      className="underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      FairCoinOfficial/faircoin-bridge
                    </a>
                    .
                  </li>
                  <li>
                    Live peg, supply and paused state on the{' '}
                    <a
                      href={EXPLORER_BRIDGE_URL}
                      className="underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      FairCoin Explorer
                    </a>
                    .
                  </li>
                  <li>
                    Contract on{' '}
                    <a
                      href={BASESCAN_URL}
                      className="underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Basescan
                    </a>
                    .
                  </li>
                  <li>
                    Import WFAIR into wallets via{' '}
                    <a href="/tokenlist.json" className="underline">
                      /tokenlist.json
                    </a>
                    .
                  </li>
                </ul>
              </div>

              <Link to={homeHref} className="type-base inline-block underline text-muted-foreground">
                ← Back to FairCoin
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer
        brand={footerBrand}
        columns={footerColumns}
        socialLinks={onFairCoinHost ? [] : undefined}
        legalLinks={footerLegalLinks}
        copyright={footerCopyright}
      />
    </div>
  )
}
