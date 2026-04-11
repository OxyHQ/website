import { Link } from 'react-router-dom'
import { useFooter } from '../../api/hooks'
import Logo from '../ui/Logo'
import { type FooterColumn, type FooterLink } from '../../data/content'

/* ─── Shared small components ─── */

function Divider() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}

function ExternalArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-0.5 -rotate-45 text-muted-foreground transition-colors duration-200 ease-in-out-cubic group-hover:text-foreground group-hover:delay-50 group-focus:text-foreground group-focus:delay-50 group-active:text-foreground group-active:duration-50">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
    </svg>
  )
}

function NewBadge() {
  return (
    <div className="ml-1.5 rounded-[10px] bg-primary px-1.5 py-1 font-normal text-[10px] text-primary-foreground leading-[7px] tracking-normal">
      New
    </div>
  )
}

/* ─── SVG Social Icons ─── */

function LinkedInIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  )
}



/* ─── Data ─── */

const SOCIAL_LINKS = [
  { label: 'LinkedIn', icon: LinkedInIcon, href: 'https://www.linkedin.com/company/oxyhq/' },
  { label: 'X', icon: XIcon, href: 'https://x.com/oxyhqinc' },
] as const

const LEGAL_LINKS = [
  { label: 'Legal', to: '/legal' },
  { label: 'Privacy Policy', to: '/legal/privacy' },
  { label: 'Cookie Policy', to: '/legal/cookies' },
  { label: 'Accessibility', to: '/legal/accessibility' },
  { label: 'Terms & Conditions', to: '/legal/terms' },
  { label: 'LLMs', to: '/legal/llms' },
  { label: 'Settings', to: '/settings' },
] as const

/* ─── Footer link (handles internal/external, badge, arrow) ─── */

const LINK_CLASS = 'group -mx-1 flex w-fit items-center rounded-lg p-1 font-normal text-sm text-muted-foreground transition-[color] duration-150 ease-out hover:text-foreground focus-visible:text-foreground active:text-foreground active:duration-50'

function FooterLinkItem({ link }: { link: FooterLink }) {
  const content = (
    <>
      <span className="footer-hover-underline group-hover:duration-150">{link.label}</span>
      {link.isNewBadge && <NewBadge />}
      {link.isExternal && <ExternalArrow />}
    </>
  )

  if (link.href.startsWith('/')) {
    return <Link to={link.href} className={LINK_CLASS}>{content}</Link>
  }

  return (
    <a
      href={link.href}
      {...(link.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={LINK_CLASS}
    >
      {content}
    </a>
  )
}

/* ─── Main component ─── */

export default function Footer() {
  const { data: footerData } = useFooter()
  const footerColumns = footerData?.columns ?? []

  return (
    <footer className="relative flex w-full flex-col justify-between bg-background">
      <Divider />

      {/* Columns */}
      <div className="container flex-1">
        <div className="px-px pt-10 pb-4">
          <div className="columns-4 gap-0 max-xl:columns-3 max-lg:columns-2 max-xs:columns-1">
            {footerColumns.map((column: FooterColumn) => (
              <div key={column.title} className="break-inside-avoid pb-5">
                <h2 className="py-1 text-foreground text-sm font-medium">{column.title}</h2>
                <ul className="flex flex-col">
                  {column.links.map((link: FooterLink) => (
                    <li key={link.label}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="w-full">
        <div className="container">
          <Divider />

          {/* Logo + Social row */}
          <div className="flex flex-wrap items-center justify-between gap-6 px-px pt-4 pb-4">
            <div className="flex flex-col gap-3">
              <Link className="-m-1.5 inline-block w-fit rounded-lg p-1.5" aria-label="Oxy homepage" to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Logo className="h-11" />
              </Link>
              <p className="max-w-lg text-sm text-muted-foreground">Oxy is an open-source technology ecosystem building ethical, privacy-first tools that serve humanity. From social networking to AI, messaging to housing — technology with purpose.</p>
            </div>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-400 ease-in-out hover:text-foreground hover:duration-150 active:text-foreground active:duration-50"
                  aria-label={`Oxy on ${label}`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Legal links */}
          <div className="grid grid-cols-4 gap-x-6 gap-y-2 px-px pb-6 font-normal text-muted-foreground text-sm max-lg:grid-cols-3 max-md:grid-cols-2">
            {LEGAL_LINKS.map(({ label, to }) => (
              <Link key={to} className="transition-colors duration-150 hover:text-foreground" to={to}>{label}</Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="px-px pb-4 font-normal text-muted-foreground text-xs">
            <p>Made with 💚 in the 🌎 by Oxy.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
