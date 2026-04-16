import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import FairCoinLandingContent from '../components/faircoin/FairCoinLandingContent'
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

const SEO_TITLE = 'FairCoin — community-run cryptocurrency'
const SEO_DESCRIPTION =
  'FairCoin is a community-run cryptocurrency. Decentralized, fair, free of speculation. Hybrid PoW/PoS, capped at 33M coins. Wallets, masternodes, explorer and an optional Base bridge.'

export default function FairCoinLanding() {
  const onFairCoinHost = isFairCoinHost()
  const navbarBrand = useFairCoinNavbarBrand()
  const navItems = useFairCoinNavItems()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()

  // On fairco.in we re-skin everything: Bloom theme, navbar, footer, CSS vars.
  // On oxy.so the same routes render as Oxy subpages — Oxy chrome and Oxy
  // theme variables — so the only override here is the page content.
  const rootClass = onFairCoinHost
    ? 'faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'
    : 'flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'

  return (
    <div className={rootClass}>
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin" />
      <Navbar
        brand={navbarBrand}
        navItems={navItems}
        ctaButtons={ctaButtons}
        hideAuth={onFairCoinHost}
        hideBanner={onFairCoinHost}
        hideLocalePicker={onFairCoinHost}
      />
      <main className="flex-1">
        <FairCoinLandingContent />
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
