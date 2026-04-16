import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import BuyApp from '../components/faircoin/buy/BuyApp'
import { isFairCoinHost } from '../lib/host'
import {
  useFairCoinDropdowns,
  useFairCoinFooterBrand,
  useFairCoinFooterColumns,
  useFairCoinFooterCopyright,
  useFairCoinFooterLegalLinks,
  useFairCoinNavCtaButtons,
  useFairCoinNavbarBrand,
  useFairCoinSimpleNavLinks,
} from '../lib/faircoin-chrome'

const SEO_TITLE = 'Buy FairCoin — fairco.in'
const SEO_DESCRIPTION =
  'Buy native FAIR with USDC on Base. Pay from any wallet, the bridge swaps and delivers FAIR straight to your FairCoin address.'

/**
 * `/buy` (or `/faircoin/buy` on oxy.so) — app-style purchase flow.
 *
 * Renders the shared Navbar/Footer chrome around `BuyApp`, which handles the
 * full wizard (amount → pay → done) inside a focused, centered card.
 * Marketing content has been removed in favour of an app-feel experience —
 * users land here with intent and get a single focused action.
 */
export default function FairCoinBuyPage() {
  const onFairCoinHost = isFairCoinHost()
  const navbarBrand = useFairCoinNavbarBrand()
  const dropdowns = useFairCoinDropdowns()
  const simpleNavLinks = useFairCoinSimpleNavLinks()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()

  // Same dual-mount story as the other FairCoin pages — Bloom/CSS theme is
  // host-gated so /faircoin/buy on oxy.so reads as an Oxy subpage.
  const rootClass = onFairCoinHost
    ? 'faircoin-surface faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'
    : 'faircoin-surface flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'

  return (
    <div className={rootClass}>
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin/buy" />
      <Navbar
        brand={navbarBrand}
        customDropdowns={dropdowns}
        customNavLinks={simpleNavLinks}
        ctaButtons={ctaButtons}
        hideAuth={onFairCoinHost}
        hideBanner={onFairCoinHost}
        hideLocalePicker={onFairCoinHost}
      />
      <main className="flex-1">
        <BuyApp />
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
