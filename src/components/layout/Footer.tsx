import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useFooter } from '../../api/hooks'
import { useTranslation } from '../../lib/i18n'
import Logo from '../ui/Logo'
import { usePageChromeStore } from '../../stores/pageChromeStore'
import { type FooterLink } from '../../data/content'

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
    <NewBadgeInner />
  )
}

function NewBadgeInner() {
  const { t } = useTranslation()
  return (
    <div className="ml-1.5 rounded-[10px] bg-primary px-1.5 py-1 font-normal text-[10px] text-primary-foreground leading-[7px] tracking-normal">
      {t('common.new')}
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

function MentionFooterIcon() {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12a4 4 0 1 1 8 0c0 2.5-2 3-2 3" strokeLinecap="round" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    </svg>
  )
}



/* ─── Data ─── */

interface SocialLink {
  label: string
  icon: () => React.JSX.Element
  href: string
}

// Brand social URLs are constant; labels are translated via `t()` at render time.
const SOCIAL_URLS = {
  linkedIn: 'https://www.linkedin.com/company/oxyhq/',
  x: 'https://x.com/oxyhqinc',
  mention: 'https://mention.earth',
} as const

interface LegalLink {
  label: string
  /** Internal route (uses react-router Link) when this is set. */
  to?: string
  /** External URL (uses an anchor tag) when this is set instead of `to`. */
  href?: string
  isExternal?: boolean
}

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

  if (link.href.startsWith('/') && !link.isExternal) {
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

/** Brand block (logo + description + home link) for the footer. */
export interface FooterBrand {
  homeHref: string
  ariaLabel: string
  /** Logo / wordmark element. Sized by the caller. */
  logo: React.ReactNode
  description: string
}

/** A single footer column. Mirrors the CMS shape so it's easy to swap later. */
export interface FooterColumnConfig {
  title: string
  links: readonly FooterLink[]
}

interface FooterProps {
  /** Override the brand block. Defaults to Oxy logo + description. */
  brand?: FooterBrand
  /**
   * Override the column data. When omitted, columns come from the CMS via
   * `useFooter()` — preserving existing Oxy behavior.
   */
  columns?: readonly FooterColumnConfig[]
  socialLinks?: readonly SocialLink[]
  legalLinks?: readonly LegalLink[]
  copyright?: string
}

export default function Footer({
  brand,
  columns,
  socialLinks,
  legalLinks,
  copyright,
}: FooterProps = {}) {
  const { t } = useTranslation()
  const useCmsColumns = columns === undefined
  const { data: footerData } = useFooter()
  const footerColumns: readonly { title: string; links: readonly FooterLink[] }[] = useCmsColumns
    ? footerData?.columns ?? []
    : columns ?? []
  const defaultSocial: readonly SocialLink[] = [
    { label: t('footer.socialLinkedIn'), icon: LinkedInIcon, href: SOCIAL_URLS.linkedIn },
    { label: t('footer.socialX'), icon: XIcon, href: SOCIAL_URLS.x },
    { label: t('footer.socialMention'), icon: MentionFooterIcon, href: SOCIAL_URLS.mention },
  ]
  const defaultLegal: readonly LegalLink[] = [
    { label: t('footer.legal'), to: '/legal' },
    { label: t('footer.privacyPolicy'), to: '/legal/privacy' },
    { label: t('footer.cookiePolicy'), to: '/legal/cookies' },
    { label: t('footer.accessibility'), to: '/legal/accessibility' },
    { label: t('footer.termsAndConditions'), to: '/legal/terms' },
    { label: t('footer.llms'), to: '/legal/llms' },
    { label: t('footer.settings'), to: '/settings' },
  ]
  const social = socialLinks ?? defaultSocial
  const legal = legalLinks ?? defaultLegal
  const copyrightText = copyright ?? t('footer.copyright')
  const description = brand?.description ?? t('footer.description')
  const homeHref = brand?.homeHref ?? '/'
  const ariaLabel = brand?.ariaLabel ?? t('navbar.homepage')
  const setFooterVisible = usePageChromeStore((s) => s.setFooterVisible)

  return (
    <motion.footer
      className="relative flex w-full flex-col justify-between bg-background"
      onViewportEnter={() => setFooterVisible(true)}
      onViewportLeave={() => setFooterVisible(false)}
      viewport={{ amount: 0 }}
    >
      <Divider />

      {/* Columns */}
      {footerColumns.length > 0 && (
        <div className="container flex-1">
          <div className="px-px pt-10 pb-4">
            <div className="columns-4 gap-0 max-xl:columns-3 max-lg:columns-2 max-xs:columns-1">
              {footerColumns.map((column) => (
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
      )}

      {/* Bottom bar */}
      <div className="w-full">
        <div className="container">
          <Divider />

          {/* Logo + Social row */}
          <div className="flex flex-wrap items-center justify-between gap-6 px-px pt-4 pb-4">
            <div className="flex flex-col gap-3">
              <Link className="-m-1.5 inline-block w-fit rounded-lg p-1.5" aria-label={ariaLabel} to={homeHref} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                {brand?.logo ?? <Logo className="h-11" />}
              </Link>
              <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
            </div>
            {social.length > 0 && (
              <div className="flex items-center gap-3">
                {social.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-400 ease-in-out hover:text-foreground hover:duration-150 active:text-foreground active:duration-50"
                    aria-label={`${ariaLabel.replace(/ homepage$/i, '')} on ${label}`}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Legal links */}
          {legal.length > 0 && (
            <div className="grid grid-cols-4 gap-x-6 gap-y-2 px-px pb-6 font-normal text-muted-foreground text-sm max-lg:grid-cols-3 max-md:grid-cols-2">
              {legal.map((item) => {
                if (item.to) {
                  return (
                    <Link key={item.label} className="transition-colors duration-150 hover:text-foreground" to={item.to}>
                      {item.label}
                    </Link>
                  )
                }
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    {...(item.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="transition-colors duration-150 hover:text-foreground"
                  >
                    {item.label}
                  </a>
                )
              })}
            </div>
          )}

          {/* Copyright */}
          <div className="px-px pb-4 font-normal text-muted-foreground text-xs">
            <p>{copyrightText}</p>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
