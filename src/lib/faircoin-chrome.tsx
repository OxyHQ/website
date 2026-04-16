import { useMemo } from 'react'
import Button from '../components/ui/Button'
import { fc } from './faircoin-links'
import { isFairCoinHost } from './host'
import type {
  NavbarBrand,
  NavbarGroupedItem,
  NavbarGroupItem,
} from '../components/layout/Navbar'
import type { FooterBrand, FooterColumnConfig } from '../components/layout/Footer'

/**
 * FairCoin chrome configuration — the brand identity, primary navigation, and
 * footer content used whenever the reusable `Navbar` / `Footer` components
 * render on a FairCoin surface.
 *
 * Each hook returns the FairCoin variant when the document is served from a
 * FairCoin host (fairco.in / www.fairco.in), and `undefined` otherwise. The
 * `Navbar` and `Footer` components fall back to their Oxy defaults when given
 * `undefined`, so on `oxy.so/faircoin*` pages the chrome stays Oxy and only
 * the page body shows FairCoin content — the page reads as an Oxy subpage.
 *
 * Hooks return data only (no React components). The shape mirrors the CMS
 * payload so when the FairCoin nav/footer is moved into the CMS the only
 * change is swapping the hook bodies for a `useQuery` against
 * `/api/faircoin/navigation` (or wiring a `surface` filter onto the existing
 * `/api/navigation` endpoint).
 */

const FAIRCOIN_LOGO_URL = 'https://fairco.in/logo.jpg'
const FAIRCOIN_NAME = 'FairCoin'
const BRIDGE_SOURCE_URL = 'https://github.com/FairCoinOfficial/faircoin-bridge'

/* ───────────────────────── Inline icon glyphs ───────────────────────── */

function CoinsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="12" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15 6.5a6 6 0 0 1 0 11M15 9.5a3 3 0 0 1 0 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 7h13M7 7l3-3M7 7l3 3M17 17H4M17 17l-3 3M17 17l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M21 10h-4a2 2 0 0 0 0 4h4M16 12h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function ServerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="13" width="18" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 7.5h.01M7 16.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function ExploreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 9.5l-1.5 4.5-4.5 1.5 1.5-4.5 4.5-1.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 14l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function NetworkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="5" cy="18" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="18" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
function ContractIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function PoolIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="12" r="6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="12" r="6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}
function CodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function PackageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

/* ───────────────────────── Brand / footer hooks ───────────────────────── */

export function useFairCoinNavbarBrand(): NavbarBrand | undefined {
  const onFairCoinHost = isFairCoinHost()
  return useMemo(
    () =>
      onFairCoinHost
        ? {
            homeHref: fc('/'),
            ariaLabel: 'FairCoin homepage',
            logo: (
              <span className="flex items-center gap-2">
                <img
                  src={FAIRCOIN_LOGO_URL}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full"
                  draggable={false}
                />
                <span className="text-base font-semibold text-foreground">{FAIRCOIN_NAME}</span>
              </span>
            ),
          }
        : undefined,
    [onFairCoinHost],
  )
}

export function useFairCoinFooterBrand(): FooterBrand | undefined {
  const onFairCoinHost = isFairCoinHost()
  return useMemo(
    () =>
      onFairCoinHost
        ? {
            homeHref: fc('/'),
            ariaLabel: 'FairCoin homepage',
            logo: (
              <span className="flex items-center gap-2">
                <img
                  src={FAIRCOIN_LOGO_URL}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full"
                  draggable={false}
                />
                <span className="text-lg font-semibold text-foreground">{FAIRCOIN_NAME}</span>
              </span>
            ),
            description:
              'A community-run cryptocurrency. Decentralized, fair, free of speculation. Maintained by volunteers since 2014.',
          }
        : undefined,
    [onFairCoinHost],
  )
}

/**
 * Grouped FairCoin navigation. Returns rich dropdown panels for Get FAIR /
 * Network / Developers / Community plus a flat "Buy" link as the primary CTA.
 *
 * Buy stays flat because it is the user's #1 action — surfacing it as a
 * dropdown would bury it. Everything else lives under labelled groups so the
 * top-level rail stays uncluttered.
 *
 * Each item carries a description and an icon, mirroring the Oxy CMS dropdown
 * layout. The Network group uses `columns` (Explore + Run) for a two-column
 * panel; the others use `children` for a richer single-column list.
 */
