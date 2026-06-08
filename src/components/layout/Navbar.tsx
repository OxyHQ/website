import { useState, useRef, useCallback, useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
import { Avatar } from '@oxyhq/bloom/avatar'
import {
  simpleNavLinks,
  resourcesNavCard,
  productNavDropdown,
  type NavDropdown,
  type NavItem,
} from '../../data/content'
import { NavCard, NavFeatureGrid } from './NavMegaPanels'
import { useNavigation, useSiteSettings } from '../../api/hooks'
import { subscribeScrollY, getScrollYSnapshot, getScrollYServerSnapshot } from '../../api/scrollStore'
import { useTranslation, useLocaleContext } from '../../lib/i18n'
import { searchSite, groupResults, GROUP_LABELS, type SearchResult } from '../../lib/site-search'
import NavDropdownItem from '../ui/NavDropdownItem'
import Button from '../ui/Button'
import Logo from '../ui/Logo'
import { SettingsPanel } from '../ui/SettingsPanel'
import { Settings, Search, X } from 'lucide-react'
import { useAccountPanel } from '../../contexts/AccountPanelContext'

/** Pseudo-dropdown key for the settings panel (theme + language), routed through
 *  the same shared viewport as the nav dropdowns. Prefixed so it never collides
 *  with a CMS label. */
const SETTINGS_DROPDOWN_KEY = '__settings__'

/* ─── SVG Icons ─── */
function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M5.25 7.125 9 10.875l3.75-3.75" />
    </svg>
  )
}

