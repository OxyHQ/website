import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import { fc } from '../lib/faircoin-links'
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
  'Technical reference for the WFAIR bridge — 1:1 wrapped FairCoin on Base. Contract, source, status, reserves.'

const CONTRACT_ADDRESS = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3'
const BASESCAN_URL = `https://basescan.org/address/${CONTRACT_ADDRESS}`
const EXPLORER_BRIDGE_URL = 'https://explorer.fairco.in/bridge'
const BRIDGE_SOURCE_URL = 'https://github.com/FairCoinOfficial/faircoin-bridge'

export default function FairCoinBridgePage() {
  const navbarBrand = useFairCoinNavbarBrand()
  const navItems = useFairCoinNavItems()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()
  const homeHref = useMemo(() => fc('/'), [])
  const buyHref = useMemo(() => fc('/buy'), [])

  return (
    <div className="faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin/bridge" />
      <Navbar
        brand={navbarBrand}
        navItems={navItems}
        ctaButtons={ctaButtons}
        hideAuth
        hideBanner
        hideLocalePicker
      />
      <main className="cursor-theme faircoin-theme flex-1">
        <section className="section section--headline">
          <div className="container">
            <div className="mx-auto max-w-prose-medium-wide text-center">
              <div className="mono-tag mb-v1 flex items-center justify-center gap-2 text-sm">
                <span>[</span> <span>Advanced</span> <span>]</span>
              </div>
              <h1 className="type-xl sm:type-2xl text-balance mb-v1 gradient-text">
                Bridge UI is on its way
              </h1>
              <p className="type-base text-muted-foreground text-pretty mb-v1 mx-auto max-w-2xl">
                The WFAIR contract is live on Base mainnet. The web UI for direct deposits and
                withdrawals is being finalised and will launch once the bridge service finishes its
                shakedown period. Most people don't need this page — use{' '}
                <Link to={buyHref} className="underline">
                  Buy FairCoin
                </Link>{' '}
                instead.
              </p>
              <div className="flex justify-center gap-x-g1 items-center flex-wrap mb-v1">
                <Button href={EXPLORER_BRIDGE_URL} target="_blank" rel="noopener noreferrer">
                  View live contract status
                </Button>
                <Button variant="outline" href={BASESCAN_URL} target="_blank" rel="noopener noreferrer">
                  Contract on Basescan
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="mx-auto max-w-prose-medium-wide">
              <h2 className="type-lg mb-v1">What you can do today</h2>
              <ul className="type-base text-muted-foreground flex flex-col gap-v1/2 mb-v1">
                <li>
                  Check the live peg, total supply, and paused state on the{' '}
                  <a href={EXPLORER_BRIDGE_URL} className="underline" target="_blank" rel="noopener noreferrer">
                    FairCoin Explorer
                  </a>
                  .
                </li>
                <li>
                  Inspect the verified contract on{' '}
                  <a href={BASESCAN_URL} className="underline" target="_blank" rel="noopener noreferrer">
                    Basescan
                  </a>
                  .
                </li>
                <li>
                  Read the source at{' '}
                  <a href={BRIDGE_SOURCE_URL} className="underline" target="_blank" rel="noopener noreferrer">
                    FairCoinOfficial/faircoin-bridge
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
              <Link to={homeHref} className="type-base underline text-muted-foreground">
                ← Back to FairCoin
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer
        brand={footerBrand}
        columns={footerColumns}
        socialLinks={[]}
        legalLinks={footerLegalLinks}
        copyright={footerCopyright}
      />
    </div>
  )
}
