import { useState } from 'react'
import Button from '../ui/Button'

const CONTRACT_ADDRESS = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3'
const BASESCAN_URL = `https://basescan.org/address/${CONTRACT_ADDRESS}`
const BRIDGE_SOURCE_URL = 'https://github.com/FairCoinOfficial/faircoin-bridge'
const TOKEN_LIST_URL = '/tokenlist.json'

const FEATURES: readonly { title: string; description: string }[] = [
  {
    title: '1:1 Peg',
    description: 'Each WFAIR is backed by one FAIR held in custody. Fully redeemable, no rebasing, no games.',
  },
  {
    title: 'Base L2',
    description: 'Low fees, fast settlement. Standard ERC-20 compatible with every wallet and DEX on Base.',
  },
  {
    title: 'Transparent Reserves',
    description: 'Public proof-of-reserves endpoint. Custody addresses auditable on the FairCoin chain.',
  },
]

const CONTRACT_ROWS: readonly { label: string; value: string; href?: string }[] = [
  { label: 'Name', value: 'Wrapped FairCoin' },
  { label: 'Symbol', value: 'WFAIR' },
  { label: 'Decimals', value: '18' },
  { label: 'Network', value: 'Base (chainId 8453)' },
  { label: 'Contract', value: CONTRACT_ADDRESS, href: BASESCAN_URL },
]

const BRIDGE_STEPS: readonly { index: string; title: string; description: string }[] = [
  {
    index: '01',
    title: 'Deposit',
    description: 'Send FAIR to your assigned bridge address. After six confirmations, WFAIR is minted 1:1 to your wallet on Base.',
  },
  {
    index: '02',
    title: 'Trade',
    description: 'Use WFAIR on Uniswap, DEX aggregators, and lending markets across Base. Standard ERC-20 behaviour.',
  },
  {
    index: '03',
    title: 'Withdraw',
    description: 'Burn WFAIR with your FAIR destination attached. After 20 Base confirmations, the bridge releases FAIR on-chain.',
  },
]

const FAQS: readonly { question: string; answer: string }[] = [
  {
    question: 'Is WFAIR safe?',
    answer:
      'Experimental. Launched with a TVL cap of 1000 FAIR as a safety mitigation. No external audit in v1. The bridge is pausable. Source: https://github.com/FairCoinOfficial/faircoin-bridge',
  },
  {
    question: 'What are the fees?',
    answer:
      '0.3% deposit plus 0.3% withdrawal. Users pay Base gas for the burn transaction. The bridge covers the FAIR miner fee on the release side.',
  },
  {
    question: 'Who holds my FAIR?',
    answer:
      'Currently a single-EOA custodian with published reserves. Upgrading to a multisig custody model once TVL exceeds €5k.',
  },
  {
    question: 'When Uniswap pool?',
    answer: 'After two weeks of stable mainnet operation. Token list is ready for import today.',
  },
  {
    question: 'Where is the token list?',
    answer:
      'https://fairco.in/tokenlist.json — import into MetaMask or Uniswap to get WFAIR with the correct metadata and logo.',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      () => {
        setCopied(false)
      },
    )
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-3 shrink-0 cursor-pointer rounded-lg border border-transparent px-2.5 py-1 text-xs font-medium text-theme-text-sec transition-colors hover:bg-[rgba(34,197,94,0.08)] hover:text-theme-text"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-[rgba(34,197,94,0.12)] py-4 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground">
        <span>{question}</span>
        <svg
          className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.2"
            d="M5.25 7.125 9 10.875l3.75-3.75"
          />
        </svg>
      </summary>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{answer}</p>
    </details>
  )
}

function StepArrow() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="hidden shrink-0 text-[rgba(34,197,94,0.4)] lg:block"
      aria-hidden="true"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
        d="M5 12h14m0 0-5-5m5 5-5 5"
      />
    </svg>
  )
}