/* ─── Dropdown Content Panel ─── */
function DropdownContent({ dropdown }: { dropdown: NavDropdown }) {
  if (dropdown.featureGrid) return <NavFeatureGrid grid={dropdown.featureGrid} />

  const itemCount = (dropdown.sections ?? []).reduce((n, s) => n + (s.items?.length ?? 0), 0)
  const useGrid = itemCount > 6

  return (
    <div className="flex w-max">
      <ul
        className={`relative shrink-0 flex-col gap-1 p-4 pt-3 ${
          useGrid ? 'grid w-[720px] grid-cols-2 gap-x-3 max-xl:w-[576px]' : 'flex w-96'
        }`}
      >
        {dropdown.sections.flatMap((section, si) => [
          <li key={`heading-${si}`} className="contents">
            <p className={`mt-3 mb-1 inline-block px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${useGrid ? 'col-span-2' : ''}`}>
              {section.heading}
            </p>
          </li>,
          ...section.items.map((item, ii) => (
            <li key={`item-${si}-${ii}`} className="contents">
              <NavDropdownItem item={item} />
            </li>
          )),
        ])}
      </ul>

      {dropdown.card && (
        <div className="relative w-80 shrink-0 p-4 pt-3">
          <NavCard card={dropdown.card} />
        </div>
      )}

      {dropdown.sidePanel && (
        <ul className="relative flex w-48 shrink-0 flex-col gap-1.5 p-4 pt-3">
          <svg width="1" height="100%" className="absolute inset-y-0 left-0 text-foreground/20">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
          </svg>
          {dropdown.sidePanel.heading ? (
            <li className="contents">
              <p className="mt-3 mb-0.5 inline-block px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {dropdown.sidePanel.heading}
              </p>
            </li>
          ) : null}
          {dropdown.sidePanel.links.map((link, i) => (
            <li key={i} className="contents">
              {link.href.startsWith('/') ? (
                <Link
                  to={link.href}
                  className="inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-full border border-transparent px-2.5 text-sm text-foreground transition-colors duration-300 hover:bg-foreground/5"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-full border border-transparent px-2.5 text-sm text-foreground transition-colors duration-300 hover:bg-foreground/5"
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─── Main Navbar ─── */

/** Brand block (logo + home link) rendered at the start of the navbar. */
export interface NavbarBrand {
  /** Where the brand link points. Use `/` for Oxy, `fc('/')` for FairCoin. */
  homeHref: string
  /** Accessible label for the brand link. */
  ariaLabel: string
  /** Logo / wordmark element. Sized by the caller. */
  logo: React.ReactNode
}

/**
 * Flat top-level link rendered to the right of the dropdown triggers. Oxy uses
 * these for `Products` / `Pricing`; FairCoin uses one for the primary `Buy`
 * CTA. External links are auto-detected by the `href` scheme.
 */
export interface NavbarItem {
  label: string
  href: string
  external?: boolean
}

interface NavbarProps {
  /** Override the brand block. Defaults to the Oxy logo linking to `/`. */
  brand?: NavbarBrand
  /**
   * Replace CMS-driven dropdowns with the supplied list. Both Oxy (CMS) and
   * sub-brands (FairCoin) render through the SAME pipeline — the same
   * `DropdownContent`, the same measurement + animation, the same
   * `NavDropdownItem` item layout with icon, title, description. Sub-brands
   * skip the `useNavigation()` query by supplying this prop.
   */
  customDropdowns?: readonly NavDropdown[]
  /**
   * Replace the default `simpleNavLinks` (Products / Pricing) with a custom
   * flat link list rendered to the right of the dropdown triggers. FairCoin
   * uses this to surface a direct `Buy` link as the primary CTA.
   *
   * Only applied when `customDropdowns` is also provided — pairing the two
   * signals a sub-brand nav and disables the CMS queries.
   */
  customNavLinks?: readonly NavItem[]
  /** Replace the default Sign in / Start for free buttons. */
  ctaButtons?: React.ReactNode
  /** Hide the auth buttons / avatar entirely. */
  hideAuth?: boolean
  /** Hide the global announcement banner. */
  hideBanner?: boolean
  /** Hide the locale picker. */
  hideLocalePicker?: boolean
  /** Extra elements rendered before Sign in / Start for free on desktop, and before auth buttons on mobile */
  rightActions?: React.ReactNode
  /** Make navbar fully transparent with no border */
  transparent?: boolean
}

export default function Navbar({
  brand,
  customDropdowns,
  customNavLinks,
  ctaButtons,
  hideAuth,
  hideBanner,
  hideLocalePicker,
  rightActions,
  transparent,
}: NavbarProps = {}) {
  const { user, isAuthenticated, signIn } = useAuth()
  const accountPanel = useAccountPanel()
  const { t } = useTranslation()
  const { locales } = useLocaleContext()
  // The settings gear (theme + language) always shows; the language section
  // inside it only when more than one locale is offered.
  const showLanguageInSettings = !hideLocalePicker && locales.length > 1
  // Sub-brand mode: customDropdowns bypasses the CMS queries. The nav renders
  // the supplied dropdowns + flat links through the SAME pipeline as the CMS
  // path, so measurement, hover animation, and mobile accordion are identical.
  const useCustomNav = customDropdowns !== undefined
  const { data: navigationData } = useNavigation()
  const { data: siteSettings } = useSiteSettings()
  const dropdowns: readonly NavDropdown[] = useMemo(() => {
    if (useCustomNav) return customDropdowns ?? []
    // Hardcoded bridges until both are modelled in the CMS navigation document:
    // the `Product` feature-grid dropdown, and the Resources promo card.
    return [
      productNavDropdown,
      ...(navigationData ?? []).map((dd) =>
        dd.label === 'Resources' ? { ...dd, card: resourcesNavCard } : dd,
      ),
    ]
  }, [useCustomNav, customDropdowns, navigationData])
  const flatLinks: readonly NavItem[] = useMemo(
    () => (useCustomNav ? customNavLinks ?? [] : simpleNavLinks),
    [useCustomNav, customNavLinks],
  )
  const banner = siteSettings?.banner
  const dropdownLabels = useMemo(() => dropdowns.map((d) => d.label), [dropdowns])

  const scrollY = useSyncExternalStore(subscribeScrollY, getScrollYSnapshot, getScrollYServerSnapshot)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [activeResult, setActiveResult] = useState(0)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const bannerVisible = !hideBanner && !bannerDismissed && (banner?.visible ?? true)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [prevDropdown, setPrevDropdown] = useState<string | null>(null)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null)

  // Cached panel sizes (measured once on mount from hidden off-screen panels)
  const [panelSizes, setPanelSizes] = useState<Record<string, { w: number; h: number }>>({})
  const [dropdownLeft, setDropdownLeft] = useState(0)
  const [hasMeasured, setHasMeasured] = useState(false)

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const measureRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const prevDropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scheduled imperatively from openDropdown when we swap prevDropdown, so no
  // effect is needed to watch state transitions.
  const schedulePrevClear = useCallback(() => {
    if (prevDropdownTimerRef.current) clearTimeout(prevDropdownTimerRef.current)
    prevDropdownTimerRef.current = setTimeout(() => {
      setPrevDropdown(null)
      prevDropdownTimerRef.current = null
    }, 220)
  }, [])

  // Measure all panels once on mount (or whenever the dropdown list changes).
  useLayoutEffect(() => {
    const sizes: Record<string, { w: number; h: number }> = {}
    for (const dd of dropdowns) {
      const el = measureRefs.current[dd.label]
      if (el) {
        sizes[dd.label] = { w: el.scrollWidth, h: el.scrollHeight }
      }
    }
    const localeEl = measureRefs.current[SETTINGS_DROPDOWN_KEY]
    if (localeEl) {
      sizes[SETTINGS_DROPDOWN_KEY] = { w: localeEl.scrollWidth, h: localeEl.scrollHeight }
    }
    setPanelSizes(sizes)
    setHasMeasured(true)
  }, [dropdowns, showLanguageInSettings])

  // Align the panel with the active trigger: left edge for left-nav dropdowns,
  // right edge for the right-aligned language picker.
  useLayoutEffect(() => {
    if (!activeDropdown) return
    const trigger = triggerRefs.current[activeDropdown]
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    if (activeDropdown === SETTINGS_DROPDOWN_KEY) {
      const w = panelSizes[SETTINGS_DROPDOWN_KEY]?.w ?? 0
      setDropdownLeft(rect.right - w)
    } else {
      setDropdownLeft(rect.left)
    }
  }, [activeDropdown, panelSizes])

  const openDropdown = useCallback(
    (label: string) => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      if (label === activeDropdown) return

      if (activeDropdown && activeDropdown !== label) {
        const prevIndex = dropdownLabels.indexOf(activeDropdown)
        const nextIndex = dropdownLabels.indexOf(label)
        setDirection(nextIndex > prevIndex ? 'right' : 'left')
        setPrevDropdown(activeDropdown)
        schedulePrevClear()
      } else {
        setDirection(null)
        setPrevDropdown(null)
      }
      setActiveDropdown(label)
    },
    [activeDropdown, dropdownLabels, schedulePrevClear]
  )

  const closeAll = useCallback(() => {
    setActiveDropdown(null)
    setPrevDropdown(null)
    setDirection(null)
  }, [])

  const scheduleClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(closeAll, 200)
  }, [closeAll])

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  // React 19 callback ref — owns the global Escape handler lifecycle. Attaches when
  // the nav area mounts, detaches on unmount. Also clears any pending close timeout.
  const escapeRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setActiveDropdown(null)
      setPrevDropdown(null)
      setDirection(null)
      setMobileOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const getAnimClass = (label: string) => {
    if (label === activeDropdown) {
      if (!direction) return 'animate-nav-fade-in'
      return direction === 'right' ? 'animate-nav-enter-right' : 'animate-nav-enter-left'
    }
    if (label === prevDropdown && direction) {
      return direction === 'right' ? 'animate-nav-exit-left' : 'animate-nav-exit-right'
    }
    return ''
  }

  const isOpen = activeDropdown !== null
  const activeSize = activeDropdown ? panelSizes[activeDropdown] : null
  const easing = 'cubic-bezier(0.65,0,0.35,1)'

  // Derived from scrollY — no extra state needed
  const scrolled = scrollY > 50
  const bannerHeight = 40 // matches --site-header-banner-visible-height
  const bannerOffset = bannerVisible ? Math.max(0, bannerHeight - scrollY) : 0
  const isTransparent = transparent && !scrolled && !isOpen && !mobileOpen && !searchOpen

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setActiveResult(0)
  }, [])
  const runSearch = useCallback((q: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    searchDebounce.current = setTimeout(() => {
      searchSite(q).then((r) => {
        setSearchResults(r)
        setActiveResult(0)
      })
    }, 120)
  }, [])
  const searchGroups = useMemo(() => groupResults(searchResults), [searchResults])
  const flatResults = useMemo(() => searchGroups.flatMap((g) => g.items), [searchGroups])

  const linkClassName = (isTp: boolean) =>
    `inline-flex h-9 items-center justify-center rounded-full border border-transparent px-3 text-[15px] transition-colors duration-300 ${
      isTp
        ? 'text-white/80 hover:bg-white/10 hover:text-white'
        : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
    }`

  return (
    <>
      {/* ─── Banner ─── */}
      {bannerVisible && (
        <div
          className="site-banner dark fixed top-0 left-0 right-0 z-[51] flex h-(--site-header-banner-visible-height) items-center justify-center bg-(--color-banner-background)"
          style={{
            boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.01), 0px 2px 4px -1px rgba(0,0,0,0.02), 0px 4px 8px -2px rgba(0,0,0,0.03)',
            transform: `translateY(${-Math.min(scrollY, bannerHeight)}px)`,
          }}
        >
          <div className="container flex h-full items-center justify-center">
            <div className="relative flex size-full items-stretch justify-center px-12 max-md:justify-start max-md:pl-0">
              <Link
                className="group relative flex size-full items-center justify-center gap-1.5 text-white max-md:justify-start"
                to={banner?.href ?? '/inbox'}
              >
                <span className="attio-group-hover-underline relative truncate text-[13px]/5">
                  {banner?.text ?? t('navbar.bannerDefault')}
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-[translate] duration-400 ease-in-out group-hover:translate-x-0.25 group-hover:duration-150 group-active:translate-x-0.25 group-active:duration-50">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
                </svg>
              </Link>
              <button
                className="inline-flex cursor-pointer items-center justify-center text-nowrap border text-base transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default size-8 rounded-full button-outline !bg-transparent !border-transparent dark absolute top-1/2 right-0 -translate-y-1/2 hover:!border-muted-foreground"
                aria-label={t('common.dismissBanner')}
                onClick={() => setBannerDismissed(true)}
              >
                <svg className="text-white/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="m12.5 5.5-7 7m7 0-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    <header
      className={`fixed left-0 right-0 z-50 transition-[border-color,backdrop-filter] duration-300 ${isTransparent ? 'border-b border-transparent' : 'border-b border-border backdrop-blur-md'}`}
      style={{
        top: bannerOffset,
        background: isTransparent
          ? 'transparent'
          : mobileOpen
            ? 'var(--background)'
            : 'color-mix(in srgb, var(--background) 80%, transparent)',
      }}
    >

      {/* ─── Hidden measurement panels (off-screen, unstyled, for measuring natural size) ─── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -9999,
          top: -9999,
          visibility: 'hidden',
          pointerEvents: 'none',
          // Don't use display:none or opacity:0 — need real layout
        }}
      >
        {dropdowns.map((dd) => (
          <div key={dd.label} ref={(el) => { measureRefs.current[dd.label] = el }} style={{ display: 'inline-block' }}>
            <DropdownContent dropdown={dd} />
          </div>
        ))}
        <div ref={(el) => { measureRefs.current[SETTINGS_DROPDOWN_KEY] = el }} style={{ display: 'inline-block' }}>
          <SettingsPanel showLanguage={showLanguageInSettings} />
        </div>
      </div>

      {/* ─── Main nav ─── */}
      <div className="container max-lg:!max-w-full max-lg:!px-4">
        <nav className="py-[5px]">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4">
            {/* Desktop nav (left) */}
            <div ref={escapeRef} className="relative z-10 justify-self-start" onMouseLeave={scheduleClose}>
                <ul className={`hidden items-center gap-x-1.5 ${searchOpen ? '' : 'lg:flex'}`}>
                  {dropdowns.map((dd) => (
                    <li key={dd.label}>
                      <button
                        ref={(el) => { triggerRefs.current[dd.label] = el }}
                        className={`group inline-flex h-9 cursor-pointer select-none items-center justify-center gap-x-1.5 rounded-full border border-transparent px-3 text-[15px] transition-colors duration-300 ${isTransparent ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-foreground/5 hover:text-foreground'}`}
                        style={{
                          background: activeDropdown === dd.label ? 'color-mix(in srgb, var(--color-foreground) 5%, transparent)' : undefined,
                          color: activeDropdown === dd.label ? 'var(--color-foreground)' : isTransparent ? 'white' : 'var(--color-muted-foreground)',
                        }}
                        onMouseEnter={() => openDropdown(dd.label)}
                        aria-expanded={activeDropdown === dd.label}
                      >
                        <span>{dd.label}</span>
                        <ChevronDown className={`transition-transform duration-300 ${activeDropdown === dd.label ? 'translate-y-px' : ''}`} />
                      </button>
                    </li>
                  ))}
                  {flatLinks.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/') && !link.external ? (
                        <Link
                          to={link.href}
                          className={linkClassName(isTransparent ?? false)}
                          onMouseEnter={scheduleClose}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          className={linkClassName(isTransparent ?? false)}
                          onMouseEnter={scheduleClose}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>

              </div>

            {/* Center: logo, or the search field (Google Photos-style) when open */}
            {searchOpen ? (
              <div className="relative w-[min(460px,42vw)] justify-self-center">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    runSearch(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      closeSearch()
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setActiveResult((i) => Math.min(i + 1, flatResults.length - 1))
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setActiveResult((i) => Math.max(i - 1, 0))
                    } else if (e.key === 'Enter') {
                      const r = flatResults[activeResult]
                      if (r) {
                        e.preventDefault()
                        closeSearch()
                        navigate(r.url)
                      }
                    }
                  }}
                  placeholder={t('common.search')}
                  aria-label={t('common.search')}
                  className="h-10 w-full rounded-full border border-border bg-foreground/5 pl-11 pr-10 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/25 focus:bg-background"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label={t('common.closeSearch')}
                  className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>

                {searchQuery.trim() ? (
                  <div className="absolute left-0 right-0 top-full mt-2 max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl border border-border bg-background p-2 text-left shadow-xl">
                    {flatResults.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">{t('common.noResults')}</div>
                    ) : (
                      searchGroups.map((group, gi) => {
                        const offset = searchGroups.slice(0, gi).reduce((n, g) => n + g.items.length, 0)
                        return (
                          <div key={group.group} className="mb-2 last:mb-0">
                            <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              {GROUP_LABELS[group.group] ?? group.group}
                            </div>
                            <ul>
                              {group.items.map((r, idx) => {
                                const isActive = offset + idx === activeResult
                                return (
                                  <li key={r.id}>
                                    <button
                                      type="button"
                                      onMouseEnter={() => setActiveResult(offset + idx)}
                                      onClick={() => {
                                        closeSearch()
                                        navigate(r.url)
                                      }}
                                      className={`block w-full cursor-pointer rounded-xl px-3 py-2 text-left transition-colors ${isActive ? 'bg-foreground/5' : ''}`}
                                    >
                                      <div className="truncate text-sm text-foreground">{r.title}</div>
                                      <div className="truncate text-[11px] text-muted-foreground">{r.subtitle}</div>
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                to={brand?.homeHref ?? '/'}
                className="justify-self-center -mx-1.5 rounded-xl px-1.5"
                aria-label={brand?.ariaLabel ?? t('navbar.homepage')}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {brand?.logo ?? <Logo className="h-6" />}
              </Link>
            )}

            {/* Right controls (mobile + desktop) */}
            <div className="flex items-center justify-self-end gap-x-2">
              {/* Mobile controls */}
              <div className="flex items-center gap-x-2 lg:hidden">
              {!hideAuth && isAuthenticated && (
                <button onClick={accountPanel.toggle} className="cursor-pointer">
                  <Avatar source={user?.avatar} size={28} placeholderColor={user?.color} />
                </button>
              )}
              <button
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${isTransparent ? 'text-white' : 'text-muted-foreground'}`}
                aria-label={mobileOpen ? t('common.closeMenu') : t('common.openMenu')}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="24" height="24" fill="none">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m12.5 5.5-7 7m7 0-7-7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="24" height="24" fill="none">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M15 6H3M15 12H3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Desktop buttons */}
            <div className="hidden items-center gap-x-2.5 lg:flex">
              <button
                type="button"
                className={`group inline-flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-full border border-transparent transition-colors duration-300 ${isTransparent ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'hover:bg-foreground/5 hover:text-foreground'}`}
                style={{
                  background: searchOpen ? 'color-mix(in srgb, var(--color-foreground) 5%, transparent)' : undefined,
                  color: searchOpen ? 'var(--color-foreground)' : isTransparent ? 'white' : 'var(--color-muted-foreground)',
                }}
                onClick={() => {
                  closeAll()
                  setSearchOpen((open) => !open)
                }}
                aria-label={t('common.search')}
                aria-expanded={searchOpen}
              >
                <Search className="size-[18px]" />
              </button>
              <button
                ref={(el) => { triggerRefs.current[SETTINGS_DROPDOWN_KEY] = el }}
                className={`group inline-flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-full border border-transparent transition-colors duration-300 ${isTransparent ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'hover:bg-foreground/5 hover:text-foreground'}`}
                style={{
                  background: activeDropdown === SETTINGS_DROPDOWN_KEY ? 'color-mix(in srgb, var(--color-foreground) 5%, transparent)' : undefined,
                  color: activeDropdown === SETTINGS_DROPDOWN_KEY ? 'var(--color-foreground)' : isTransparent ? 'white' : 'var(--color-muted-foreground)',
                }}
                onMouseEnter={() => openDropdown(SETTINGS_DROPDOWN_KEY)}
                onMouseLeave={scheduleClose}
                onClick={() => (activeDropdown === SETTINGS_DROPDOWN_KEY ? closeAll() : openDropdown(SETTINGS_DROPDOWN_KEY))}
                aria-expanded={activeDropdown === SETTINGS_DROPDOWN_KEY}
                aria-label={t('footer.settings')}
              >
                <Settings className="size-[18px] transition-transform duration-300 group-hover:rotate-45" />
              </button>
              {rightActions}
              {ctaButtons ?? (
                hideAuth ? null : isAuthenticated ? (
                  <button onClick={accountPanel.toggle} className="cursor-pointer">
                    <Avatar
                      source={user?.avatar}
                      size={32}
                      placeholderColor={user?.color}
                    />
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signIn()}
                    className={isTransparent ? '!bg-white/10 !border-transparent !text-white hover:!bg-white/20' : ''}
                  >
                    {t('common.signIn')}
                  </Button>
                )
              )}
            </div>
            </div>
          </div>
        </nav>
      </div>

      {/* ─── Shared Dropdown Viewport ─── */}
      {hasMeasured && (
        <div
          className={`flex w-full ${isOpen ? 'pb-3 pt-3' : ''}`}
          style={{
            paddingLeft: dropdownLeft,
            pointerEvents: isOpen ? 'auto' : 'none',
            opacity: isOpen ? 1 : 0,
            maxHeight: isOpen && activeSize ? activeSize.h + 24 : 0,
            overflow: 'hidden',
            transition: `opacity ${isOpen ? '0.15s' : '0.12s'} ease-out, max-height 0.2s ${easing}, padding-left 0.2s ${easing}`,
          }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div
            className="overflow-hidden rounded-2xl border border-border"
            style={{
              width: activeSize ? activeSize.w : 0,
              height: activeSize ? activeSize.h : 0,
              transition: `width 0.2s ${easing}, height 0.2s ${easing}`,
              background: 'color-mix(in srgb, var(--background) 85%, transparent)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="relative">
              {dropdowns.map((dd) => {
                const isActive = dd.label === activeDropdown
                const isExiting = dd.label === prevDropdown
                const show = isActive || isExiting

                return (
                  <div
                    key={dd.label}
                    className={getAnimClass(dd.label)}
                    style={{
                      position: isActive ? 'relative' : 'absolute',
                      top: 0,
                      left: 0,
                      width: panelSizes[dd.label]?.w,
                      visibility: show ? 'visible' : 'hidden',
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                  >
                    <DropdownContent dropdown={dd} />
                  </div>
                )
              })}
              {(() => {
                const isActive = activeDropdown === SETTINGS_DROPDOWN_KEY
                const show = isActive || prevDropdown === SETTINGS_DROPDOWN_KEY
                return (
                  <div
                    className={isActive ? 'animate-nav-fade-in' : ''}
                    style={{
                      position: isActive ? 'relative' : 'absolute',
                      top: 0,
                      left: 0,
                      width: panelSizes[SETTINGS_DROPDOWN_KEY]?.w,
                      visibility: show ? 'visible' : 'hidden',
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                  >
                    <SettingsPanel showLanguage={showLanguageInSettings} />
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile drawer ─── */}
      {mobileOpen && (
        <div
          className="border-t border-border bg-background lg:hidden overflow-y-auto overscroll-contain"
          style={{ maxHeight: `calc(100dvh - ${bannerOffset}px - var(--site-header-height))` }}
        >
          <div className="container max-lg:!max-w-full max-lg:!px-4">
            <div className="flex flex-col gap-1 py-4">
              {dropdowns.map((dd) => (
                <div key={dd.label}>
                  <button
                    className="flex w-full items-center justify-between rounded-xl px-2 py-3 text-base text-foreground transition-colors hover:bg-foreground/5"
                    onClick={() => setMobileAccordion(mobileAccordion === dd.label ? null : dd.label)}
                    aria-expanded={mobileAccordion === dd.label}
                  >
                    {dd.label}
                    <ChevronDown className={`transition-transform duration-200 ${mobileAccordion === dd.label ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileAccordion === dd.label && (
                    // Same components as desktop, stacked vertically; the wrapper
                    // click closes the drawer when any link inside is tapped.
                    <div className="flex flex-col gap-1 pb-3" onClick={() => setMobileOpen(false)}>
                      {dd.featureGrid?.features.map((item) => (
                        <NavDropdownItem key={item.href} item={item} />
                      ))}
                      {dd.sections.map((section) => (
                        <div key={section.heading} className="flex flex-col gap-1">
                          {section.heading ? (
                            <p className="mt-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {section.heading}
                            </p>
                          ) : null}
                          {section.items.map((item) => (
                            <NavDropdownItem key={`${section.heading}-${item.title}`} item={item} />
                          ))}
                        </div>
                      ))}
                      {(dd.featureGrid?.cards?.length || dd.card) ? (
                        <div className="mt-2 flex flex-col gap-3">
                          {[...(dd.featureGrid?.cards ?? []), ...(dd.card ? [dd.card] : [])].map((card) => (
                            <div key={card.href} className="aspect-[4/3] overflow-hidden rounded-xl">
                              <NavCard card={card} />
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {dd.sidePanel?.links.map((link) => (
                        link.href.startsWith('/') ? (
                          <Link key={link.label} to={link.href} className="rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground">
                            {link.label}
                          </Link>
                        ) : (
                          <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground">
                            {link.label}
                          </a>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {flatLinks.map((link) =>
                link.href.startsWith('/') && !link.external ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="rounded-xl px-2 py-3 text-base text-foreground transition-colors hover:bg-foreground/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="rounded-xl px-2 py-3 text-base text-foreground transition-colors hover:bg-foreground/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ),
              )}
              <hr className="my-2 border-border" />
              {/* Settings — same component as the desktop gear (theme + language) */}
              <SettingsPanel showLanguage={showLanguageInSettings} className="w-full" />
              {ctaButtons ? (
                <div className="flex flex-col gap-2 px-2 pt-2">
                  {ctaButtons}
                </div>
              ) : (
                !hideAuth && !isAuthenticated && (
                  <div className="flex flex-col gap-2 px-2 pt-2">
                    {rightActions && <div className="flex flex-col gap-2">{rightActions}</div>}
                    <Button variant="outline" size="md" onClick={() => { signIn(); setMobileOpen(false) }} className="w-full">{t('common.signIn')}</Button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>

    {!transparent && <div style={{ height: `calc(var(--site-header-height) + ${bannerOffset}px)` }} />}
    </>
  )
}
