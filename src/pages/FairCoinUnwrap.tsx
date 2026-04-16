import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import UnwrapApp from '../components/faircoin/unwrap/UnwrapApp'
import WagmiAppProvider from '../components/faircoin/WagmiAppProvider'
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

const SEO_TITLE = 'Redeem WFAIR — fairco.in'
const SEO_DESCRIPTION =
  'Burn WFAIR on Base and receive native FAIR on the FairCoin chain. 1:1 redemption through the official FairCoin bridge.'

/**
 * `/unwrap` (or `/faircoin/unwrap` on oxy.so) — wallet-driven WFAIR → FAIR
 * redemption. Wraps `UnwrapApp` in the wagmi provider so the page can talk to
 * the user's wallet and the WFAIR contract on Base mainnet.
 */
export default function FairCoinUnwrapPage() {
  const onFairCoinHost = isFairCoinHost()
  const navbarBrand = useFairCoinNavbarBrand()
  const dropdowns = useFairCoinDropdowns()
  const simpleNavLinks = useFairCoinSimpleNavLinks()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()

  const rootClass = onFairCoinHost
    ? 'faircoin-surface faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'
    : 'faircoin-surface flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background'

  return (
    <div className={rootClass}>
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin/unwrap" />
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
        <WagmiAppProvider>
          <UnwrapApp />
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
