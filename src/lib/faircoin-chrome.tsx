import { useMemo } from 'react'
import Button from '../components/ui/Button'
import { fc } from './faircoin-links'
import { isFairCoinHost } from './host'
import type { NavbarBrand, NavbarGroupedItem } from '../components/layout/Navbar'
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
 * Grouped FairCoin navigation. Returns dropdown groups for Get FAIR / Network
 * / Developers / Community plus a flat "Buy" link as the primary CTA.
 *
 * Buy stays flat because it is the user's #1 action — surfacing it as a
 * dropdown would bury it. Everything else lives under labelled groups so the
 * top-level rail stays uncluttered.
 */
export function useFairCoinNavItems(): readonly NavbarGroupedItem[] | undefined {
  const onFairCoinHost = isFairCoinHost()
  return useMemo(
    () =>
      onFairCoinHost
        ? ([
            { label: 'Buy', href: fc('/buy') },
            {
              label: 'Get FAIR',
              children: [
                {
                  label: 'Buy with USDC',
                  href: fc('/buy'),
                  description: 'Pay USDC on Base, receive FAIR on the FairCoin chain.',
                },
                {
                  label: 'Redeem WFAIR',
                  href: fc('/unwrap'),
                  description: 'Burn WFAIR on Base for native FAIR.',
                },
                {
                  label: 'Get a wallet',
                  href: 'https://github.com/FairCoinOfficial/FAIRWallet/releases',
                  external: true,
                  description: 'FAIRWallet — iOS, Android, desktop.',
                },
                {
                  label: 'Run a masternode',
                  href: 'https://github.com/FairCoinOfficial/FairCoin#masternodes',
                  external: true,
                  description: 'Stake 5,000 FAIR and earn block rewards.',
                },
              ],
            },
            {
              label: 'Network',
              children: [
                {
                  label: 'Explorer',
                  href: 'https://explorer.fairco.in',
                  external: true,
                  description: 'Browse blocks, transactions, addresses.',
                },
                {
                  label: 'Live stats',
                  href: 'https://explorer.fairco.in/stats',
                  external: true,
                  description: 'Hashrate, masternodes, supply, mempool.',
                },
                {
                  label: 'Masternodes',
                  href: 'https://explorer.fairco.in/masternodes',
                  external: true,
                  description: 'Active masternode list and rewards.',
                },
                {
                  label: 'WFAIR contract',
                  href: 'https://basescan.org/address/0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3',
                  external: true,
                  description: 'Verified on Base mainnet.',
                },
                {
                  label: 'Uniswap pool',
                  href: 'https://app.uniswap.org/explore/tokens/base/0xf2853ceddf47a05fee0b4b24dff2925d59737fb3',
                  external: true,
                  description: 'WFAIR/USDC v3 pool on Base.',
                },
              ],
            },
            {
              label: 'Developers',
              children: [
                {
                  label: 'GitHub org',
                  href: 'https://github.com/FairCoinOfficial',
                  external: true,
                  description: 'All FairCoin source — chain, wallets, bridge.',
                },
                {
                  label: 'WFAIR bridge',
                  href: fc('/bridge'),
                  description: 'API reference and reserve dashboard.',
                },
                {
                  label: 'Bridge source',
                  href: BRIDGE_SOURCE_URL,
                  external: true,
                  description: 'faircoin-bridge service + contracts.',
                },
                {
                  label: 'Token list',
                  href: '/tokenlist.json',
                  external: true,
                  description: 'Standard token list — import WFAIR into wallets.',
                },
                {
                  label: 'FairCoin Core',
                  href: 'https://github.com/FairCoinOfficial/FairCoin',
                  external: true,
                  description: 'Reference daemon source.',
                },
              ],
            },
            {
              label: 'Community',
              children: [
                {
                  label: 'Reddit',
                  href: 'https://reddit.com/r/FairCoinOfficial',
                  external: true,
                  description: 'r/FairCoinOfficial — discussions and AMAs.',
                },
                {
                  label: 'Telegram',
                  href: 'https://t.me/FairCoin_',
                  external: true,
                  description: 'Day-to-day chat with maintainers.',
                },
                {
                  label: 'Twitter',
                  href: 'https://twitter.com/FairCoin_',
                  external: true,
                  description: 'Announcements and short updates.',
                },
              ],
            },
          ] as const satisfies readonly NavbarGroupedItem[])
        : undefined,
    [onFairCoinHost],
  )
}

export function useFairCoinNavCtaButtons(): React.ReactNode {
  const onFairCoinHost = isFairCoinHost()
  const buyHref = useMemo(() => fc('/buy'), [])
  return useMemo(
    () =>
      onFairCoinHost ? (
        <>
          <Button
            variant="outline"
            size="sm"
            href="https://github.com/FairCoinOfficial/FAIRWallet/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get a wallet
          </Button>
          <Button variant="primary" size="sm" href={buyHref}>
            Buy FairCoin
          </Button>
        </>
      ) : undefined,
    [onFairCoinHost, buyHref],
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
                {
                  label: 'FAIRWallet',
                  href: 'https://github.com/FairCoinOfficial/FAIRWallet/releases',
                  isExternal: true,
                },
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
