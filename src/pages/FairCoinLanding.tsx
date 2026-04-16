import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import FairCoinLandingContent from '../components/faircoin/FairCoinLandingContent'
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
  const navbarBrand = useFairCoinNavbarBrand()
  const navItems = useFairCoinNavItems()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()

  return (
    <div className="faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin" />
      <Navbar
        brand={navbarBrand}
        navItems={navItems}
        ctaButtons={ctaButtons}
        hideAuth
        hideBanner
        hideLocalePicker
      />
      <main className="flex-1">
        <FairCoinLandingContent />
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
