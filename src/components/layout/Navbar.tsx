import { Fragment, useState, useRef, useCallback, useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogoIcon, ProfileButton } from '@oxyhq/services'
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
import { searchSite, groupResults, searchContextGroups, GROUP_LABELS, type SearchResult } from '../../lib/site-search'
import NavDropdownItem from '../ui/NavDropdownItem'
import { SettingsPanel } from '../ui/SettingsPanel'
import { Settings, Search, X } from 'lucide-react'
import { ArrowRightIcon } from '../icons'
import { useAdminAccess } from '../../hooks/useAdminAccess'

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

  return (
    <div className="flex w-full">
      {/*
        `auto-fit` decides the column count from the width the band actually has,
        so the panel gains columns on a wide viewport with no breakpoint table to
        keep in sync. `dense` lets a one-item section backfill the hole a wider
        neighbour leaves. No horizontal padding: an item's box then starts on the
        container edge, where the trigger's box above it already is.
      */}
      <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(240px,1fr))] items-start gap-x-space-xl py-space-sm [grid-auto-flow:dense]">
        {dropdown.sections.map((section, si) => {
          /**
           * Column units this section claims. A section is kept whole and given
           * width in proportion to what it holds, so a six-app section reads as
           * a block rather than a queue down one column. Two is the cap: a wider
           * block leaves the short sections nothing to fill the row with, and
           * `dense` packing is what closes those gaps.
           */
          const span = (section.items?.length ?? 0) > 3 ? 2 : 1
          return (
            <div key={`section-${si}`} style={{ gridColumn: `span ${span}` }}>
              <p className="block px-space-sm pb-space-xs pt-space-sm text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {section.heading}
              </p>
              {/*
                One column per unit the section spans, NOT another `auto-fit`:
                fitting as many columns as the block is wide left a four-item
                section in three columns with one item orphaned on its own row.
              */}
              {/*
                No rules between items: the same gap on both axes carries the
                structure. A rule on one axis only stopped mid-panel and read as
                a stray underline, and a full grid of them made a menu look like
                a table.
              */}
              <ul
                className="grid items-start gap-space-xs"
                style={{ gridTemplateColumns: `repeat(${span}, minmax(0,1fr))` }}
              >
                {section.items.map((item, ii) => (
                  <li key={`item-${si}-${ii}`} className="contents">
                    <NavDropdownItem item={item} />
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {dropdown.card && (
        <div className="w-80 shrink-0 py-space-sm ps-space-xl">
          <NavCard card={dropdown.card} />
        </div>
      )}

      {dropdown.sidePanel && (
        <ul className="flex w-48 shrink-0 flex-col py-space-sm ps-space-xl">
          {dropdown.sidePanel.heading ? (
            <li className="contents">
              <p className="inline-block px-space-sm pt-space-xs pb-space-sm text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {dropdown.sidePanel.heading}
              </p>
            </li>
          ) : null}
          {dropdown.sidePanel.links.map((link, i) => (
            <li key={i} className="contents">
              {link.href.startsWith('/') ? (
                <Link
                  to={link.href}
                  className="inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-xl px-space-sm text-sm text-foreground transition-colors duration-300 hover:bg-foreground/5"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-xl px-space-sm text-sm text-foreground transition-colors duration-300 hover:bg-foreground/5"
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
  /**
   * What the transparent bar is sitting on. A dark hero takes light type
   * (the default); a light one — Astro's aluminium backdrop, say — takes dark
   * type, otherwise the links wash out against it.
   */
  transparentOn?: 'dark' | 'light'
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
  transparentOn = 'dark',
}: NavbarProps = {}) {
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
  const { isAdmin } = useAdminAccess()
  const searchPath = useLocation().pathname
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const bannerVisible = !hideBanner && !bannerDismissed && (banner?.visible ?? true)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [prevDropdown, setPrevDropdown] = useState<string | null>(null)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  /** Which dropdown's subpanel is showing over the mobile panel. */
  const [mobilePanel, setMobilePanel] = useState<string | null>(null)

  /**
   * Panel heights, measured from the hidden off-screen copies. Only the height
   * is measured: the panels fill the band's width, so what the open/close
   * animation needs is how tall each one comes out at that width.
   */
  const [panelHeights, setPanelHeights] = useState<Record<string, number>>({})
  /**
   * The nav container's content width, published by {@link measureNavRow}. The
   * hidden copies are laid out at exactly this width, so their measured height
   * is the height the panel will have once it is on screen.
   */
  const [navContentWidth, setNavContentWidth] = useState<number | null>(null)

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

  // Measure each hidden panel so the shared dropdown viewport can size itself.
  // A ResizeObserver drives it — it fires once on observe and again on any
  // reflow (e.g. fonts loading), so the state update lives in its callback
  // rather than directly in the effect body.
  useLayoutEffect(() => {
    const measure = () => {
      const heights: Record<string, number> = {}
      for (const dd of dropdowns) {
        const el = measureRefs.current[dd.label]
        if (el) heights[dd.label] = el.scrollHeight
      }
      const settingsEl = measureRefs.current[SETTINGS_DROPDOWN_KEY]
      if (settingsEl) heights[SETTINGS_DROPDOWN_KEY] = settingsEl.scrollHeight
      setPanelHeights(heights)
    }
    const observer = new ResizeObserver(measure)
    for (const dd of dropdowns) {
      const el = measureRefs.current[dd.label]
      if (el) observer.observe(el)
    }
    const settingsEl = measureRefs.current[SETTINGS_DROPDOWN_KEY]
    if (settingsEl) observer.observe(settingsEl)
    return () => observer.disconnect()
  }, [dropdowns, showLanguageInSettings])

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
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(closeAll, 200)
  }, [closeAll])

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  // React 19 callback ref — owns the global Escape handler lifecycle. Attaches when
  // the nav area mounts, detaches on unmount. Also clears every pending timer: the
  // navbar is mounted per-page, so it unmounts on each route change and any timer
  // left running would fire against a dead component.
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
      if (prevDropdownTimerRef.current) clearTimeout(prevDropdownTimerRef.current)
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
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
  const measured = Object.keys(panelHeights).length > 0
  const activeHeight = activeDropdown ? panelHeights[activeDropdown] : undefined
  const easing = 'cubic-bezier(0.65,0,0.35,1)'

  // Derived from scrollY — no extra state needed
  const scrolled = scrollY > 50
  const bannerHeight = 40 // matches --site-header-banner-visible-height
  const bannerOffset = bannerVisible ? Math.max(0, bannerHeight - scrollY) : 0

  /**
   * Publish two facts about the nav row: its real height as
   * `--site-header-height`, and its content width as {@link navContentWidth}.
   *
   * Every sticky on the site parks against that token, and the static value can
   * only ever be one number: the bar is 55px on a phone and 59px from `lg`, so
   * a fixed token left every sticky element parked ~13px too high, with its
   * first line of content sliding under it.
   *
   * Measured on the nav row rather than on `<header>`: the open dropdown panel
   * lives inside the header and makes it several hundred pixels tall, which
   * would publish that as the header height and push every page with a spacer
   * down the moment a menu opened.
   *
   * The content width is read off the live element rather than recomputed from
   * `--layout-max-width` and `--layout-gutter`, so the breakpointed gutter and
   * the scrollbar are already accounted for.
   */
  /**
   * The band's container publishes the width the hidden measurement panels are
   * laid out at. It is measured here rather than on the bar, because the bar is
   * full-bleed and the band is not.
   */
  const measureBandWidth = useCallback((node: HTMLElement | null) => {
    if (!node) return
    const publish = () => {
      const style = getComputedStyle(node)
      const padding = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
      setNavContentWidth(node.getBoundingClientRect().width - padding)
    }
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const measureNavRow = useCallback((node: HTMLElement | null) => {
    if (!node) return
    const publish = () => {
      const header = node.closest('header')
      const border = header ? Number.parseFloat(getComputedStyle(header).borderBottomWidth) || 0 : 0
      const rect = node.getBoundingClientRect()
      document.documentElement.style.setProperty(
        '--site-header-height',
        `${Math.round(rect.height + border)}px`,
      )

    }
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
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
  // Group-ordered flat list: keyboard nav indexes into it, and the dropdown
  // renders straight from it (inserting a header when the group changes), so the
  // flat order has a single source of truth.
  const flatResults = useMemo(
    () => groupResults(searchResults, searchContextGroups(searchPath)).flatMap((g) => g.items),
    [searchResults, searchPath],
  )

  // The ink the transparent bar writes in, and the wash its hovers use.
  const onLight = transparentOn === 'light'
  const transparentInk = onLight ? 'text-black/70 hover:bg-black/5 hover:text-black' : 'text-white/80 hover:bg-white/10 hover:text-white'
  const transparentHover = onLight ? 'hover:bg-black/5 hover:text-black' : 'hover:bg-white/10 hover:text-white'
  const transparentColor = onLight ? 'black' : 'white'

  const linkClassName = (isTp: boolean) =>
    `inline-flex h-12 items-center justify-center px-4 text-link-md transition-colors duration-300 ${
      isTp ? transparentInk : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
    }`

  // Shared styling for the round icon buttons (search + settings).
  const iconButtonClass = `group inline-flex size-12 cursor-pointer select-none items-center justify-center transition-colors duration-300 ${isTransparent ? transparentInk : 'hover:bg-foreground/5 hover:text-foreground'}`
  const iconButtonStyle = (active: boolean) => ({
    background: active ? 'color-mix(in srgb, var(--color-foreground) 5%, transparent)' : undefined,
    color: active ? 'var(--color-foreground)' : isTransparent ? transparentColor : 'var(--color-muted-foreground)',
  })

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
                <span className="attio-group-hover-underline relative truncate text-body-sm">
                  {banner?.text ?? t('navbar.bannerDefault')}
                </span>
                <ArrowRightIcon className="transition-[translate] duration-400 ease-in-out group-hover:translate-x-0.25 group-hover:duration-150 group-active:translate-x-0.25 group-active:duration-50" />
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
      className={`fixed left-0 right-0 z-50 transition-[border-color,backdrop-filter] duration-300 ${isTransparent ? '' : 'backdrop-blur-md'}`}
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
          // Laid out at the container's width, not the viewport's: this sits
          // inside the full-width header, and a panel whose columns are decided
          // by `auto-fit` comes out a different height at a different width.
          width: navContentWidth ?? undefined,
          // Don't use display:none or opacity:0 — need real layout
        }}
      >
        {dropdowns.map((dd) => (
          <div key={dd.label} ref={(el) => { measureRefs.current[dd.label] = el }}>
            <DropdownContent dropdown={dd} />
          </div>
        ))}
        <div ref={(el) => { measureRefs.current[SETTINGS_DROPDOWN_KEY] = el }}>
          <SettingsPanel showLanguage={showLanguageInSettings} />
        </div>
      </div>

      {/* ─── Main nav ─── */}
      <div ref={measureNavRow} className="w-full">
        <nav>
          {/*
            A row of full-height cells rather than pills floating in a bar: each
            one runs the height of the header and the rules between them carry
            the structure. The container keeps its measure but gives up its
            gutter, so the first cell starts on the container edge — the same
            place the dropdown band's first item lands.
          */}
          {/*
            The rule stays on even over a transparent bar: it is what separates
            the header from the page, and at the top of a page — exactly where
            the bar is transparent — there was nothing marking where it ended.
          */}
          {/*
            The row opens and closes on the same square, each flush to its own
            edge: the brand at the left, the last control at the right. The page
            gutter is that square, so a page's first column starts where the
            brand cell ends and its last ends where the final control begins.
          */}
          <div className="flex items-stretch divide-x divide-border border-b border-border">
            <Link
              to={brand?.homeHref ?? '/'}
              className="grid size-(--header-cell-size) shrink-0 place-content-center transition-colors hover:bg-foreground/5"
              aria-label={brand?.ariaLabel ?? t('navbar.homepage')}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {brand?.logo ?? <LogoIcon height={28} />}
            </Link>

            {/* Middle: the dropdown triggers, or the search field while it is open */}
            <div className="flex min-w-0 flex-1 items-stretch">
            <div ref={escapeRef} className="relative z-10 flex items-stretch" onMouseLeave={scheduleClose}>
                <ul className={`hidden items-stretch divide-x divide-border ${searchOpen ? '' : 'lg:flex'}`}>
                  {dropdowns.map((dd) => (
                    <li key={dd.label}>
                      <button
                        ref={(el) => { triggerRefs.current[dd.label] = el }}
                        className={`group inline-flex h-12 cursor-pointer select-none items-center justify-center gap-x-1.5 px-4 text-link-md transition-colors duration-300 ${isTransparent ? transparentHover : 'hover:bg-foreground/5 hover:text-foreground'}`}
                        style={{
                          background: activeDropdown === dd.label ? 'color-mix(in srgb, var(--color-foreground) 5%, transparent)' : undefined,
                          color: activeDropdown === dd.label ? 'var(--color-foreground)' : isTransparent ? transparentColor : 'var(--color-muted-foreground)',
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

            {searchOpen && (
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-space-lg top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                  placeholder={t('common.searchApps')}
                  aria-label={t('common.search')}
                  className="h-12 w-full bg-transparent ps-[44px] pe-12 text-body-md text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label={t('common.closeSearch')}
                  className="absolute end-0 top-0 inline-flex size-12 cursor-pointer items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>

                {searchQuery.trim() ? (
                  <div className="absolute inset-x-0 top-full z-50 max-h-[min(70vh,520px)] overflow-y-auto border-b border-border bg-background text-left">
                    {flatResults.length === 0 ? (
                      <div className="px-space-sm py-space-2xl text-center text-sm text-muted-foreground">{t('common.noResults')}</div>
                    ) : (
                      flatResults.map((r, i) => {
                        const showHeader = i === 0 || flatResults[i - 1].group !== r.group
                        const isActive = i === activeResult
                        return (
                          <Fragment key={r.id}>
                            {showHeader ? (
                              <div className="px-space-sm pb-space-xs pt-space-md text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                {GROUP_LABELS[r.group] ?? r.group}
                              </div>
                            ) : null}
                            <button
                              type="button"
                              onMouseEnter={() => setActiveResult(i)}
                              onClick={() => {
                                closeSearch()
                                navigate(r.url)
                              }}
                              className={`block w-full cursor-pointer border-t border-border px-space-sm py-space-md text-left transition-colors ${isActive ? 'bg-foreground/5' : ''}`}
                            >
                              <div className="truncate text-sm text-foreground">{r.title}</div>
                              <div className="truncate text-body-xs text-muted-foreground">{r.subtitle}</div>
                            </button>
                          </Fragment>
                        )
                      })
                    )}
                  </div>
                ) : null}
              </div>
            )}
            </div>

            {/* Right controls (mobile + desktop) */}
            <div className="ms-auto flex items-stretch">
              {/* Mobile controls */}
              <div className="flex items-stretch divide-x divide-border border-l border-border lg:hidden">
              {/* The avatar is the only child of these toggles, and it renders
                  no text, so without a label the button has no accessible name
                  at all — Lighthouse's `button-name` audit fails outright. */}
              {!hideAuth && (
                <ProfileButton
                  expanded={false}
                  avatarSize={28}
                  menuItems={isAdmin ? [{ key: 'admin', label: 'Admin', icon: 'shield-account-outline', onPress: () => navigate('/admin') }] : []}
                />
              )}
              <button
                className={`inline-flex size-12 items-center justify-center transition-colors hover:bg-foreground/5 ${isTransparent ? (onLight ? 'text-black' : 'text-white') : 'text-muted-foreground'}`}
                aria-label={mobileOpen ? t('common.closeMenu') : t('common.openMenu')}
                aria-expanded={mobileOpen}
                onClick={() => {
                  setMobileOpen((open) => !open)
                  setMobilePanel(null)
                }}
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
            <div className="hidden items-stretch divide-x divide-border border-l border-border lg:flex">
              <button
                type="button"
                className={iconButtonClass}
                style={iconButtonStyle(searchOpen)}
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
                className={iconButtonClass}
                style={iconButtonStyle(activeDropdown === SETTINGS_DROPDOWN_KEY)}
                onMouseEnter={() => openDropdown(SETTINGS_DROPDOWN_KEY)}
                onMouseLeave={scheduleClose}
                onClick={() => (activeDropdown === SETTINGS_DROPDOWN_KEY ? closeAll() : openDropdown(SETTINGS_DROPDOWN_KEY))}
                aria-expanded={activeDropdown === SETTINGS_DROPDOWN_KEY}
                aria-label={t('footer.settings')}
              >
                <Settings className="size-[18px] transition-transform duration-300 group-hover:rotate-45" />
              </button>
              {rightActions}
              {ctaButtons}
              {!hideAuth && (
                <ProfileButton
                  expanded={false}
                  avatarSize={32}
                  menuItems={isAdmin ? [{ key: 'admin', label: 'Admin', icon: 'shield-account-outline', onPress: () => navigate('/admin') }] : []}
                />
              )}
            </div>
            </div>
          </div>
        </nav>
      </div>

      {/*
        ─── Shared Dropdown Band ───

        Full-bleed: the panels sit directly on the header's own surface rather
        than in a card of their own, so there is no second border or blur layer
        stacked inside the bar. The band spans the header; the copy inside it is
        held by the same container as the nav row, so an item lines up with the
        trigger that opened it.
      */}
      {measured && (
        <div
          className={`w-full ${isOpen ? 'border-b border-border' : ''}`}
          style={{
            pointerEvents: isOpen ? 'auto' : 'none',
            opacity: isOpen ? 1 : 0,
            maxHeight: isOpen && activeHeight ? activeHeight : 0,
            overflow: 'hidden',
            transition: `opacity ${isOpen ? '0.15s' : '0.12s'} ease-out, max-height 0.2s ${easing}`,
          }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div ref={measureBandWidth} className="container max-lg:!max-w-full max-lg:!px-4">
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
                      right: 0,
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
                // Right-aligned, unlike the nav panels: it is opened from the
                // settings button at the far end of the bar, and a 340px panel
                // parked at the container's left edge would sit nowhere near the
                // control that opened it.
                return (
                  <div
                    className={`flex justify-end ${isActive ? 'animate-nav-fade-in' : ''}`}
                    style={{
                      position: isActive ? 'relative' : 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
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

      {/* ─── Mobile panel ─── */}
      {/*
        One panel that slides in from the right, and one subpanel per dropdown
        sliding in on top of it. An accordion made every section push the ones
        below it down the page; this keeps each level on its own plane, so a tap
        never moves what you were reading.
      */}
      <div
        className={`fixed left-0 z-40 w-full overflow-hidden border-t border-border bg-background transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          top: `calc(${bannerOffset}px + var(--site-header-height))`,
          height: `calc(100dvh - ${bannerOffset}px - var(--site-header-height))`,
        }}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 divide-y divide-border overflow-y-auto overscroll-contain">
            {dropdowns.map((dd) => (
              <button
                key={dd.label}
                type="button"
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-foreground/5"
                onClick={() => setMobilePanel(dd.label)}
              >
                <span className="text-title-sm text-foreground">{dd.label}</span>
                <ChevronDown className="size-5 shrink-0 -rotate-90 text-muted-foreground" />
              </button>
            ))}
            {flatLinks.map((link) =>
              link.href.startsWith('/') && !link.external ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex w-full items-center justify-between p-4 text-title-sm text-foreground transition-colors hover:bg-foreground/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex w-full items-center justify-between p-4 text-title-sm text-foreground transition-colors hover:bg-foreground/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ),
            )}
          </div>

          {ctaButtons ? (
            <div className="flex shrink-0 flex-col gap-2 border-t border-border p-4">{ctaButtons}</div>
          ) : null}
        </div>

        {dropdowns.map((dd) => (
          <div
            key={dd.label}
            className={`absolute inset-0 overflow-y-auto overscroll-contain bg-background transition-transform duration-300 ease-out ${
              mobilePanel === dd.label ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 border-b border-border p-4 text-left transition-colors hover:bg-foreground/5"
              onClick={() => setMobilePanel(null)}
            >
              <ChevronDown className="size-5 shrink-0 rotate-90 text-muted-foreground" />
              <span className="text-title-sm text-foreground">{dd.label}</span>
            </button>

            <div className="flex flex-col gap-2 p-4" onClick={() => setMobileOpen(false)}>
              {dd.featureGrid?.features.map((item) => (
                <NavDropdownItem key={item.href} item={item} />
              ))}
              {dd.sections.map((section) => (
                <div key={section.heading} className="flex flex-col gap-2">
                  {section.heading ? (
                    <p className="px-space-sm pt-space-sm text-body-sm text-muted-foreground opacity-60">
                      {section.heading}
                    </p>
                  ) : null}
                  {section.items.map((item) => (
                    <NavDropdownItem key={`${section.heading}-${item.title}`} item={item} />
                  ))}
                </div>
              ))}
              {[...(dd.featureGrid?.cards ?? []), ...(dd.card ? [dd.card] : [])].map((card) => (
                <div key={card.href} className="aspect-[4/3] overflow-hidden rounded-xl">
                  <NavCard card={card} />
                </div>
              ))}
              {dd.sidePanel?.links.map((link) =>
                link.href.startsWith('/') ? (
                  <Link key={link.label} to={link.href} className="px-space-sm py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="px-space-sm py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </a>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </header>

    {!transparent && <div style={{ height: `calc(var(--site-header-height) + ${bannerOffset}px)` }} />}
    </>
  )
}
