import { useMemo } from 'react'
import Button from '../components/ui/Button'
import { fc } from './faircoin-links'
import { isFairCoinHost } from './host'
import type { NavbarBrand } from '../components/layout/Navbar'
import type { NavDropdown, NavItem } from '../data/content'
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
 * Hooks return CMS-shaped data (`NavDropdown[]`, `NavItem[]`, …). The Navbar
 * renders FairCoin through the SAME dropdown pipeline (`DropdownContent`,
 * `NavDropdownItem`, measurement + animation) used for Oxy — so when the
 * FairCoin nav eventually moves into the CMS the only change is swapping the
 * hook bodies for a `useQuery` against `/api/faircoin/navigation`.
 */

const FAIRCOIN_LOGO_URL = 'https://fairco.in/logo.jpg'
const FAIRCOIN_NAME = 'FairCoin'
const BRIDGE_SOURCE_URL = 'https://github.com/FairCoinOfficial/faircoin-bridge'

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
 * FairCoin dropdown panels (Get FAIR / Network / Developers / Community),
 * shaped like CMS `NavDropdown`s so they render through the SAME Navbar
 * pipeline as the Oxy CMS dropdowns — `DropdownContent` + `NavDropdownItem`
 * with icon, title, description, multi-column auto-layout, sidePanel.
 *
 * Icons reference string keys resolved by `iconMap` in `NavDropdownItem.tsx`.
 * Keys listed there are shared with Oxy icons (`ai`, `apps`, …) plus FairCoin
 * glyphs (`wallet`, `bridge`, `coins`, `network`, `explorer`, `contract`,
 * `pool`, `swap`, `chart`, `github`, `package`, `chat`, `send`, `twitter`).
 */
export function useFairCoinDropdowns(): readonly NavDropdown[] | undefined {
  const onFairCoinHost = isFairCoinHost()
  return useMemo(() => {
    if (!onFairCoinHost) return undefined

    const getFair: NavDropdown = {
      label: 'Get FAIR',
      sections: [
        {
          heading: 'Get FAIR',
          items: [
            {
              title: 'Buy with USDC',
              description: 'Pay USDC on Base, receive FAIR on the FairCoin chain.',
              href: fc('/buy'),
              icon: 'coins',
            },
            {
              title: 'Redeem WFAIR',
              description: 'Burn WFAIR on Base for native FAIR.',
              href: fc('/unwrap'),
              icon: 'swap',
            },
            {
              title: 'Get a wallet',
              description: 'FAIRWallet — Android, iOS, desktop.',
              href: fc('/wallet'),
              icon: 'wallet',
            },
            {
              title: 'Run a masternode',
              description: 'Stake 5,000 FAIR and earn block rewards.',
              href: 'https://github.com/FairCoinOfficial/FairCoin#masternodes',
              icon: 'masternode',
            },
          ],
        },
      ],
    }

    const network: NavDropdown = {
      label: 'Network',
      sections: [
        {
          heading: 'Explore',
          items: [
            {
              title: 'Block explorer',
              description: 'Browse blocks, transactions, addresses.',
              href: 'https://explorer.fairco.in',
              icon: 'explorer',
            },
            {
              title: 'Live stats',
              description: 'Hashrate, supply, mempool, peers.',
              href: 'https://explorer.fairco.in/stats',
              icon: 'chart',
            },
            {
              title: 'Masternodes',
              description: 'Active masternode list and rewards.',
              href: 'https://explorer.fairco.in/masternodes',
              icon: 'network',
            },
            {
              title: 'WFAIR contract',
              description: 'Verified on Base mainnet.',
              href: 'https://basescan.org/address/0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3',
              icon: 'contract',
            },
          ],
        },
        {
          heading: 'Run',
          items: [
            {
              title: 'FAIRWallet',
              description: 'Self-custody wallet for every platform.',
              href: fc('/wallet'),
              icon: 'wallet',
            },
            {
              title: 'FAIRNode',
              description: 'Desktop full node with one-click setup.',
              href: 'https://github.com/FairCoinOfficial/FAIRNode/releases',
              icon: 'masternode',
            },
            {
              title: 'FairCoin Core',
              description: 'Reference daemon, build from source.',
              href: 'https://github.com/FairCoinOfficial/FairCoin',
              icon: 'developers',
            },
            {
              title: 'Uniswap pool',
              description: 'WFAIR/USDC v3 pool on Base.',
              href: 'https://app.uniswap.org/explore/tokens/base/0xf2853ceddf47a05fee0b4b24dff2925d59737fb3',
              icon: 'pool',
            },
          ],
        },
      ],
    }

    const developers: NavDropdown = {
      label: 'Developers',
      sections: [
        {
          heading: 'Developers',
          items: [
            {
              title: 'GitHub org',
              description: 'All FairCoin source — chain, wallets, bridge.',
              href: 'https://github.com/FairCoinOfficial',
              icon: 'github',
            },
            {
              title: 'WFAIR bridge',
              description: 'API reference and reserve dashboard.',
              href: fc('/bridge'),
              icon: 'bridge',
            },
            {
              title: 'Bridge source',
              description: 'faircoin-bridge service + smart contracts.',
              href: BRIDGE_SOURCE_URL,
              icon: 'developers',
            },
            {
              title: 'Token list',
              description: 'Standard token list — import WFAIR into wallets.',
              href: 'https://fairco.in/tokenlist.json',
              icon: 'package',
            },
            {
              title: 'FairCoin Core',
              description: 'Reference daemon source.',
              href: 'https://github.com/FairCoinOfficial/FairCoin',
              icon: 'masternode',
            },
          ],
        },
      ],
    }

    const community: NavDropdown = {
      label: 'Community',
      sections: [
        {
          heading: 'Community',
          items: [
            {
              title: 'Reddit',
              description: 'r/FairCoinOfficial — discussions and AMAs.',
              href: 'https://reddit.com/r/FairCoinOfficial',
              icon: 'chat',
            },
            {
              title: 'Telegram',
              description: 'Day-to-day chat with maintainers.',
              href: 'https://t.me/FairCoin_',
              icon: 'send',
            },
            {
              title: 'Twitter',
              description: 'Announcements and short updates.',
              href: 'https://twitter.com/FairCoin_',
              icon: 'twitter',
            },
          ],
        },
      ],
    }

    return [getFair, network, developers, community]
  }, [onFairCoinHost])
}

/**
 * Flat top-level nav links (rendered right of the dropdown triggers).
 * FairCoin surfaces a direct `Buy` link as the primary CTA; everything else
 * lives under dropdowns so the rail stays uncluttered.
 */
export function useFairCoinSimpleNavLinks(): readonly NavItem[] | undefined {
  const onFairCoinHost = isFairCoinHost()
  const buyHref = useMemo(() => fc('/buy'), [])
  return useMemo(
    () => (onFairCoinHost ? [{ label: 'Buy', href: buyHref }] : undefined),
    [onFairCoinHost, buyHref],
  )
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
