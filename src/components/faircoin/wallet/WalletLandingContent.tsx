import { isFairCoinHost } from '../../../lib/host'
import WalletHeroSection from './WalletHeroSection'
import WalletFeaturesSection from './WalletFeaturesSection'
import WalletDownloadsSection from './WalletDownloadsSection'
import WalletScreenshotsSection from './WalletScreenshotsSection'
import WalletTrustSection from './WalletTrustSection'
import WalletCtaSection from './WalletCtaSection'

/**
 * `/wallet` content tree — marketing page for the FAIRWallet app.
 *
 * Composes a thin set of focused sections that mirror the FairCoin landing
 * structure (Hero → Features → Downloads → Screenshots → Trust → CTA).
 * Each section uses the same Container width and rhythm as the rest of the
 * site so the page reads as a sibling, not a one-off.
 *
 * The Bloom theme wrapper (faircoin-theme) only kicks in on fairco.in. On
 * oxy.so the page renders as an Oxy subpage with Oxy chrome.
 */
export default function WalletLandingContent() {
  const wrapperClass = isFairCoinHost()
    ? 'faircoin-surface faircoin-theme bg-background text-foreground'
    : 'faircoin-surface bg-background text-foreground'
  return (
    <div className={wrapperClass}>
      <WalletHeroSection />
      <WalletFeaturesSection />
      <WalletDownloadsSection />
      <WalletScreenshotsSection />
      <WalletTrustSection />
      <WalletCtaSection />
    </div>
  )
}
