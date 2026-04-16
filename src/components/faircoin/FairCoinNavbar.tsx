import { useCallback, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { subscribeScrollY, getScrollYSnapshot, getScrollYServerSnapshot } from '../../api/scrollStore'

interface FairCoinNavLink {
  label: string
  href: string
  external?: boolean
}

const NAV_LINKS: readonly FairCoinNavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Bridge', href: '/faircoin/bridge' },
  { label: 'Explorer', href: 'https://explorer.fairco.in', external: true },
  { label: 'GitHub', href: 'https://github.com/FairCoinOfficial', external: true },
  {
    label: 'Contract',
    href: 'https://basescan.org/address/0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3',
    external: true,
  },
]

const LOGO_URL = 'https://fairco.in/logo.png'

function NavLinkItem({ link, onNavigate }: { link: FairCoinNavLink; onNavigate?: () => void }) {
  const className =
    'inline-flex h-9 items-center justify-center rounded-full border border-transparent px-3 text-[15px] text-muted-foreground transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground'
  if (link.external) {
    return (
      <a href={link.href} className={className} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
        {link.label}
      </a>
    )
  }
  return (
    <Link to={link.href} className={className} onClick={onNavigate}>
      {link.label}
    </Link>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="24" height="24" fill="none">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m12.5 5.5-7 7m7 0-7-7" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="24" height="24" fill="none">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M15 6H3M15 12H3" />
    </svg>
  )
}

export default function FairCoinNavbar() {
  const scrollY = useSyncExternalStore(subscribeScrollY, getScrollYSnapshot, getScrollYServerSnapshot)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const scrolled = scrollY > 50

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-[border-color,backdrop-filter] duration-300 ${scrolled ? 'border-b border-border backdrop-blur-md' : 'border-b border-transparent'}`}
        style={{
          background: scrolled ? 'color-mix(in srgb, var(--background) 80%, transparent)' : 'transparent',
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <nav className="py-2 lg:py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex grow items-center gap-x-9">
                <Link
                  to="/"
                  className="flex items-center gap-2 -mx-1.5 rounded-xl px-1.5"
                  aria-label="FairCoin homepage"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <img
                    src={LOGO_URL}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full"
                    draggable={false}
                  />
                  <span className="text-base font-semibold text-foreground">FairCoin</span>
                </Link>

                <ul className="hidden items-center gap-x-1.5 lg:flex">
                  {NAV_LINKS.map((link) => (
                    <li key={link.label}>
                      <NavLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-x-2 lg:hidden">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground"
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  <MenuIcon open={mobileOpen} />
                </button>
              </div>

              <div className="hidden items-center gap-x-2.5 lg:flex">
                <Button
                  variant="outline"
                  size="sm"
                  href="https://github.com/FairCoinOfficial/faircoin-bridge"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View source
                </Button>
                <Button variant="primary" size="sm" href="/faircoin/bridge">
                  Use the bridge
                </Button>
              </div>
            </div>
          </nav>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background lg:hidden">
            <div className="mx-auto w-full max-w-[1200px] px-6">
              <div className="flex flex-col gap-1 py-4">
                {NAV_LINKS.map((link) => (
                  <div key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl px-4 py-3 text-base text-foreground transition-colors hover:bg-foreground/5"
                        onClick={closeMobile}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="block rounded-xl px-4 py-3 text-base text-foreground transition-colors hover:bg-foreground/5"
                        onClick={closeMobile}
                      >
                        {link.label}
                      </Link>
                    )}
                  </div>
                ))}
                <hr className="my-2 border-border" />
                <div className="flex flex-col gap-2 px-4 pt-2">
                  <Button
                    variant="outline"
                    size="md"
                    href="https://github.com/FairCoinOfficial/faircoin-bridge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    View source
                  </Button>
                  <Button variant="primary" size="md" href="/faircoin/bridge" className="w-full">
                    Use the bridge
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <div style={{ height: 'var(--site-header-height)' }} />
    </>
  )
}
