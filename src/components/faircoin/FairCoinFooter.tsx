import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fc } from '../../lib/faircoin-links'

const LOGO_URL = 'https://fairco.in/logo.jpg'

interface FooterColumnLink {
  label: string
  href: string
  external?: boolean
}

function buildFooterColumns(): ReadonlyArray<{ title: string; links: readonly FooterColumnLink[] }> {
  return [
    {
      title: 'FairCoin',
      links: [
        { label: 'About', href: 'https://fairco.in/about', external: true },
        { label: 'Explorer', href: 'https://explorer.fairco.in', external: true },
        { label: 'Token list', href: '/tokenlist.json', external: true },
        { label: 'Contract', href: 'https://basescan.org/address/0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3', external: true },
      ],
    },
    {
      title: 'Bridge',
      links: [
        { label: 'Use the bridge', href: fc('/bridge') },
        { label: 'Source on GitHub', href: 'https://github.com/FairCoinOfficial/faircoin-bridge', external: true },
        { label: 'Proof of reserves', href: 'https://fairco.in/reserves', external: true },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'Discord', href: 'https://discord.gg/faircoin', external: true },
        { label: 'Twitter', href: 'https://twitter.com/faircoin', external: true },
        { label: 'GitHub', href: 'https://github.com/FairCoinOfficial', external: true },
      ],
    },
  ] as const
}

function ExternalArrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="ml-0.5 -rotate-45 text-muted-foreground transition-colors duration-200 ease-in-out group-hover:text-foreground"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
        d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5"
      />
    </svg>
  )
}

function Divider() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}

const LINK_CLASS =
  'group -mx-1 flex w-fit items-center rounded-lg p-1 font-normal text-sm text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground'

function FooterLink({ link }: { link: { label: string; href: string; external?: boolean } }) {
  const content = (
    <>
      <span className="footer-hover-underline group-hover:duration-150">{link.label}</span>
      {link.external && <ExternalArrow />}
    </>
  )
  if (!link.external && link.href.startsWith('/')) {
    return (
      <Link to={link.href} className={LINK_CLASS}>
        {content}
      </Link>
    )
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      {content}
    </a>
  )
}

export default function FairCoinFooter() {
  const columns = useMemo(() => buildFooterColumns(), [])
  const homeHref = useMemo(() => fc('/'), [])

  return (
    <footer className="relative flex w-full flex-col justify-between bg-background">
      <Divider />
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="grid grid-cols-1 gap-10 px-px pt-10 pb-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Link
              to={homeHref}
              aria-label="FairCoin homepage"
              className="flex items-center gap-2"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img
                src={LOGO_URL}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-full"
                draggable={false}
              />
              <span className="text-lg font-semibold text-foreground">FairCoin</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              A community-run cryptocurrency bridging the original FairCoin chain to Ethereum L2. One FAIR, one WFAIR, fully redeemable.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="break-inside-avoid">
              <h2 className="py-1 text-sm font-medium text-foreground">{column.title}</h2>
              <ul className="flex flex-col">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <Divider />
          <div className="flex flex-wrap items-center justify-between gap-4 px-px py-4 text-xs text-muted-foreground">
            <p>fairco.in — community-maintained. WFAIR is experimental. No investment advice.</p>
            <a
              href="mailto:hello@fairco.in"
              className="transition-colors duration-150 hover:text-foreground"
            >
              hello@fairco.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