export function useFairCoinNavItems(): readonly NavbarGroupedItem[] | undefined {
  const onFairCoinHost = isFairCoinHost()
  return useMemo(() => {
    if (!onFairCoinHost) return undefined

    const getFairChildren: readonly NavbarGroupItem[] = [
      {
        label: 'Buy with USDC',
        href: fc('/buy'),
        description: 'Pay USDC on Base, receive FAIR on the FairCoin chain.',
        icon: <CoinsIcon />,
      },
      {
        label: 'Redeem WFAIR',
        href: fc('/unwrap'),
        description: 'Burn WFAIR on Base for native FAIR.',
        icon: <SwapIcon />,
      },
      {
        label: 'Get a wallet',
        href: fc('/wallet'),
        description: 'FAIRWallet — Android, iOS, desktop.',
        icon: <WalletIcon />,
      },
      {
        label: 'Run a masternode',
        href: 'https://github.com/FairCoinOfficial/FairCoin#masternodes',
        external: true,
        description: 'Stake 5,000 FAIR and earn block rewards.',
        icon: <ServerIcon />,
      },
    ]

    const exploreColumn: readonly NavbarGroupItem[] = [
      {
        label: 'Block explorer',
        href: 'https://explorer.fairco.in',
        external: true,
        description: 'Browse blocks, transactions, addresses.',
        icon: <ExploreIcon />,
      },
      {
        label: 'Live stats',
        href: 'https://explorer.fairco.in/stats',
        external: true,
        description: 'Hashrate, supply, mempool, peers.',
        icon: <ChartIcon />,
      },
      {
        label: 'Masternodes',
        href: 'https://explorer.fairco.in/masternodes',
        external: true,
        description: 'Active masternode list and rewards.',
        icon: <NetworkIcon />,
      },
      {
        label: 'WFAIR contract',
        href: 'https://basescan.org/address/0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3',
        external: true,
        description: 'Verified on Base mainnet.',
        icon: <ContractIcon />,
      },
    ]

    const runColumn: readonly NavbarGroupItem[] = [
      {
        label: 'FAIRWallet',
        href: fc('/wallet'),
        description: 'Self-custody wallet for every platform.',
        icon: <WalletIcon />,
      },
      {
        label: 'FAIRNode',
        href: 'https://github.com/FairCoinOfficial/FAIRNode/releases',
        external: true,
        description: 'Desktop full node with one-click setup.',
        icon: <ServerIcon />,
      },
      {
        label: 'FairCoin Core',
        href: 'https://github.com/FairCoinOfficial/FairCoin',
        external: true,
        description: 'Reference daemon, build from source.',
        icon: <CodeIcon />,
      },
      {
        label: 'Uniswap pool',
        href: 'https://app.uniswap.org/explore/tokens/base/0xf2853ceddf47a05fee0b4b24dff2925d59737fb3',
        external: true,
        description: 'WFAIR/USDC v3 pool on Base.',
        icon: <PoolIcon />,
      },
    ]

    const developersChildren: readonly NavbarGroupItem[] = [
      {
        label: 'GitHub org',
        href: 'https://github.com/FairCoinOfficial',
        external: true,
        description: 'All FairCoin source — chain, wallets, bridge.',
        icon: <GithubIcon />,
      },
      {
        label: 'WFAIR bridge',
        href: fc('/bridge'),
        description: 'API reference and reserve dashboard.',
        icon: <SwapIcon />,
      },
      {
        label: 'Bridge source',
        href: BRIDGE_SOURCE_URL,
        external: true,
        description: 'faircoin-bridge service + smart contracts.',
        icon: <CodeIcon />,
      },
      {
        label: 'Token list',
        href: '/tokenlist.json',
        external: true,
        description: 'Standard token list — import WFAIR into wallets.',
        icon: <PackageIcon />,
      },
      {
        label: 'FairCoin Core',
        href: 'https://github.com/FairCoinOfficial/FairCoin',
        external: true,
        description: 'Reference daemon source.',
        icon: <ServerIcon />,
      },
    ]

    const communityChildren: readonly NavbarGroupItem[] = [
      {
        label: 'Reddit',
        href: 'https://reddit.com/r/FairCoinOfficial',
        external: true,
        description: 'r/FairCoinOfficial — discussions and AMAs.',
        icon: <ChatIcon />,
      },
      {
        label: 'Telegram',
        href: 'https://t.me/FairCoin_',
        external: true,
        description: 'Day-to-day chat with maintainers.',
        icon: <SendIcon />,
      },
      {
        label: 'Twitter',
        href: 'https://twitter.com/FairCoin_',
        external: true,
        description: 'Announcements and short updates.',
        icon: <TwitterIcon />,
      },
    ]

    return [
      { label: 'Buy', href: fc('/buy') },
      { label: 'Get FAIR', children: getFairChildren },
      {
        label: 'Network',
        columns: [
          { title: 'Explore', items: exploreColumn },
          { title: 'Run', items: runColumn },
        ],
      },
      { label: 'Developers', children: developersChildren },
      { label: 'Community', children: communityChildren },
    ] satisfies readonly NavbarGroupedItem[]
  }, [onFairCoinHost])
}

