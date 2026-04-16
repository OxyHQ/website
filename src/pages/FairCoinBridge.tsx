import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import FairCoinNavbar from '../components/faircoin/FairCoinNavbar'
import FairCoinFooter from '../components/faircoin/FairCoinFooter'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import { isFairCoinHost } from '../lib/host'
import { fc } from '../lib/faircoin-links'

const CONTRACT_ADDRESS = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3'
const BASESCAN_URL = `https://basescan.org/address/${CONTRACT_ADDRESS}`
const EXPLORER_BRIDGE_URL = 'https://explorer.fairco.in/bridge'
const BRIDGE_SOURCE_URL = 'https://github.com/FairCoinOfficial/faircoin-bridge'

export default function FairCoinBridgePage() {
  const onFairCoinHost = isFairCoinHost()
  const Nav = onFairCoinHost ? FairCoinNavbar : Navbar
  const Foot = onFairCoinHost ? FairCoinFooter : Footer
  const homeHref = useMemo(() => fc('/'), [])

  return (
    <>
      <Nav />
      <main className="cursor-theme faircoin-theme">
        <section className="section section--headline bg-theme-bg text-theme-text">
          <div className="container">
            <div className="mx-auto max-w-prose-medium-wide text-center">
              <div className="mono-tag mb-v1 flex items-center justify-center gap-2 text-sm">
                <span>[</span> <span>Coming soon</span> <span>]</span>
              </div>
              <h1 className="type-xl sm:type-2xl text-balance mb-v1 gradient-text">
                Bridge UI is on its way
              </h1>
              <p className="type-base text-theme-text-sec text-pretty mb-v1 mx-auto max-w-2xl">
                The WFAIR contract is live on Base mainnet. The web UI for deposits and
                withdrawals is being finalised and will launch once the bridge service
                completes its shakedown period. Follow @fairco.in on Twitter for the
                go-live date.
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

        <section className="section bg-theme-bg text-theme-text">
          <div className="container">
            <div className="mx-auto max-w-prose-medium-wide">
              <h2 className="type-lg mb-v1">What you can do today</h2>
              <ul className="type-base text-theme-text-sec flex flex-col gap-v1/2 mb-v1">
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
              <Link to={homeHref} className="type-base underline text-theme-text-sec">
                ← Back to the landing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Foot />
    </>
  )
}
