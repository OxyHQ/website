import { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
import { Avatar } from '@oxyhq/bloom/avatar'
import {
  simpleNavLinks,
  type NavDropdown,
} from '../../data/content'
import { useNavigation } from '../../api/hooks'
import NavDropdownItem from '../ui/NavDropdownItem'
import Button from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'
import Logo from '../ui/Logo'
import Container from './Container'
import LocalePicker from '../ui/LocalePicker'

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
  const isPlatform = dropdown.label === 'Platform'

  return (
    <div className="flex w-max">
      <ul
        className={`relative shrink-0 flex-col gap-1 p-4 pt-3 ${
          isPlatform ? 'grid w-[720px] grid-cols-2 gap-x-3 max-xl:w-[576px]' : 'flex w-96'
        }`}
      >
        {(dropdown.sections ?? [{ heading: '', items: (dropdown as any).items ?? [] }]).flatMap((section, si) => [
          <li key={`heading-${si}`} className="contents">
            <p className={`mt-3 mb-1 inline-block px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${isPlatform ? 'col-span-2' : ''}`}>
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

      {dropdown.sidePanel && (
        <ul className="relative flex w-48 shrink-0 flex-col gap-1.5 p-4 pt-3">
          <svg width="1" height="100%" className="absolute inset-y-0 left-0 text-foreground/20">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <li className="contents">
            <p className="mt-3 mb-0.5 inline-block px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {dropdown.sidePanel.heading}
            </p>
          </li>
          {dropdown.sidePanel.links.map((link, i) => (
            <li key={i} className="contents">
              {link.href.startsWith('/') ? (
                <Link
                  to={link.href}
                  className="inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-[10px] border border-transparent px-2.5 text-sm text-foreground transition-colors duration-300 hover:bg-surface"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-[10px] border border-transparent px-2.5 text-sm text-foreground transition-colors duration-300 hover:bg-surface"
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
interface NavbarProps {
  /** Extra elements rendered before Sign in / Start for free on desktop, and before auth buttons on mobile */
  rightActions?: React.ReactNode
  /** Make navbar fully transparent with no border */
  transparent?: boolean
}

export default function Navbar({ rightActions, transparent }: NavbarProps = {}) {
  const { user, isAuthenticated, signIn, signOut } = useAuth()
  const { data: navigationData } = useNavigation()
  const dropdowns: NavDropdown[] = useMemo(() => navigationData ?? [], [navigationData])
  const dropdownLabels = useMemo(() => dropdowns.map((d) => d.label), [dropdowns])

  const [scrolled, setScrolled] = useState(false)
  const [bannerHidden, setBannerHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [prevDropdown, setPrevDropdown] = useState<string | null>(null)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null)

  // Cached panel sizes (measured once on mount from hidden off-screen panels)
  const [panelSizes, setPanelSizes] = useState<Record<string, { w: number; h: number }>>({})
  const [hasMeasured, setHasMeasured] = useState(false)

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const avatarMenuRef = useRef<HTMLDivElement>(null)

  // Close avatar menu on click outside
  useEffect(() => {
    if (!avatarMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [avatarMenuOpen])
  const measureRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const navAreaRef = useRef<HTMLDivElement>(null)

  // Measure all panels once on mount
  useLayoutEffect(() => {
    const sizes: Record<string, { w: number; h: number }> = {}
    for (const dd of dropdowns) {
      const el = measureRefs.current[dd.label]
      if (el) {
        sizes[dd.label] = { w: el.scrollWidth, h: el.scrollHeight }
      }
    }
    setPanelSizes(sizes)
    setHasMeasured(true)
  }, [dropdowns])


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
      } else {
        setDirection(null)
        setPrevDropdown(null)
      }
      setActiveDropdown(label)
    },
    [activeDropdown]
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeAll(); setMobileOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeAll])

  // Track scroll position for transparent navbar + banner hide
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 50)
      setBannerHidden(y > 10)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Clear prev after exit animation finishes
  useEffect(() => {
    if (prevDropdown) {
      const t = setTimeout(() => setPrevDropdown(null), 220)
      return () => clearTimeout(t)
    }
  }, [prevDropdown])

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

  return (
    <>
      {/* ─── Banner ─── */}
      {bannerVisible && (
        <div
          className="site-banner dark fixed top-0 left-0 right-0 z-50 flex h-(--site-header-banner-visible-height) w-full items-center justify-center bg-(--color-banner-background) transition-transform duration-300"
          style={{
            boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.01), 0px 2px 4px -1px rgba(0,0,0,0.02), 0px 4px 8px -2px rgba(0,0,0,0.03)',
            transform: bannerHidden ? 'translateY(-100%)' : 'translateY(0)',
          }}
        >
          <div className="container flex h-full items-center justify-center">
            <div className="relative flex size-full items-stretch justify-center px-12 max-md:justify-start max-md:pl-0">
              <a
                className="group relative flex size-full items-center justify-center gap-1.5 text-foreground max-md:justify-start"
                href="/"
              >
                <span className="attio-group-hover-underline relative truncate text-[13px]/5">
                  Ask more from CRM. Ask Oxy.
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-[translate] duration-400 ease-in-out group-hover:translate-x-0.25 group-hover:duration-150 group-active:translate-x-0.25 group-active:duration-50">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
                </svg>
              </a>
              <button
                className="inline-flex cursor-pointer items-center justify-center text-nowrap border text-base transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default size-8 rounded-[10px] button-outline !bg-transparent !border-transparent dark absolute top-1/2 right-0 -translate-y-1/2 hover:!border-muted-foreground"
                aria-label="Dismiss banner"
                onClick={() => setBannerVisible(false)}
              >
                <svg className="text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="m12.5 5.5-7 7m7 0-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    <header
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${transparent && !scrolled && !isOpen ? 'bg-transparent border-b border-transparent' : 'bg-background/80 border-b border-border backdrop-blur-md'}`}
      style={{ top: bannerVisible && !bannerHidden ? 'var(--site-header-banner-visible-height)' : 0 }}
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
      </div>

      {/* ─── Main nav ─── */}
      <Container>
        <nav className="py-2 lg:py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex grow items-center gap-x-9">
              <Link to="/" className="-mx-1.5 rounded-xl px-1.5" aria-label="Oxy homepage" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Logo className="h-6" />
              </Link>

              {/* Desktop nav */}
              <div ref={navAreaRef} className="relative z-10" onMouseLeave={scheduleClose}>
                <ul className="hidden items-center gap-x-1.5 lg:flex">
                  {dropdowns.map((dd) => (
                    <li key={dd.label}>
                      <button
                        ref={(el) => { triggerRefs.current[dd.label] = el }}
                        className="group inline-flex h-9 cursor-pointer select-none items-center justify-center gap-x-1.5 rounded-[10px] border border-transparent px-3 text-[15px] transition-colors duration-300 hover:bg-surface hover:text-foreground"
                        style={{
                          background: activeDropdown === dd.label ? 'var(--color-surface)' : undefined,
                          color: activeDropdown === dd.label ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                        }}
                        onMouseEnter={() => openDropdown(dd.label)}
                        aria-expanded={activeDropdown === dd.label}
                      >
                        <span>{dd.label}</span>
                        <ChevronDown className={`transition-transform duration-300 ${activeDropdown === dd.label ? 'translate-y-px' : ''}`} />
                      </button>
                    </li>
                  ))}
                  {simpleNavLinks.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/') ? (
                        <Link
                          to={link.href}
                          className="inline-flex h-9 items-center justify-center rounded-[10px] border border-transparent px-3 text-[15px] text-muted-foreground transition-colors duration-300 hover:bg-surface hover:text-foreground"
                          onMouseEnter={scheduleClose}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="inline-flex h-9 items-center justify-center rounded-[10px] border border-transparent px-3 text-[15px] text-muted-foreground transition-colors duration-300 hover:bg-surface hover:text-foreground"
                          onMouseEnter={scheduleClose}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>

              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground lg:hidden"
              aria-label="Open menu"
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

            {/* Desktop buttons */}
            <div className="hidden items-center gap-x-2.5 lg:flex">
              <LocalePicker />
              <ThemeToggle />
              {rightActions}
              {isAuthenticated ? (
                <div className="relative" ref={avatarMenuRef}>
                  <button onClick={() => setAvatarMenuOpen((o) => !o)} className="cursor-pointer">
                    <Avatar
                      source={user?.avatar}
                      size={32}
                      placeholderColor={user?.color}
                    />
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-background p-1.5 shadow-lg">
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <Avatar source={user?.avatar} size={36} placeholderColor={user?.color} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{user?.name?.first ?? user?.username}</div>
                          <div className="truncate text-xs text-muted-foreground">@{user?.username}</div>
                        </div>
                      </div>
                      <div className="my-1 h-px bg-border" />
                      {['oxy', 'nate'].includes(user?.username ?? '') && (
                        <Link to="/admin" onClick={() => setAvatarMenuOpen(false)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.5h12M2 8h12M2 11.5h8" /></svg>
                          Admin
                        </Link>
                      )}
                      <Link to="/settings" onClick={() => setAvatarMenuOpen(false)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3" /><path d="M12.7 10.1a1 1 0 00.2 1.1l.03.03a1.22 1.22 0 11-1.72 1.72l-.03-.03a1 1 0 00-1.1-.2 1 1 0 00-.61.92v.09a1.22 1.22 0 11-2.44 0v-.05a1 1 0 00-.65-.91 1 1 0 00-1.1.2l-.03.03a1.22 1.22 0 11-1.72-1.72l.03-.03a1 1 0 00.2-1.1 1 1 0 00-.92-.61h-.09a1.22 1.22 0 110-2.44h.05a1 1 0 00.91-.65 1 1 0 00-.2-1.1l-.03-.03A1.22 1.22 0 114.97 3.5l.03.03a1 1 0 001.1.2h.05a1 1 0 00.61-.92v-.09a1.22 1.22 0 112.44 0v.05a1 1 0 00.65.91 1 1 0 001.1-.2l.03-.03a1.22 1.22 0 111.72 1.72l-.03.03a1 1 0 00-.2 1.1v.05a1 1 0 00.92.61h.09a1.22 1.22 0 010 2.44h-.05a1 1 0 00-.91.65z" /></svg>
                        Settings
                      </Link>
                      <a href="https://accounts.oxy.so" target="_blank" rel="noopener noreferrer" onClick={() => setAvatarMenuOpen(false)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14v-1.33A2.67 2.67 0 009.33 10H6.67A2.67 2.67 0 004 12.67V14M8 7.33A2.67 2.67 0 108 2a2.67 2.67 0 000 5.33z" /></svg>
                        Manage account
                      </a>
                      <div className="my-1 h-px bg-border" />
                      <button onClick={() => { signOut(); setAvatarMenuOpen(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14H3.33A1.33 1.33 0 012 12.67V3.33A1.33 1.33 0 013.33 2H6M10.67 11.33L14 8l-3.33-3.33M14 8H6" /></svg>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => signIn()}>Sign in</Button>
                  <Button variant="primary" size="sm" onClick={() => signIn()}>Start for free</Button>
                </>
              )}
            </div>
          </div>
        </nav>
      </Container>

      {/* ─── Shared Dropdown Viewport ─── */}
      {hasMeasured && (
        <div
          className={`flex w-full justify-center ${isOpen ? 'pb-3 pt-3' : ''}`}
          style={{
            pointerEvents: isOpen ? 'auto' : 'none',
            opacity: isOpen ? 1 : 0,
            maxHeight: isOpen && activeSize ? activeSize.h + 24 : 0,
            overflow: 'hidden',
            transition: `opacity ${isOpen ? '0.15s' : '0.12s'} ease-out, max-height 0.2s ${easing}`,
          }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div
            className="overflow-hidden rounded-xl border border-border bg-background shadow-lg"
            style={{
              width: activeSize ? activeSize.w : 0,
              height: activeSize ? activeSize.h : 0,
              transition: `width 0.2s ${easing}, height 0.2s ${easing}`,
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
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile drawer ─── */}
      {mobileOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <Container>
            <div className="flex flex-col gap-1 py-4">
              {dropdowns.map((dd) => (
                <div key={dd.label}>
                  <button
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base text-foreground transition-colors hover:bg-surface"
                    onClick={() => setMobileAccordion(mobileAccordion === dd.label ? null : dd.label)}
                  >
                    {dd.label}
                    <ChevronDown className={`transition-transform duration-200 ${mobileAccordion === dd.label ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileAccordion === dd.label && (
                    <div className="flex flex-col gap-1 pb-2 pl-4">
                      {dd.sections.map((s) =>
                        s.items.map((item) => (
                          item.href.startsWith('/') ? (
                            <Link key={item.title} to={item.href} className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" onClick={() => setMobileOpen(false)}>
                              {item.title}
                            </Link>
                          ) : (
                            <a key={item.title} href={item.href} className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" onClick={() => setMobileOpen(false)}>
                              {item.title}
                            </a>
                          )
                        ))
                      )}
                      {dd.sidePanel?.links.map((link) => (
                        link.href.startsWith('/') ? (
                          <Link key={link.label} to={link.href} className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" onClick={() => setMobileOpen(false)}>
                            {link.label}
                          </Link>
                        ) : (
                          <a key={link.label} href={link.href} className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" onClick={() => setMobileOpen(false)}>
                            {link.label}
                          </a>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {simpleNavLinks.map((link) => (
                link.href.startsWith('/') ? (
                  <Link key={link.label} to={link.href} className="rounded-xl px-4 py-3 text-base text-foreground transition-colors hover:bg-surface" onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} className="rounded-xl px-4 py-3 text-base text-foreground transition-colors hover:bg-surface" onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </a>
                )
              ))}
              <hr className="my-2 border-border" />
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-muted-foreground">Language</span>
                <LocalePicker />
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <div className="flex flex-col gap-2 px-4 pt-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-2">
                      <Avatar source={user?.avatar} size={36} placeholderColor={user?.color} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{user?.name?.first ?? user?.username}</div>
                        <div className="truncate text-xs text-muted-foreground">@{user?.username}</div>
                      </div>
                    </div>
                    {['oxy', 'nate'].includes(user?.username ?? '') && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface">
                        Admin
                      </Link>
                    )}
                    <Link to="/settings" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface">
                      Settings
                    </Link>
                    <a href="https://accounts.oxy.so" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface">
                      Manage account
                    </a>
                    <Button variant="outline" size="md" onClick={() => { signOut(); setMobileOpen(false) }} className="w-full">Sign out</Button>
                  </>
                ) : (
                  <>
                    {rightActions && <div className="flex flex-col gap-2">{rightActions}</div>}
                    <Button variant="outline" size="md" onClick={() => { signIn(); setMobileOpen(false) }} className="w-full">Sign in</Button>
                    <Button variant="primary" size="md" onClick={() => { signIn(); setMobileOpen(false) }} className="w-full">Start for free</Button>
                  </>
                )}
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>

    {/* Spacer to offset fixed navbar height (not needed when transparent/overlaying hero) */}
    {!transparent && <div className="h-[calc(var(--site-header-banner-visible-height)+49px)] lg:h-[calc(var(--site-header-banner-visible-height)+53px)]" />}
    </>
  )
}