export function useFairCoinNavCtaButtons(): React.ReactNode {
  const onFairCoinHost = isFairCoinHost()
  const buyHref = useMemo(() => fc('/buy'), [])
  const walletHref = useMemo(() => fc('/wallet'), [])
  return useMemo(
    () =>
      onFairCoinHost ? (
        <>
          <Button variant="outline" size="sm" href={walletHref}>
            Get a wallet
          </Button>
          <Button variant="primary" size="sm" href={buyHref}>
            Buy FairCoin
          </Button>
        </>
      ) : undefined,
    [onFairCoinHost, buyHref, walletHref],
  )
}

export function useFairCoinFooterColumns(): readonly FooterColumnConfig[] | undefined {
  const onFairCoinHost = isFairCoinHost()
  return useMemo(
    () =>
      onFairCoinHost
        ? [
            {
              title: 'FairCoin',
              links: [
                { label: 'About', href: 'https://fairco.in/about', isExternal: true },
                { label: 'Explorer', href: 'https://explorer.fairco.in', isExternal: true },
                {
                  label: 'Source',
                  href: 'https://github.com/FairCoinOfficial/FairCoin',
                  isExternal: true,
                },
              ],
            },
            {
              title: 'Get FAIR',
              links: [
                { label: 'Buy FairCoin', href: fc('/buy') },
                { label: 'FAIRWallet', href: fc('/wallet') },
                {
                  label: 'FAIRNode',
                  href: 'https://github.com/FairCoinOfficial/FAIRNode/releases',
                  isExternal: true,
                },
                {
                  label: 'Run a masternode',
                  href: 'https://github.com/FairCoinOfficial/FairCoin#masternodes',
                  isExternal: true,
                },
              ],
            },
            {
              title: 'Advanced',
              links: [
                { label: 'WFAIR bridge', href: fc('/bridge') },
                { label: 'Bridge source', href: BRIDGE_SOURCE_URL, isExternal: true },
                { label: 'Token list', href: '/tokenlist.json', isExternal: true },
              ],
            },
            {
              title: 'Community',
              links: [
                { label: 'Reddit', href: 'https://reddit.com/r/FairCoinOfficial', isExternal: true },
                { label: 'Telegram', href: 'https://t.me/FairCoin_', isExternal: true },
                { label: 'Twitter', href: 'https://twitter.com/FairCoin_', isExternal: true },
                { label: 'GitHub', href: 'https://github.com/FairCoinOfficial', isExternal: true },
              ],
            },
          ]
        : undefined,
    [onFairCoinHost],
  )
}

export function useFairCoinFooterLegalLinks() {
  const onFairCoinHost = isFairCoinHost()
  return useMemo(
    () =>
      onFairCoinHost
        ? [
            {
              label: 'fairco.in',
              href: 'https://fairco.in',
              isExternal: true as const,
            },
          ]
        : undefined,
    [onFairCoinHost],
  )
}

export function useFairCoinFooterCopyright(): string | undefined {
  return isFairCoinHost()
    ? 'fairco.in — community-maintained. WFAIR is experimental. No investment advice.'
    : undefined
}
