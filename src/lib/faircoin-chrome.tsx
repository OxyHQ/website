import { useMemo } from 'react'
import Button from '../components/ui/Button'
import { fc } from './faircoin-links'
import type { NavbarBrand, NavbarItem } from '../components/layout/Navbar'
import type { FooterBrand, FooterColumnConfig } from '../components/layout/Footer'

/**
 * FairCoin chrome configuration — the brand identity, primary navigation, and
 * footer content used whenever the reusable `Navbar` / `Footer` components
 * render on a FairCoin surface.
 *
 * Hooks that return data only (no React components). The shape mirrors the
 * CMS payload so when the FairCoin nav/footer is moved into the CMS the only
 * change is swapping the hook bodies for a `useQuery` against
 * `/api/faircoin/navigation` (or wiring a `surface` filter onto the existing
 * `/api/navigation` endpoint).
 */

const FAIRCOIN_LOGO_URL = 'https://fairco.in/logo.jpg'
const FAIRCOIN_NAME = 'FairCoin'
const BRIDGE_SOURCE_URL = 'https://github.com/FairCoinOfficial/faircoin-bridge'

export function useFairCoinNavbarBrand(): NavbarBrand {
  return useMemo(
    () => ({
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
    }),
    [],
  )
}

export function useFairCoinFooterBrand(): FooterBrand {
  return useMemo(
    () => ({
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
    }),
    [],
  )
}

export function useFairCoinNavItems(): readonly NavbarItem[] {
  return useMemo(
    () => [
      { label: 'Home', href: fc('/') },
      { label: 'Buy', href: fc('/buy') },
      { label: 'Wallets', href: 'https://github.com/FairCoinOfficial/FAIRWallet/releases', external: true },
      { label: 'Network', href: 'https://explorer.fairco.in', external: true },
      { label: 'GitHub', href: 'https://github.com/FairCoinOfficial', external: true },
    ],
    [],
  )
}

export function useFairCoinNavCtaButtons(): React.ReactNode {
  const buyHref = useMemo(() => fc('/buy'), [])
  return useMemo(
    () => (
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
    ),
    [buyHref],
  )
}

export function useFairCoinFooterColumns(): readonly FooterColumnConfig[] {
  return useMemo(
    () => [
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
          { label: 'Discord', href: 'https://discord.gg/faircoin', isExternal: true },
          { label: 'Twitter', href: 'https://twitter.com/faircoin', isExternal: true },
          { label: 'GitHub', href: 'https://github.com/FairCoinOfficial', isExternal: true },
        ],
      },
    ],
    [],
  )
}

export function useFairCoinFooterLegalLinks() {
  return useMemo(
    () => [
      {
        label: 'fairco.in',
        href: 'https://fairco.in',
        isExternal: true as const,
      },
    ],
    [],
  )
}

export function useFairCoinFooterCopyright(): string {
  return 'fairco.in — community-maintained. WFAIR is experimental. No investment advice.'
}
