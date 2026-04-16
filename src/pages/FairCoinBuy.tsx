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

const SEO_TITLE = 'Buy FairCoin — fairco.in'
const SEO_DESCRIPTION =
  'Two ways to buy FAIR. Use FAIRWallet to pay USDC and receive native FAIR in your wallet, or swap USDC for WFAIR directly on Uniswap.'

const WFAIR_CONTRACT_ADDRESS = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3'
const UNISWAP_SWAP_URL = `https://app.uniswap.org/swap?outputCurrency=${WFAIR_CONTRACT_ADDRESS}&chain=base`
const UNISWAP_POOL_EXPLORE_URL =
  'https://app.uniswap.org/explore/tokens/base/0xf2853ceddf47a05fee0b4b24dff2925d59737fb3'
const FAIRWALLET_RELEASES_URL = 'https://github.com/FairCoinOfficial/FAIRWallet/releases'
const BRIDGE_SERVICE_URL = 'https://bridge.fairco.in'

const FAIRWALLET_STEPS: ReadonlyArray<{ index: string; title: string; description: string }> = [
  {
    index: '01',
    title: 'Open the Buy tab',
    description:
      'Install FAIRWallet on Android, iOS or desktop and open the Buy tab. The wallet generates the receive address for you.',
  },
  {
    index: '02',
    title: 'Pay in USDC',
    description:
      'Enter the FAIR amount, get a one-time USDC deposit address on Base, and send the payment from any wallet that holds USDC.',
  },
  {
    index: '03',
    title: 'Receive FAIR',
    description:
      'Once the USDC payment confirms, the bridge releases FAIR to your wallet automatically. No exchange account, no swaps.',
  },
]

export default function FairCoinBuyPage() {
  const onFairCoinHost = isFairCoinHost()
  const navbarBrand = useFairCoinNavbarBrand()
  const navItems = useFairCoinNavItems()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()
  const homeHref = useMemo(() => fc('/'), [])
  const bridgeHref = useMemo(() => fc('/bridge'), [])

  // Same dual-mount story as the other FairCoin pages — Bloom/CSS theme is
  // host-gated so /faircoin/buy on oxy.so reads as an Oxy subpage.
  const rootClass = onFairCoinHost
    ? 'faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'
    : 'flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'
  const mainClass = onFairCoinHost ? 'cursor-theme faircoin-theme flex-1' : 'cursor-theme flex-1'

  return (
    <div className={rootClass}>
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin/buy" />
      <Navbar
        brand={navbarBrand}
        navItems={navItems}
        ctaButtons={ctaButtons}
        hideAuth={onFairCoinHost}
        hideBanner={onFairCoinHost}
        hideLocalePicker={onFairCoinHost}
      />
      <main className={mainClass}>
        {/* ── Hero ── */}
        <section className="section section--headline">
          <div className="container">
            <div className="mx-auto max-w-prose-medium-wide text-center">
              <div className="mono-tag mb-v1 flex items-center justify-center gap-2 text-sm">
                <span>[</span> <span>Buy FairCoin</span> <span>]</span>
              </div>
              <h1 className="type-xl sm:type-2xl text-balance mb-v1 gradient-text">
                Two ways to get FAIR
              </h1>
              <p className="type-base text-muted-foreground text-pretty mb-v1 mx-auto max-w-2xl">
                Pay in USDC through FAIRWallet and receive native FAIR in your wallet, or swap
                directly for WFAIR on Uniswap if you already use a Web3 wallet on Base.
              </p>
              <div className="mx-auto mt-v1 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Beta — USDC payments are processed automatically. Card payment coming soon.
              </div>
            </div>
          </div>
        </section>

        {/* ── Two paths ── */}
        <section className="section">
          <div className="container">
            <div className="grid gap-g1 grid-cols-1 items-stretch lg:grid-cols-2">
              {/* FAIRWallet path */}
              <div className="card flex h-full flex-col gap-4 border border-primary/30 bg-surface">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono-tag text-xs text-primary">[ Recommended ]</span>
                </div>
                <h2 className="type-md text-foreground">Buy in FAIRWallet</h2>
                <p className="type-base text-muted-foreground">
                  The simplest path. Install FAIRWallet, open the Buy tab, enter how much FAIR you
                  want, pay USDC to the address it generates, and FAIR arrives in your wallet
                  automatically — no Web3 wallet, no swaps, no manual bridging.
                </p>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">
                      —
                    </span>
                    <span>Native FAIR delivered straight to your FairCoin wallet</span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">
                      —
                    </span>
                    <span>USDC payment on Base, supported in any Web3 wallet or exchange</span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">
                      —
                    </span>
                    <span>Card and bank-transfer payment in development</span>
                  </li>
                </ul>
                <div className="mt-auto flex flex-wrap gap-x-g1 gap-y-2 pt-2">
                  <Button
                    href={FAIRWALLET_RELEASES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download FAIRWallet
                  </Button>
                </div>
              </div>

              {/* Uniswap path */}
              <div className="card flex h-full flex-col gap-4 border border-border bg-surface">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono-tag text-xs text-muted-foreground">[ Advanced ]</span>
                </div>
                <h2 className="type-md text-foreground">Trade WFAIR on Uniswap</h2>
                <p className="type-base text-muted-foreground">
                  If you already use a Web3 wallet and hold USDC on Base, swap directly for WFAIR on
                  Uniswap v3. WFAIR is the 1:1 wrapped representation of FairCoin and is fully
                  redeemable for native FAIR through the bridge.
                </p>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">
                      —
                    </span>
                    <span>WFAIR/USDC pool on Base, 0.3% fee tier</span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">
                      —
                    </span>
                    <span>Settles in your Web3 wallet — instant access to DeFi</span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">
                      —
                    </span>
                    <span>Unwrap to native FAIR any time via the bridge</span>
                  </li>
                </ul>
                <div className="mt-auto flex flex-wrap gap-x-g1 gap-y-2 pt-2">
                  <Button href={UNISWAP_SWAP_URL} target="_blank" rel="noopener noreferrer">
                    Swap on Uniswap
                  </Button>
                  <Button
                    variant="ghost"
                    href={UNISWAP_POOL_EXPLORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View pool
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How FAIRWallet Buy works ── */}
        <section className="section">
          <div className="container">
            <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
              <span>[</span> <span>How FAIRWallet Buy works</span> <span>]</span>
            </div>
            <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">Three steps</h2>
            <div className="grid gap-g1 grid-cols-1 items-stretch md:grid-cols-3">
              {FAIRWALLET_STEPS.map((step) => (
                <div key={step.index} className="card flex h-full grow-1 flex-col">
                  <span className="mono-tag text-sm mb-v8/12 text-primary">{step.index}</span>
                  <h3 className="type-base md:type-md text-foreground">{step.title}</h3>
                  <p className="mt-2 text-pretty text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer note ── */}
        <section className="section section--headline">
          <div className="container">
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <p className="text-xs text-muted-foreground">
                The FAIRWallet Buy flow uses the WFAIR{' '}
                <a
                  href={BRIDGE_SERVICE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                >
                  bridge service
                </a>{' '}
                under the hood — USDC is custodied while WFAIR is minted and unwrapped to native
                FAIR before it reaches your wallet. See{' '}
                <Link
                  to={bridgeHref}
                  className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                >
                  the bridge page
                </Link>{' '}
                for the technical details.
              </p>
              <Link to={homeHref} className="inline-block text-sm underline text-muted-foreground">
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
