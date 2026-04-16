import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { fc } from '../../lib/faircoin-links'
import { isFairCoinHost } from '../../lib/host'

const EXPLORER_URL = 'https://explorer.fairco.in'
const FAIRCOIN_REPO_URL = 'https://github.com/FairCoinOfficial/FairCoin'
const FAIRWALLET_RELEASES_URL = 'https://github.com/FairCoinOfficial/FAIRWallet/releases'
const FAIRNODE_RELEASES_URL = 'https://github.com/FairCoinOfficial/FAIRNode/releases'
const ABOUT_URL = 'https://fairco.in/about'
const REDDIT_URL = 'https://reddit.com/r/FairCoin'
const TWITTER_URL = 'https://twitter.com/FairCoin_'
const TELEGRAM_URL = 'https://t.me/FairCoin_'
const GITHUB_ORG_URL = 'https://github.com/FairCoinOfficial'
const SEEDER_REPO_URL = 'https://github.com/FairCoinOfficial/faircoin-seeder'

const WFAIR_CONTRACT_ADDRESS = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3'
const WFAIR_BASESCAN_URL = `https://basescan.org/address/${WFAIR_CONTRACT_ADDRESS}`
const BRIDGE_SOURCE_URL = 'https://github.com/FairCoinOfficial/faircoin-bridge'
const UNISWAP_POOL_ADDRESS = '0x9F4F694390c60b51e30461c785C1345A1545b7ca'
const UNISWAP_SWAP_URL = `https://app.uniswap.org/swap?outputCurrency=${WFAIR_CONTRACT_ADDRESS}&chain=base`
const UNISWAP_POOL_EXPLORE_URL =
  'https://app.uniswap.org/explore/tokens/base/0xf2853ceddf47a05fee0b4b24dff2925d59737fb3'

interface NetworkParam {
  label: string
  value: string
}

const NETWORK_PARAMS: readonly NetworkParam[] = [
  { label: 'Ticker', value: 'FAIR' },
  { label: 'Algorithm', value: 'Quark (PoW + PoS hybrid)' },
  { label: 'Block time', value: '120 seconds' },
  { label: 'Max supply', value: '33,000,000 FAIR' },
  { label: 'Premine', value: '5,000,000 FAIR (block 1)' },
  { label: 'Masternode collateral', value: '5,000 FAIR' },
  { label: 'BIP44 coin type', value: '119' },
  { label: 'P2P port', value: '46372' },
]

interface WalletOption {
  name: string
  description: string
  href: string
  cta: string
  external?: boolean
}

const WALLETS: readonly WalletOption[] = [
  {
    name: 'FAIRWallet',
    description:
      'Lightweight SPV wallet for everyday use. Android, iOS, Windows, macOS and Linux. Connects directly to the FairCoin P2P network — no server in the middle.',
    href: FAIRWALLET_RELEASES_URL,
    cta: 'Download',
    external: true,
  },
  {
    name: 'FAIRNode',
    description:
      'Desktop runner for a full FairCoin Core node. Run a masternode, stake FAIR, and help secure the chain from your laptop or home server.',
    href: FAIRNODE_RELEASES_URL,
    cta: 'Get the desktop app',
    external: true,
  },
  {
    name: 'FairCoin Core',
    description:
      'The reference daemon. Build from source for servers, mining rigs, or to participate in protocol development.',
    href: FAIRCOIN_REPO_URL,
    cta: 'View source',
    external: true,
  },
]

interface NetworkPiece {
  title: string
  description: string
  href?: string
  ctaLabel?: string
}

const NETWORK_PIECES: readonly NetworkPiece[] = [
  {
    title: 'Block explorer',
    description:
      'Browse blocks, transactions, addresses and the rich list. Built on the FairCoin Explorer (Next.js + JSON-RPC).',
    href: EXPLORER_URL,
    ctaLabel: 'Open the explorer',
  },
  {
    title: 'DNS seeders',
    description:
      'seed1.fairco.in and seed2.fairco.in keep the peer list healthy so any wallet can find the network on first launch.',
    href: SEEDER_REPO_URL,
    ctaLabel: 'Seeder source',
  },
  {
    title: 'Masternodes',
    description:
      'Lock 5,000 FAIR as collateral to run a masternode. Earns a share of block rewards and powers FastSend instant confirmations.',
    href: `${FAIRCOIN_REPO_URL}#masternode-setup`,
    ctaLabel: 'How to set one up',
  },
]

