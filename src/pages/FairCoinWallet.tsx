import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import WalletLandingContent from '../components/faircoin/wallet/WalletLandingContent'
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

const SEO_TITLE = 'FAIRWallet — your FairCoin wallet'
const SEO_DESCRIPTION =
  'FAIRWallet is the official non-custodial wallet for FairCoin. Send, receive, stake and explore the FairCoin network from one app on Android, iOS, Windows, macOS and Linux.'

/**
 * `/wallet` (or `/faircoin/wallet` on oxy.so) — marketing landing for the
 * FAIRWallet app. Renders the shared Navbar/Footer chrome around
 * `WalletLandingContent`, which composes hero, features, downloads,
 * screenshots, trust narrative and a final CTA.
 */
export default function FairCoinWalletPage() {
  const onFairCoinHost = isFairCoinHost()
  const navbarBrand = useFairCoinNavbarBrand()
  const navItems = useFairCoinNavItems()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()

  // Same dual-mount story as the other FairCoin pages — Bloom/CSS theme is
  // host-gated so /faircoin/wallet on oxy.so reads as an Oxy subpage.
  const rootClass = onFairCoinHost
    ? 'faircoin-surface faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'
    : 'faircoin-surface flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'

  return (
    <div className={rootClass}>
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin/wallet" />
      <Navbar
        brand={navbarBrand}
        navItems={navItems}
        ctaButtons={ctaButtons}
        hideAuth={onFairCoinHost}
        hideBanner={onFairCoinHost}
        hideLocalePicker={onFairCoinHost}
      />
      <main className="flex-1">
        <WalletLandingContent />
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