export default function FairCoinLandingContent() {
  return (
    <div className="cursor-theme faircoin-theme">
      {/* Hero */}
      <section className="section section--headline bg-theme-bg text-theme-text">
        <div className="container">
          <div className="mx-auto max-w-prose-medium-wide text-center">
            <div className="mono-tag mb-v1 flex items-center justify-center gap-2 text-sm">
              <span>[</span> <span>FairCoin × Base</span> <span>]</span>
            </div>
            <p className="type-base text-theme-text-sec mb-v8/12">Wrapped FairCoin</p>
            <h1 className="type-xl sm:type-2xl text-balance mb-v1 gradient-text">
              Wrapped FairCoin on Base
            </h1>
            <p className="type-base text-theme-text-sec text-pretty mb-v1 mx-auto max-w-2xl">
              The native bridge from FairCoin to Ethereum L2. Trade FAIR on Uniswap, hold it in MetaMask, keep the 1:1 peg.
            </p>
            <div className="flex justify-center gap-x-g1 items-center flex-wrap mb-v1">
              <Button href="/faircoin/bridge">Use the bridge</Button>
              <Button variant="outline" href={BASESCAN_URL} target="_blank" rel="noopener noreferrer">
                View contract
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is FairCoin */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="grid-cursor gap-0">
            <div className="col-span-full md:col-start-1 md:col-end-10 lg:col-start-1 lg:col-end-9">
              <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
                <span>[</span> <span>About</span> <span>]</span>
              </div>
              <h2 className="type-md-lg text-balance">A community-run cryptocurrency</h2>
            </div>
            <div className="col-span-full mt-v1 md:col-start-10 md:col-end-25 md:mt-0 lg:col-start-10 lg:col-end-25">
              <div className="type-base text-theme-text-sec max-w-prose space-y-4">
                <p>
                  FairCoin is a Bitcoin-fork cryptocurrency with a hybrid proof-of-work / proof-of-stake consensus,
                  120-second blocks, and a hard cap of 33 million coins.
                </p>
                <p>
                  Maintained by volunteers. No ICO, no pre-mine, no foundation — just a working chain and a small team
                  shipping the tools people need to actually use it. More on{' '}
                  <a
                    href="https://fairco.in/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-theme-text underline decoration-[rgba(34,197,94,0.4)] underline-offset-4 hover:decoration-[rgba(34,197,94,0.8)]"
                  >
                    fairco.in/about
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WFAIR on Base */}
      <section className="section bg-theme-card-hex text-theme-text">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>WFAIR on Base</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">
            Wrapped, on L2, where the liquidity is
          </h2>
          <div className="grid gap-g1 grid-cols-1 items-stretch md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="h-full">
                <div className="card flex h-full grow-1 flex-col">
                  <div className="type-base max-w-prose flex grow flex-col">
                    <h3 className="type-base md:type-md">{feature.title}</h3>
                    <p className="mt-2 text-pretty text-theme-text-sec">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contract details */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>Contract</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">Contract details</h2>
          <div className="code-block">
            <dl className="flex flex-col gap-2">
              {CONTRACT_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 border-b border-[rgba(34,197,94,0.08)] pb-2 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <dt className="shrink-0 text-xs uppercase tracking-wider text-theme-text-sec">{row.label}</dt>
                  <dd className="flex min-w-0 items-center gap-2 font-mono text-xs sm:text-sm">
                    {row.href ? (
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-[#86efac] underline decoration-[rgba(34,197,94,0.4)] underline-offset-4 hover:decoration-[rgba(34,197,94,0.8)]"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="break-all">{row.value}</span>
                    )}
                    {row.label === 'Contract' && <CopyButton text={row.value} />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-v1 flex flex-wrap gap-x-g1 gap-y-2">
            <Button variant="outline" href={BASESCAN_URL} target="_blank" rel="noopener noreferrer">
              Open on Basescan
            </Button>
            <Button variant="ghost" href={TOKEN_LIST_URL} target="_blank" rel="noopener noreferrer">
              Token list JSON
            </Button>
          </div>
        </div>
      </section>

      {/* How the bridge works */}
      <section className="section bg-theme-card-hex text-theme-text">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>Bridge</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">How the bridge works</h2>
          <div className="flex flex-col items-stretch gap-g1 lg:flex-row lg:items-stretch">
            {BRIDGE_STEPS.map((step, idx) => (
              <div key={step.index} className="flex grow items-stretch gap-g1">
                <div className="card flex grow flex-col">
                  <span className="mono-tag text-sm mb-v8/12 text-[#22c55e]">{step.index}</span>
                  <h3 className="type-base md:type-md">{step.title}</h3>
                  <p className="mt-2 text-pretty text-theme-text-sec">{step.description}</p>
                </div>
                {idx < BRIDGE_STEPS.length - 1 && (
                  <div className="flex items-center">
                    <StepArrow />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>FAQ</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">Frequently asked</h2>
          <div className="mx-auto max-w-3xl">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="section section--headline bg-theme-bg text-theme-text">
        <div className="container">
          <div className="relative flex items-center justify-center py-6">
            <div className="absolute inset-x-0 -top-16 h-px bg-gradient-to-r from-transparent via-[#22c55e] to-transparent opacity-40 sm:-top-32" />
            <div className="relative flex max-w-lg flex-col items-center space-y-8 text-center">
              <h2 className="type-xl sm:type-2xl text-balance gradient-text">Bring FAIR on-chain.</h2>
              <p className="type-base text-theme-text-sec">
                The bridge is open. The source is public. The contract is verified. Everything you need to get started.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-g1 gap-y-2">
                <Button href="/faircoin/bridge">Use the bridge</Button>
                <Button variant="outline" href={BRIDGE_SOURCE_URL} target="_blank" rel="noopener noreferrer">
                  Source on GitHub
                </Button>
                <Button variant="ghost" href={BASESCAN_URL} target="_blank" rel="noopener noreferrer">
                  Contract on Basescan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