interface FaqItem {
  question: string
  answer: string
}

const FAQS: readonly FaqItem[] = [
  {
    question: 'What is FairCoin?',
    answer:
      'FairCoin is a community-run cryptocurrency forked from Bitcoin in 2014. Hybrid PoW/PoS consensus, Quark hashing, 120-second blocks, capped at 33 million coins. Maintained by volunteers — no ICO, no foundation, no pre-mine beyond the initial 5M coin distribution at block 1.',
  },
  {
    question: 'Where can I buy FAIR?',
    answer:
      'Three paths. (1) Install FAIRWallet and use the Buy tab — pay with USDC, FAIR arrives in your wallet automatically. This is the easiest way. (2) If you already hold USDC on Base and use a Web3 wallet, swap it for WFAIR on Uniswap — WFAIR is the 1:1 wrapped version of FAIR, redeemable through the bridge. (3) If you already hold native FAIR on the FairCoin chain, use the bridge to wrap or unwrap between FAIR and WFAIR. You can also acquire FAIR by staking it, running a masternode, or mining the early PoW phase.',
  },
  {
    question: 'Can I run my own node?',
    answer:
      'Yes. Use FAIRNode for a desktop full-node experience, or build FairCoin Core from source on a server. Running a node strengthens the network and gives you a fully validating wallet.',
  },
  {
    question: 'Is there a wrapped version on Ethereum?',
    answer:
      'Yes — WFAIR on Base. It is live at 0xF2853C…37fb3 on Base mainnet. 1:1 wrapped representation for use in Ethereum DeFi, with a live Uniswap v3 pool against USDC. Strictly secondary to native FairCoin and fully redeemable through the bridge. See the WFAIR section below.',
  },
  {
    question: 'Where can I follow development?',
    answer:
      'GitHub at FairCoinOfficial. Discussions happen on Reddit (r/FairCoin), Telegram and Twitter. The full source for the chain, wallets, explorer, seeder and bridge is open on GitHub.',
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
      className="ml-3 shrink-0 cursor-pointer rounded-lg border border-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function FaqItemCard({ question, answer }: FaqItem) {
  return (
    <details className="group border-b border-border py-4 last:border-b-0">
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

export default function FairCoinLandingContent() {
  const bridgeHref = useMemo(() => fc('/bridge'), [])
  // The `.cursor-theme` className provides the typography + section utilities
  // (`type-xl`, `section`, `card`, …) regardless of brand. The `.faircoin-theme`
  // wrapper only kicks in on fairco.in to override Bloom CSS variables to
  // FairCoin green. On oxy.so the same content uses the active Oxy theme.
  const wrapperClass = isFairCoinHost() ? 'cursor-theme faircoin-theme' : 'cursor-theme'
  return (
    <div className={wrapperClass}>
      {/* ── Hero ── */}
      <section className="section section--headline">
        <div className="container">
          <div className="mx-auto max-w-prose-medium-wide text-center">
            <div className="mono-tag mb-v1 flex items-center justify-center gap-2 text-sm">
              <span>[</span> <span>Since 2014</span> <span>]</span>
            </div>
            <h1 className="type-xl sm:type-2xl text-balance mb-v1 gradient-text">FairCoin</h1>
            <p className="type-base text-muted-foreground text-pretty mb-v1 mx-auto max-w-2xl">
              A community-run cryptocurrency. Decentralized, fair, free of speculation. Hybrid
              proof-of-work and proof-of-stake, hard-capped at 33 million coins.
            </p>
            <div className="flex justify-center gap-x-g1 items-center flex-wrap mb-v1">
              <Button href={fc('/buy')}>Buy FairCoin</Button>
              <Button variant="outline" href={FAIRWALLET_RELEASES_URL} target="_blank" rel="noopener noreferrer">
                Get a wallet
              </Button>
              <Button variant="ghost" href={UNISWAP_SWAP_URL} target="_blank" rel="noopener noreferrer">
                Trade WFAIR on Uniswap
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── What is FairCoin ── */}
      <section className="section">
        <div className="container">
          <div className="grid-cursor gap-0">
            <div className="col-span-full md:col-start-1 md:col-end-10 lg:col-start-1 lg:col-end-9">
              <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
                <span>[</span> <span>About</span> <span>]</span>
              </div>
              <h2 className="type-md-lg text-balance">A working chain, kept simple</h2>
            </div>
            <div className="col-span-full mt-v1 md:col-start-10 md:col-end-25 md:mt-0 lg:col-start-10 lg:col-end-25">
              <div className="type-base text-muted-foreground max-w-prose space-y-4">
                <p>
                  FairCoin is a Bitcoin-fork cryptocurrency launched in 2014. It pairs proof-of-work
                  with proof-of-stake, runs the Quark hash function, settles new blocks every two
                  minutes, and has a hard supply cap of 33 million coins — most of it already
                  issued through staking and a small initial distribution at block one.
                </p>
                <p>
                  Maintained by volunteers. No ICO, no foundation, no marketing budget — just a
                  daemon, a few wallets, an explorer and a small group of people that keep
                  shipping. Read more at{' '}
                  <a
                    href={ABOUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                  >
                    fairco.in/about
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
          <div className="mt-v2">
            <div className="code-block">
              <dl className="flex flex-col gap-2">
                {NETWORK_PARAMS.map((param) => (
                  <div
                    key={param.label}
                    className="flex flex-col gap-1 border-b border-border pb-2 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <dt className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
                      {param.label}
                    </dt>
                    <dd className="font-mono text-xs text-foreground sm:text-sm">{param.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── Get FairCoin / Wallets ── */}
      <section className="section">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>Get FairCoin</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">
            Wallets and nodes
          </h2>
          <div className="grid gap-g1 grid-cols-1 items-stretch md:grid-cols-3">
            {WALLETS.map((wallet) => (
              <div key={wallet.name} className="card flex h-full grow-1 flex-col">
                <div className="type-base flex grow flex-col">
                  <h3 className="type-base md:type-md text-foreground">{wallet.name}</h3>
                  <p className="mt-2 grow text-pretty text-muted-foreground">{wallet.description}</p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      href={wallet.href}
                      {...(wallet.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {wallet.cta}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-v1 text-sm text-muted-foreground">
            Centralised exchange listings are not part of the project today. Acquire FAIR by
            staking, mining the early PoW phase, running a masternode, or trading with the
            community.
          </p>
        </div>
      </section>

      {/* ── The network ── */}
      <section className="section">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>The network</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">
            Open infrastructure
          </h2>
          <div className="grid gap-g1 grid-cols-1 items-stretch md:grid-cols-3">
            {NETWORK_PIECES.map((piece) => (
              <div key={piece.title} className="card flex h-full grow-1 flex-col">
                <div className="type-base flex grow flex-col">
                  <h3 className="type-base md:type-md text-foreground">{piece.title}</h3>
                  <p className="mt-2 grow text-pretty text-muted-foreground">{piece.description}</p>
                  {piece.href && (
                    <div className="mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        href={piece.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {piece.ctaLabel ?? 'Learn more'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bridge to Base (WFAIR) — secondary ── */}
      <section className="section">
        <div className="container">
          <div className="grid-cursor gap-0">
            <div className="col-span-full md:col-start-1 md:col-end-10 lg:col-start-1 lg:col-end-9">
              <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
                <span>[</span> <span>Optional</span> <span>]</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="type-md-lg text-balance">Bridge to Base (WFAIR)</h2>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Live now
                </span>
              </div>
            </div>
            <div className="col-span-full mt-v1 md:col-start-10 md:col-end-25 md:mt-0 lg:col-start-10 lg:col-end-25">
              <div className="type-base text-muted-foreground max-w-prose space-y-4">
                <p>
                  WFAIR is a 1:1 wrapped representation of FairCoin on{' '}
                  <span className="text-foreground">Base</span>, the Ethereum L2. It exists so
                  holders who want to use FAIR inside Ethereum DeFi can do so without giving up the
                  underlying coin. Optional, secondary, fully redeemable. The contract is verified
                  on Base mainnet and a Uniswap v3 pool against USDC is live with a 0.3% fee tier.
                </p>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    WFAIR contract
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground">
                    <span className="break-all">{WFAIR_CONTRACT_ADDRESS}</span>
                    <CopyButton text={WFAIR_CONTRACT_ADDRESS} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Uniswap v3 pool (WFAIR/USDC)
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground">
                    <span className="break-all">{UNISWAP_POOL_ADDRESS}</span>
                    <CopyButton text={UNISWAP_POOL_ADDRESS} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-g1 gap-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    href={UNISWAP_SWAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Trade on Uniswap
                  </Button>
                  <Button variant="outline" size="sm" href={bridgeHref}>
                    Bridge details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    href={WFAIR_BASESCAN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contract on Basescan
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    href={UNISWAP_POOL_EXPLORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pool on Uniswap
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    href={BRIDGE_SOURCE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Bridge source
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Community ── */}
      <section className="section">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>Community</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">
            Talk to the project
          </h2>
          <div className="grid gap-g1 grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-4">
            <a
              href={REDDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex h-full grow-1 flex-col transition-colors hover:border-primary/40"
            >
              <h3 className="type-base md:type-md text-foreground">Reddit</h3>
              <p className="mt-2 text-pretty text-muted-foreground">
                Discussions, AMAs and longer-form posts on r/FairCoin.
              </p>
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex h-full grow-1 flex-col transition-colors hover:border-primary/40"
            >
              <h3 className="type-base md:type-md text-foreground">Telegram</h3>
              <p className="mt-2 text-pretty text-muted-foreground">
                Day-to-day chat with maintainers and community.
              </p>
            </a>
            <a
              href={TWITTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex h-full grow-1 flex-col transition-colors hover:border-primary/40"
            >
              <h3 className="type-base md:type-md text-foreground">Twitter</h3>
              <p className="mt-2 text-pretty text-muted-foreground">
                Announcements and short updates from the FairCoin team.
              </p>
            </a>
            <a
              href={GITHUB_ORG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex h-full grow-1 flex-col transition-colors hover:border-primary/40"
            >
              <h3 className="type-base md:type-md text-foreground">GitHub</h3>
              <p className="mt-2 text-pretty text-muted-foreground">
                Every repository — chain, wallets, explorer, bridge — open on FairCoinOfficial.
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>FAQ</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">
            Frequently asked
          </h2>
          <div className="mx-auto max-w-3xl">
            {FAQS.map((faq) => (
              <FaqItemCard key={faq.question} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="section section--headline">
        <div className="container">
          <div className="relative flex items-center justify-center py-6">
            <div className="absolute inset-x-0 -top-16 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-40 sm:-top-32" />
            <div className="relative flex max-w-lg flex-col items-center space-y-8 text-center">
              <h2 className="type-xl sm:type-2xl text-balance gradient-text">
                Pitch in.
              </h2>
              <p className="type-base text-muted-foreground">
                Run a masternode. Stake FAIR. File an issue. Translate the wallet. Or just use
                FairCoin and tell someone about it.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-g1 gap-y-2">
                <Button href={fc('/buy')}>Buy FairCoin</Button>
                <Button
                  variant="outline"
                  href={`${FAIRCOIN_REPO_URL}#masternode-setup`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Run a masternode
                </Button>
                <Button
                  variant="ghost"
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join the community
                </Button>
              </div>
              <Link to={fc('/bridge')} className="type-sm underline text-muted-foreground">
                Looking for the WFAIR bridge? It's here.
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
