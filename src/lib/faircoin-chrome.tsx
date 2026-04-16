import { useMemo } from 'react'
import Button from '../components/ui/Button'
import { fc } from './faircoin-links'
import { isFairCoinHost } from './host'
import type { NavbarBrand, NavbarItem } from '../components/layout/Navbar'
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

export function useFairCoinNavItems(): readonly NavbarItem[] | undefined {
  const onFairCoinHost = isFairCoinHost()
  return useMemo(
    () =>
      onFairCoinHost
        ? ([
            { label: 'Home', href: fc('/') },
            { label: 'Buy', href: fc('/buy') },
            { label: 'Wallets', href: 'https://github.com/FairCoinOfficial/FAIRWallet/releases', external: true },
            { label: 'Network', href: 'https://explorer.fairco.in', external: true },
            { label: 'GitHub', href: 'https://github.com/FairCoinOfficial', external: true },
          ] as const)
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
                { label: 'Reddit', href: 'https://reddit.com/r/FairCoin', isExternal: true },
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
