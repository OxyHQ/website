import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import BridgeContent from '../components/faircoin/bridge/BridgeContent'
import WagmiAppProvider from '../components/faircoin/WagmiAppProvider'
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

/**
 * `/bridge` (or `/faircoin/bridge` on oxy.so) — polished bridge reference
 * page. Wraps `BridgeContent` in the wagmi provider so the embedded live
 * stats tiles can read on-chain WFAIR data.
 */
export default function FairCoinBridgePage() {
  const onFairCoinHost = isFairCoinHost()
  const navbarBrand = useFairCoinNavbarBrand()
  const navItems = useFairCoinNavItems()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()

  // Same dual-mount story as the other FairCoin pages — Bloom/CSS theme is
  // host-gated so /faircoin/bridge on oxy.so reads as an Oxy subpage.
  const rootClass = onFairCoinHost
    ? 'faircoin-surface faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'
    : 'faircoin-surface flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'

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
      <main className="flex-1">
        <WagmiAppProvider>
          <BridgeContent />
        </WagmiAppProvider>
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
