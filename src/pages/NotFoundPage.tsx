import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
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
import MemoryBoard from '../components/notfound/MemoryBoard'
import FaqSection, { type FaqEntry } from '../components/sections/FaqSection'

/** Where to go from a page that is not there. */
const OXY_HELP: readonly FaqEntry[] = [
  {
    question: 'Useful links',
    answer: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <a className="underline underline-offset-2 hover:text-foreground" href="/help">
            Help center
          </a>{' '}
          — guides, troubleshooting and answers to the questions that come up most.
        </li>
        <li>
          <a className="underline underline-offset-2 hover:text-foreground" href="/status">
            Status
          </a>{' '}
          — whether the thing you were looking for is simply down right now.
        </li>
        <li>
          <a className="underline underline-offset-2 hover:text-foreground" href="/newsroom">
            Newsroom
          </a>{' '}
          — a page that moved is usually a page that changed, and that is where we say so.
        </li>
      </ul>
    ),
  },
  {
    question: 'Documentation',
    answer: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <a className="underline underline-offset-2 hover:text-foreground" href="/developers/docs">
            Read the docs
          </a>{' '}
          — guides and references for building on Oxy.
        </li>
        <li>
          <a className="underline underline-offset-2 hover:text-foreground" href="/developers/docs/api">
            REST API reference
          </a>{' '}
          — every endpoint, versioned.
        </li>
        <li>
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://github.com/OxyHQ"
            target="_blank"
            rel="noopener noreferrer"
          >
            The source
          </a>{' '}
          — read and run what we ship.
        </li>
      </ul>
    ),
  },
]

const FAIRCOIN_HELP: readonly FaqEntry[] = [
  {
    question: 'Useful links',
    answer: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <a className="underline underline-offset-2 hover:text-foreground" href="https://explorer.fairco.in">
            Explorer
          </a>{' '}
          — browse blocks, transactions and addresses.
        </li>
        <li>
          <a className="underline underline-offset-2 hover:text-foreground" href="https://fairco.in/wallet">
            Wallet
          </a>{' '}
          — send, receive and track balances.
        </li>
      </ul>
    ),
  },
]

export default function NotFoundPage() {
  const onFairCoinHost = isFairCoinHost()
  // Each FairCoin chrome hook returns `undefined` off-host, so the Navbar /
  // Footer naturally fall back to the Oxy defaults — no prop branching needed.
  const navbarBrand = useFairCoinNavbarBrand()
  const dropdowns = useFairCoinDropdowns()
  const simpleNavLinks = useFairCoinSimpleNavLinks()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()

  return (
    <div className={`not-found-theme flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background ${onFairCoinHost ? 'faircoin-theme' : ''}`}>
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
        canonicalPath="/404"
        noIndex
      />
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
        <MemoryBoard />

        {/* The board, then the way out. Nothing in between. */}
        <h1 className="sr-only">Page not found</h1>

        {/*
          The same disclosure band the home page's questions use, so a visitor
          who lands here wrong finds the way out in a shape they have seen.
        */}
        <FaqSection title="Find help" items={onFairCoinHost ? FAIRCOIN_HELP : OXY_HELP} />
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
