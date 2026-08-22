import { useState, useRef, useCallback, useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogoIcon, ProfileButton, useOxy } from '@oxyhq/services'
import {
  simpleNavLinks,
  platformNavDropdown,
  resourcesNavCard,
  productNavDropdown,
  makeTechnologiesNavDropdown,
  resourcesNavDropdown,
  technologiesNavFallbackItems,
  technologiesNavSidePanel,
  technologyNavSection,
  resourcesBloomCard,
  type NavDropdown,
  type NavDropdownItem as NavDropdownItemData,
  type NavItem,
} from '../../data/content'
import { NavCard } from './NavMegaPanels'
import { resolveProductLogoUrl, useProducts, useSiteSettings } from '../../api/hooks'
import { subscribeScrollY, getScrollYSnapshot, getScrollYServerSnapshot } from '../../api/scrollStore'
import { useTranslation, useLocaleContext } from '../../lib/i18n'
import { searchSite, groupResults, searchContextGroups, type SearchResult } from '../../lib/site-search'
import NavDropdownItem from '../ui/NavDropdownItem'
import { SettingsPanel } from '../ui/SettingsPanel'
import NavbarSearchResults from './NavbarSearchResults'
import { Search, Settings, X } from 'lucide-react'
import { ArrowRightIcon } from '../icons'
import { useAdminAccess } from '../../hooks/useAdminAccess'

/** Pseudo-dropdown key for the settings panel (theme + language), routed through
 *  the same shared viewport as the nav dropdowns. Prefixed so it never collides
 *  with a CMS label. */
const SETTINGS_DROPDOWN_KEY = '__settings__'

const NAV_LABEL_KEYS: Record<string, string> = {
  Platform: 'navbar.platform',
  Newsroom: 'navbar.newsroom',
  Pricing: 'navbar.pricing',
}

const NAV_PRODUCT_DESCRIPTION_FALLBACKS: Record<string, string> = {
  'faircoin-explorer': 'Explore the FairCoin network',
  pay: 'Simple payments across Oxy',
  mercaria: 'An open marketplace for people and goods',
  moovo: 'Mobility and urban transport',
  noted: 'A focused space for notes and ideas',
  kaana: 'An AI agent for everyday life',
  horizon: 'A clearer view of what matters',
  astro: 'A private browser for the open web',
}

