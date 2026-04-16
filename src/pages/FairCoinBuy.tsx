import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import BuyForm from '../components/faircoin/buy/BuyForm'
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
  'Buy native FAIR with USDC on Base. Pay from any wallet, the bridge swaps and delivers FAIR straight to your FairCoin address.'

const BRIDGE_SERVICE_URL = 'https://bridge.fairco.in'
const FAIRWALLET_RELEASES_URL = 'https://github.com/FairCoinOfficial/FAIRWallet/releases'
const WFAIR_CONTRACT_ADDRESS = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3'
const UNISWAP_SWAP_URL = `https://app.uniswap.org/swap?outputCurrency=${WFAIR_CONTRACT_ADDRESS}&chain=base`

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
                FAIR delivered to your wallet
              </h1>
              <p className="type-base text-muted-foreground text-pretty mb-v1 mx-auto max-w-2xl">
                Pay in USDC on Base from any wallet. The bridge swaps your USDC
                for WFAIR, burns it, and releases native FAIR straight to the
                FairCoin address you provide. End-to-end in about two minutes,
                no exchange account required.
              </p>
              <div className="mx-auto mt-v1 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Beta — USDC payments only. Card &amp; ETH coming soon.
              </div>
            </div>
          </div>
        </section>

        {/* ── Buy form ── */}
        <section className="section">
          <div className="container">
            <BuyForm />
          </div>
        </section>

        {/* ── Alternative path ── */}
        <section className="section">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <div className="card flex flex-col gap-3 border border-border bg-surface">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono-tag text-xs text-muted-foreground">
                    [ Already on Web3? ]
                  </span>
                </div>
                <h2 className="type-md text-foreground">
                  Trade WFAIR on Uniswap instead
                </h2>
                <p className="type-base text-muted-foreground">
                  If you already use a Web3 wallet on Base, you can swap USDC
                  for WFAIR (the 1:1 wrapped representation of FairCoin)
                  directly on Uniswap v3, then unwrap to native FAIR through the
                  bridge any time.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={UNISWAP_SWAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Swap on Uniswap
                  </a>
                  <Link
                    to={bridgeHref}
                    className="inline-flex items-center justify-center rounded-full border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    How the bridge works →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer note ── */}
        <section className="section section--headline">
          <div className="container">
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <p className="text-xs text-muted-foreground">
                The web Buy flow uses the WFAIR{' '}
                <a
                  href={BRIDGE_SERVICE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                >
                  bridge service
                </a>{' '}
                under the hood — USDC is custodied while WFAIR is minted and
                unwrapped to native FAIR before it reaches your wallet. See{' '}
                <Link
                  to={bridgeHref}
                  className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                >
                  the bridge page
                </Link>{' '}
                for the technical details, or{' '}
                <a
                  href={FAIRWALLET_RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                >
                  download FAIRWallet
                </a>{' '}
                for the same flow on mobile and desktop.
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
