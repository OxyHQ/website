import HeroSection from './landing/HeroSection'
import TrustSignalsStrip from './landing/TrustSignalsStrip'
import LiveStatsSection from './landing/LiveStatsSection'
import NetworkSpecSection from './landing/NetworkSpecSection'
import WalletsSection from './landing/WalletsSection'
import NetworkSection from './landing/NetworkSection'
import LiveBridgeSection from './landing/LiveBridgeSection'
import CommunitySection from './landing/CommunitySection'
import FaqSection from './landing/FaqSection'
import CtaSection from './landing/CtaSection'
import WagmiAppProvider from './WagmiAppProvider'
import { isFairCoinHost } from '../../lib/host'

/**
 * Polished FairCoin landing page content.
 *
 * Layout (top → bottom):
 *   HeroSection         — Revolut-style hero, FAIRWallet phone mockup,
 *                         floating chips, gradient backdrop
 *   TrustSignalsStrip   — Built on Base / Powered by Uniswap / etc.
 *   LiveStatsSection    — "Network at a glance" — live tiles powered by the
 *                         FairCoin Explorer REST API + viem on Base + bridge
 *                         reserves snapshot. Animated count-up on load,
 *                         subtle pulse on update, "Live" dot.
 *   NetworkSpecSection  — Apple-style spec sheet with the network params
 *   WalletsSection      — Hold-your-own-keys cards with platform badges
 *   NetworkSection      — Explorer / seeders / masternodes
 *   LiveBridgeSection   — Bridge dashboard tiles + WFAIR/FAIR flow visual +
 *                         CTAs (trade, redeem, bridge details)
 *   CommunitySection    — Reddit / Telegram / Twitter / GitHub
 *   FaqSection          — Polished FAQ accordion
 *   CtaSection          — Final gradient CTA
 *
 * `LiveStatsSection`, `LiveBridgeSection` and the `LiveStatsSection`'s
 * uniswap-pool tile use wagmi to read on-chain state from Base mainnet, so
 * the whole tree is wrapped in `WagmiAppProvider`. The wagmi client is only
 * active here and on `/unwrap`; the rest of the SPA skips that bundle.
 */
export default function FairCoinLandingContent() {
  // The `.faircoin-theme` wrapper only kicks in on fairco.in to override Bloom
  // CSS variables to FairCoin green. On oxy.so the same content uses the
  // active Oxy theme.
  const wrapperClass = isFairCoinHost()
    ? 'faircoin-surface faircoin-theme bg-background text-foreground'
    : 'faircoin-surface bg-background text-foreground'
  return (
    <div className={wrapperClass}>
      <WagmiAppProvider>
        <HeroSection />
        <TrustSignalsStrip />
        <LiveStatsSection />
        <NetworkSpecSection />
        <WalletsSection />
        <NetworkSection />
        <LiveBridgeSection />
        <CommunitySection />
        <FaqSection />
        <CtaSection />
      </WagmiAppProvider>
    </div>
  )
}