function translatedNavLabel(label: string, t: (key: string) => string): string {
  const key = NAV_LABEL_KEYS[label]
  return key ? t(key) : label
}

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

  /*
   * A feature dropdown is the same panel with a different filling: one headless
   * list instead of headed sections, and more than one card. It went through a
   * layout of its own, which is why its columns sized themselves from their
   * content while every other dropdown's were fixed.
  */
  const featureGrid = dropdown.featureGrid
  const cards = [...(dropdown.cards ?? []), ...(dropdown.card ? [dropdown.card] : [])]
  const wideMenu = Boolean(dropdown.sidePanel && (featureGrid || cards.length > 0))
  const sectionMenu = Boolean(dropdown.sidePanel && !featureGrid && cards.length === 0)
  const renderSection = (section: NonNullable<NavDropdown['sections']>[number], items = section.items, listClassName = 'grid items-start gap-1') => (
    <div
      key={section.heading}
      className="flex min-w-0 flex-col gap-space-md"
    >
      {section.heading ? (
        <p className="block px-space-sm pb-space-2xs text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {section.heading}
        </p>
      ) : null}
      <ul className={listClassName}>
        {items.map((item) => (
          <li key={item.href} className="contents">
            <NavDropdownItem item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
  const sectionContent = (dropdown.sections ?? []).map((section) => renderSection(
    section,
    section.items,
    `grid items-start gap-1 ${sectionMenu && section.heading === 'Apps' ? 'grid-cols-2 gap-x-space-lg' : ''}`,
  ))
  const sectionsByHeading = new Map((dropdown.sections ?? []).map((section, index) => [section.heading, sectionContent[index]]))
  const sectionGroup = (headings: string[], className = '') => (
    <div className={`flex min-w-0 flex-col gap-space-lg ${className}`}>
      {headings.map((heading) => sectionsByHeading.get(heading))}
    </div>
  )
  const hasPlatformSectionLayout = sectionMenu && ['Platform', 'Social & Communication', 'Tools', 'Finance', 'Commerce'].every((heading) => sectionsByHeading.has(heading))
  const platformSectionLayout = hasPlatformSectionLayout ? (
    <div className="col-span-4 grid min-w-0 grid-cols-4 items-start gap-space-lg">
      {sectionGroup(['Platform', 'Tools'])}
      {sectionGroup(['Social & Communication', 'AI & Research'])}
      {sectionGroup(['Finance', 'Housing'])}
      {sectionGroup(['Infrastructure', 'Commerce', 'Mobility', 'Developers'])}
    </div>
  ) : null
  const hasResourcesSectionLayout = wideMenu && !featureGrid && ['Support', 'Developers', 'Partners', 'Build'].every((heading) => sectionsByHeading.has(heading))
  const resourcesSectionLayout = hasResourcesSectionLayout ? (
    <div className="col-span-2 grid min-w-0 grid-cols-2 items-start gap-space-lg">
      {sectionGroup(['Support', 'Partners'])}
      {sectionGroup(['Developers', 'Build'])}
    </div>
  ) : null
  return (
    <div
      // The panel starts a clear step below the row, so the first heading does not
      // sit against the trigger that opened it.
      className={`grid w-full auto-rows-min items-start gap-space-lg pt-space-xl pb-space-2xl ${
        wideMenu ? 'grid-cols-5' : sectionMenu ? 'grid-cols-5' : 'grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]'
      }`}
    >
      {wideMenu && !featureGrid && hasResourcesSectionLayout ? (
        resourcesSectionLayout
      ) : wideMenu && !featureGrid ? (
        <div className="col-span-2 min-w-0 columns-2 gap-space-lg">
          {sectionContent}
        </div>
      ) : sectionMenu && hasPlatformSectionLayout ? (
        platformSectionLayout
      ) : sectionMenu ? (
        <div className="col-span-4 grid min-w-0 grid-cols-4 items-start gap-space-lg">
          {sectionContent}
        </div>
      ) : (
        sectionContent
      )}

      {featureGrid ? (
        <>
          <div className="col-span-2 grid min-w-0 grid-cols-2 items-start gap-space-lg">
            {featureGrid.features.map((item) => (
              <div key={item.href} className="min-w-0">
                <NavDropdownItem item={item} />
              </div>
            ))}
          </div>
          <div className="col-span-2 grid min-w-0 grid-cols-2 items-start gap-space-lg">
            {featureGrid.cards.map((card) => (
              <NavCard key={card.href} card={card} />
            ))}
          </div>
        </>
      ) : null}

      {cards.length > 1 ? (
        <div className={`grid min-w-0 grid-cols-2 items-start gap-space-lg ${wideMenu ? '[grid-column:span_2]' : ''}`}>
          {cards.map((card) => (
            <NavCard key={card.href} card={card} />
          ))}
        </div>
      ) : (
        cards.map((card) => <NavCard key={card.href} card={card} className={wideMenu ? '[grid-column:span_2]' : ''} />)
      )}

      {dropdown.sidePanel && (
        <ul className="grid items-start gap-space-3xs">
          {dropdown.sidePanel.heading ? (
            <li className="contents">
              <p className="inline-block px-space-sm pb-space-2xs text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {dropdown.sidePanel.heading}
              </p>
            </li>
          ) : null}
          {dropdown.sidePanel.links.map((link, i) => (
            <li key={i} className="contents">
              {link.href.startsWith('/') ? (
                <Link
                  to={link.href}
                  className="inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-md px-space-sm text-body-md text-foreground transition-colors duration-150 hover:bg-foreground/5"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-md px-space-sm text-body-md text-foreground transition-colors duration-150 hover:bg-foreground/5"
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
   * Replace code-driven dropdowns with the supplied list. Both Oxy and
   * sub-brands (FairCoin) render through the SAME pipeline — the same
   * `DropdownContent`, the same measurement + animation, the same
   * `NavDropdownItem` item layout with icon, title, description.
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
  const { oxyServices } = useOxy()
  // The settings gear (theme + language) always shows; the language section
  // inside it only when more than one locale is offered.
  const showLanguageInSettings = !hideLocalePicker && locales.length > 1
  // Sub-brand mode: customDropdowns bypasses the global code-owned menu.
  const useCustomNav = customDropdowns !== undefined
  const { data: navProducts } = useProducts({ surface: 'nav' })
  const { data: siteSettings } = useSiteSettings()
  const productItems = useMemo(() => {
    if (!navProducts || navProducts.length === 0) return technologiesNavFallbackItems
    const items: Array<NavDropdownItemData & { section: string }> = navProducts.map((product) => {
      const productKey = product.productId.toLowerCase()
      return {
        title: product.name,
        description: product.tagline || product.description || NAV_PRODUCT_DESCRIPTION_FALLBACKS[productKey] || 'Explore this Oxy product',
        href: productKey === 'marketplace' || productKey === 'mercaria'
          ? '/mercaria'
          : (product.navOpensApp ? product.href : (product.landingUrl || product.href)),
        image: product.productId === 'alia' ? '/images/apps/alia-dropdown.svg' : (resolveProductLogoUrl(product) || undefined),
        logoColor: product.brand,
        preserveImageColors: product.productId === 'alia' || product.productId === 'faircoin' || product.productId === 'fairwallet' || product.productId === 'faircoin-wallet',
        section: technologyNavSection(product.productId, product.section),
      }
    })
    for (const fallbackTitle of ['Noted', 'Wholesale by Mercaria']) {
      if (items.some((item) => item.title === fallbackTitle)) continue
      const fallbackItem = technologiesNavFallbackItems.find((item) => item.title === fallbackTitle)
      if (fallbackItem) items.push(fallbackItem)
    }
    return items
  }, [navProducts])
  const dropdowns: readonly NavDropdown[] = useMemo(() => {
    if (useCustomNav) return customDropdowns ?? []
    const technologies = makeTechnologiesNavDropdown(productItems)
    const platformLinks = platformNavDropdown.sidePanel?.links ?? []
    const technologyLinks = technologiesNavSidePanel.links.filter(
      (link) => !platformLinks.some((existing) => existing.href === link.href),
    )
    const platform = {
      ...platformNavDropdown,
      sections: [...platformNavDropdown.sections, ...technologies.sections],
      sidePanel: {
        heading: 'Explore',
        links: [...platformLinks, ...technologyLinks],
      },
    }
    return [
      productNavDropdown,
      platform,
      { ...resourcesNavDropdown, cards: [resourcesNavCard, resourcesBloomCard] },
    ]
  }, [useCustomNav, customDropdowns, productItems])
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
  const searchRequest = useRef(0)
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
  const bannerOffsetRef = useRef(bannerOffset)
  bannerOffsetRef.current = bannerOffset

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
      const rect = node.getBoundingClientRect()
      document.documentElement.style.setProperty(
        '--site-header-height',
        `${Math.round(rect.height)}px`,
      )
      document.documentElement.style.setProperty(
        '--site-header-occlusion-bottom',
        `${Math.round(bannerOffsetRef.current + rect.height)}px`,
      )

    }
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // The transparent home navbar sits over the hero. Keep the hero's frame
  // lines below the current banner + navbar stack so they do not double the
  // logo/control separators while the banner scrolls away.
  useLayoutEffect(() => {
    const headerHeight = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--site-header-height'),
    ) || 0
    if (headerHeight > 0) {
      document.documentElement.style.setProperty(
        '--site-header-occlusion-bottom',
        `${Math.round(bannerOffset + headerHeight)}px`,
      )
    }
  }, [bannerOffset])
  const isTransparent = transparent && !scrolled && !isOpen && !mobileOpen && !searchOpen
  const headerSurface = mobileOpen
    ? 'var(--background)'
    : 'color-mix(in srgb, var(--background) 80%, transparent)'

  const closeSearch = useCallback(() => {
    searchRequest.current += 1
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setActiveResult(0)
  }, [])
  const runSearch = useCallback((q: string) => {
    const requestId = ++searchRequest.current
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    searchDebounce.current = setTimeout(() => {
      // A remote handle is a federation lookup, not a native-user search.
      // Avoid sending it through Core at all; native profile search remains
      // available for ordinary names and usernames.
      const looksLikeFederatedHandle = /^@?[^@\s]+@[^@\s]+$/.test(q.trim())
      const profileSearch = looksLikeFederatedHandle
        ? Promise.resolve([])
        : oxyServices.searchProfiles(q, { limit: 8 }).then((response) => response.data).catch(() => [])
      void Promise.all([
        searchSite(q).catch(() => [] as SearchResult[]),
        profileSearch,
      ]).then(([siteResults, users]) => {
        if (requestId !== searchRequest.current) return
        const nativeUsers = users.filter((user) =>
          user.type === 'local' ||
          (!user.type && !user.isFederated && !user.instance && !user.federation),
        )
        const userResults: SearchResult[] = nativeUsers.map((user) => ({
          id: `user:${user.id}`,
          url: `/u/${user.username}`,
          title: user.name.displayName?.trim() || user.username,
          group: 'users',
          subtitle: `@${user.username}`,
          kind: 'user',
          avatar: user.avatar
            ? user.avatar.startsWith('http')
              ? user.avatar
              : oxyServices.getFileDownloadUrl(user.avatar, 'thumb')
            : undefined,
        }))
        setSearchResults([...siteResults, ...userResults])
        setActiveResult(0)
      })
    }, 160)
  }, [oxyServices])
  // Group-ordered results are the source of truth for keyboard navigation.
  const groupedResults = useMemo(
    () => groupResults(searchResults, searchContextGroups(searchPath)),
    [searchResults, searchPath],
  )
  const flatResults = useMemo(() => groupedResults.flatMap((g) => g.items), [groupedResults])

  // The ink the transparent bar writes in, and the wash its hovers use.
  const onLight = transparentOn === 'light'
  const transparentInk = onLight ? 'text-black/70 hover:bg-black/5 hover:text-black' : 'text-white/80 hover:bg-white/10 hover:text-white'
  const transparentHover = onLight ? 'hover:bg-black/5 hover:text-black' : 'hover:bg-white/10 hover:text-white'
  const transparentColor = onLight ? 'black' : 'white'

  const linkClassName = (isTp: boolean) =>
      `inline-flex h-10 items-center justify-center rounded-full px-3 text-link-md transition-colors duration-300 ${
      isTp ? transparentInk : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
    }`

  // Shared styling for the round icon buttons (search + settings).
  const iconButtonClass = `group inline-flex size-10 cursor-pointer select-none items-center justify-center rounded-full transition-colors duration-300 ${isTransparent ? transparentInk : 'hover:bg-foreground/5 hover:text-foreground'}`
  const iconButtonStyle = (active: boolean) => ({
    background: active ? 'color-mix(in srgb, var(--color-foreground) 5%, transparent)' : undefined,
    color: active ? 'var(--color-foreground)' : isTransparent ? transparentColor : 'var(--color-muted-foreground)',
  })

  return (
    <>
      {/* ─── Banner ─── */}
      {bannerVisible && (
        <div
          className="site-banner fixed top-0 left-0 right-0 z-[51] flex h-(--site-header-banner-visible-height) items-center justify-center bg-primary text-primary-foreground"
          style={{
            boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.01), 0px 2px 4px -1px rgba(0,0,0,0.02), 0px 4px 8px -2px rgba(0,0,0,0.03)',
            transform: `translateY(${-Math.min(scrollY, bannerHeight)}px)`,
          }}
        >
          <div className="container flex h-full items-center justify-center">
            <div className="relative flex size-full items-stretch justify-center px-12 max-md:justify-start max-md:pl-0">
              <Link
                className="group relative flex size-full items-center justify-center gap-1.5 text-primary-foreground max-md:justify-start"
                to={banner?.href ?? '/inbox'}
              >
                <span className="attio-group-hover-underline relative truncate text-body-sm">
                  {banner?.text ?? t('navbar.bannerDefault')}
                </span>
                <ArrowRightIcon className="transition-[translate] duration-400 ease-in-out group-hover:translate-x-0.25 group-hover:duration-150 group-active:translate-x-0.25 group-active:duration-50" />
              </Link>
              <button
                className="absolute top-1/2 right-0 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-base text-primary-foreground/70 transition-colors duration-300 hover:bg-primary-foreground/10 disabled:pointer-events-none"
                aria-label={t('common.dismissBanner')}
                onClick={() => setBannerDismissed(true)}
              >
                  <svg className="text-primary-foreground/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="m12.5 5.5-7 7m7 0-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    <header
      className={`fixed left-0 right-0 z-50 transition-[backdrop-filter] duration-300 ${isTransparent ? '' : 'backdrop-blur-md'}`}
      style={{
        top: bannerOffset,
        background: isTransparent ? 'transparent' : headerSurface,
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
      <div ref={measureNavRow} className="container max-lg:!max-w-full">
        <nav>
          {/*
            The row opens and closes on the same square, each flush to its own
            edge: the brand at the left, the last control at the right. The page
            gutter is that square, so a page's first column starts where the
            brand cell ends and its last ends where the final control begins.
          */}
          {/* The shared surface stays continuous while a panel is open. */}
          <div className="relative flex min-h-12 items-center">
            <Link
              to={brand?.homeHref ?? '/'}
              className={`grid size-10 shrink-0 place-content-center rounded-full transition-[inset-inline-start,transform,background-color] duration-300 ease-out hover:bg-foreground/5 lg:absolute lg:start-1/2 lg:top-1/2 lg:z-20 lg:-translate-y-1/2 ${searchOpen ? 'lg:start-4 lg:translate-x-0' : 'lg:-translate-x-1/2'}`}
              aria-label={brand?.ariaLabel ?? t('navbar.homepage')}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {brand?.logo ?? <LogoIcon height={28} color="var(--primary)" letterColor="var(--logo-letter-color, var(--primary-foreground))" />}
            </Link>

            {/* Middle: the dropdown triggers, or the search field while it is open */}
            <div className="flex min-w-0 flex-1 items-stretch">
            <div ref={escapeRef} className="relative z-10 flex items-stretch" onMouseLeave={scheduleClose}>
                <ul className={`hidden items-stretch gap-1 transition-[opacity,transform] duration-200 ease-out lg:flex ${searchOpen ? 'lg:pointer-events-none lg:invisible lg:absolute lg:start-0 lg:top-0 lg:-translate-x-2 lg:opacity-0' : 'lg:translate-x-0 lg:opacity-100'}`}>
                  {dropdowns.map((dd) => (
                    <li key={dd.label}>
                      <button
                        ref={(el) => { triggerRefs.current[dd.label] = el }}
                        className={`group inline-flex h-10 cursor-pointer select-none items-center justify-center gap-x-1.5 rounded-full px-3 text-link-md transition-colors duration-300 ${isTransparent ? transparentHover : 'hover:bg-foreground/5 hover:text-foreground'}`}
                        style={{
                          background: activeDropdown === dd.label ? 'color-mix(in srgb, var(--color-foreground) 5%, transparent)' : undefined,
                          color: activeDropdown === dd.label ? 'var(--color-foreground)' : isTransparent ? transparentColor : 'var(--color-muted-foreground)',
                        }}
                        onMouseEnter={() => openDropdown(dd.label)}
                        aria-expanded={activeDropdown === dd.label}
                      >
                        <span>{translatedNavLabel(dd.label, t)}</span>
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
                          {translatedNavLabel(link.label, t)}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          className={linkClassName(isTransparent ?? false)}
                          onMouseEnter={scheduleClose}
                        >
                          {translatedNavLabel(link.label, t)}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>

              </div>

            {searchOpen && (
              <div className="relative mx-auto w-full max-w-[42rem]">
                <Search className="pointer-events-none absolute start-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                  className={`h-11 w-full ps-12 pe-12 text-body-md text-foreground outline-none placeholder:text-muted-foreground ${searchQuery.trim() ? 'rounded-t-[2rem] border border-foreground/10 border-b-0 bg-background/60 shadow-none backdrop-blur-md' : 'rounded-full border border-foreground/10 bg-background/60 shadow-sm backdrop-blur-md'}`}
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label={t('common.closeSearch')}
                  className="absolute end-0 top-0 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>

                {searchQuery.trim() ? (
                  <NavbarSearchResults
                    groups={groupedResults}
                    flatResults={flatResults}
                    activeResult={activeResult}
                    noResultsLabel={t('common.noResults')}
                    onHover={setActiveResult}
                    onSelect={(result) => {
                      closeSearch()
                      navigate(result.url)
                    }}
                  />
                ) : null}
              </div>
            )}
            </div>

            {/* Right controls (mobile + desktop) */}
            <div className={`ms-auto flex items-stretch ${searchOpen ? 'lg:hidden' : ''}`}>
              {/* Mobile controls */}
            <div className="flex items-stretch gap-2 lg:hidden">
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
                className={`inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-foreground/5 ${isTransparent ? (onLight ? 'text-black' : 'text-white') : 'text-muted-foreground'}`}
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
            <div className="hidden items-stretch gap-3 lg:flex">
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

        The panel stays on the header's surface and runs edge to edge. Only the
        panel content is held inside the same site frame as the nav row, so an
        item lines up with its trigger without centring the whole band.
      */}
      {measured && (
        <div
          // The header owns the single translucent surface and its blur. Keep
          // the panel transparent so it does not darken that surface a second
          // time when it opens.
          className="w-full bg-transparent"
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
          className={`fixed left-0 z-40 w-full overflow-hidden bg-background transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          top: `calc(${bannerOffset}px + var(--site-header-height))`,
          height: `calc(100dvh - ${bannerOffset}px - var(--site-header-height))`,
        }}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {dropdowns.map((dd) => (
              <button
                key={dd.label}
                type="button"
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-foreground/5"
                onClick={() => setMobilePanel(dd.label)}
              >
                <span className="text-title-sm text-foreground">{translatedNavLabel(dd.label, t)}</span>
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
                  {translatedNavLabel(link.label, t)}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex w-full items-center justify-between p-4 text-title-sm text-foreground transition-colors hover:bg-foreground/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {translatedNavLabel(link.label, t)}
                </a>
              ),
            )}
          </div>

          {ctaButtons ? (
            <div className="flex shrink-0 flex-col gap-2 p-4">{ctaButtons}</div>
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
              className="flex w-full items-center gap-2 p-4 text-left transition-colors hover:bg-foreground/5"
              onClick={() => setMobilePanel(null)}
            >
              <ChevronDown className="size-5 shrink-0 rotate-90 text-muted-foreground" />
              <span className="text-title-sm text-foreground">{translatedNavLabel(dd.label, t)}</span>
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
              {[...(dd.featureGrid?.cards ?? []), ...(dd.cards ?? []), ...(dd.card ? [dd.card] : [])].map((card) => (
                <div key={card.href} className="aspect-[4/3] overflow-hidden rounded-xl">
                  <NavCard card={card} />
                </div>
              ))}
              {dd.sidePanel?.links.map((link) =>
                link.href.startsWith('/') ? (
                  <Link key={link.label} to={link.href} className="px-space-sm py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {translatedNavLabel(link.label, t)}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="px-space-sm py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {translatedNavLabel(link.label, t)}
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
