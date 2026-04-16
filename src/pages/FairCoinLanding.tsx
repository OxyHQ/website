import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import FairCoinNavbar from '../components/faircoin/FairCoinNavbar'
import FairCoinFooter from '../components/faircoin/FairCoinFooter'
import FairCoinLandingContent from '../components/faircoin/FairCoinLandingContent'
import { isFairCoinHost } from '../lib/host'

const SEO_TITLE = 'Wrapped FairCoin on Base — fairco.in'
const SEO_DESCRIPTION =
  '1:1 wrapped FairCoin (WFAIR) on Base. Native bridge. Trade FAIR on Uniswap, Ethereum DeFi, and more.'

export default function FairCoinLanding() {
  const onFairCoin = isFairCoinHost()

  return (
    <div className="faircoin-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin" />
      {onFairCoin ? <FairCoinNavbar /> : <Navbar />}
      <main className="flex-1">
        <FairCoinLandingContent />
      </main>
      {onFairCoin ? <FairCoinFooter /> : <Footer />}
    </div>
  )
}
