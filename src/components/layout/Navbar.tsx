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
import { useAccountPanel } from '../../contexts/AccountPanelContext'

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
  const itemCount = dropdown.sections.reduce((n, s) => n + s.items.length, 0)
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
interface NavbarProps {
  /** Extra elements rendered before Sign in / Start for free on desktop, and before auth buttons on mobile */
  rightActions?: React.ReactNode
  /** Make navbar fully transparent with no border */
  transparent?: boolean
}

export default function Navbar({ rightActions, transparent }: NavbarProps = {}) {
  const { user, isAuthenticated, signIn } = useAuth()
  const accountPanel = useAccountPanel()
  const { data: navigationData } = useNavigation()
  const dropdowns: NavDropdown[] = useMemo(() => navigationData ?? [], [navigationData])
  const dropdownLabels = useMemo(() => dropdowns.map((d) => d.label), [dropdowns])

  const [scrollY, setScrollY] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
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

  // Align dropdown left edge with active trigger button
  useLayoutEffect(() => {
    if (!activeDropdown) return
    const trigger = triggerRefs.current[activeDropdown]
    if (!trigger) return
    setDropdownLeft(trigger.getBoundingClientRect().left)
  }, [activeDropdown])

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
    [activeDropdown, dropdownLabels]
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
    return () => {
      window.removeEventListener('keydown', handler)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [closeAll])

  // Track scroll position for transparent navbar + banner (rAF-throttled)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScrollY(window.scrollY))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
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

  // Derived from scrollY — no extra state needed
  const scrolled = scrollY > 50
  const bannerHeight = 40 // matches --site-header-banner-visible-height
  const bannerOffset = bannerVisible ? Math.max(0, bannerHeight - scrollY) : 0
  const isTransparent = transparent && !scrolled && !isOpen

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
                className="group relative flex size-full items-center justify-center gap-1.5 text-foreground max-md:justify-start"
                to="/ai"
              >
                <span className="attio-group-hover-underline relative truncate text-[13px]/5">
                  Alia. Think better, together.
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-[translate] duration-400 ease-in-out group-hover:translate-x-0.25 group-hover:duration-150 group-active:translate-x-0.25 group-active:duration-50">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
                </svg>
              </Link>
              <button
                className="inline-flex cursor-pointer items-center justify-center text-nowrap border text-base transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default size-8 rounded-full button-outline !bg-transparent !border-transparent dark absolute top-1/2 right-0 -translate-y-1/2 hover:!border-muted-foreground"
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
      className={`fixed left-0 right-0 z-50 transition-[border-color,backdrop-filter] duration-300 ${isTransparent ? 'border-b border-transparent' : 'border-b border-border backdrop-blur-md'}`}
      style={{
        top: bannerOffset,
        background: isTransparent ? 'transparent' : 'color-mix(in srgb, var(--background) 80%, transparent)',
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
      </div>

      {/* ─── Main nav ─── */}
      <Container>
        <nav className="py-2 lg:py-3.5">
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
                  {simpleNavLinks.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/') ? (
                                <Link
                          to={link.href}
                          className={`inline-flex h-9 items-center justify-center rounded-full border border-transparent px-3 text-[15px] transition-colors duration-300 ${isTransparent ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}`}
                          onMouseEnter={scheduleClose}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className={`inline-flex h-9 items-center justify-center rounded-full border border-transparent px-3 text-[15px] transition-colors duration-300 ${isTransparent ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}`}
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

            {/* Mobile controls */}
            <div className="flex items-center gap-x-2 lg:hidden">
              {isAuthenticated && (
                <button onClick={accountPanel.toggle} className="cursor-pointer">
                  <Avatar source={user?.avatar} size={28} placeholderColor={user?.color} />
                </button>
              )}
              <button
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${isTransparent ? 'text-white' : 'text-muted-foreground'}`}
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
            </div>

            {/* Desktop buttons */}
            <div className={`hidden items-center gap-x-2.5 lg:flex ${isTransparent ? '[&_button]:!text-white/80 [&_button:hover]:!text-white [&_a]:!text-white/80 [&_a:hover]:!text-white [&_svg]:!text-white/80' : ''}`}>
              <LocalePicker />
              <ThemeToggle />
              {rightActions}
              {isAuthenticated ? (
                <button onClick={accountPanel.toggle} className="cursor-pointer">
                  <Avatar
                    source={user?.avatar}
                    size={32}
                    placeholderColor={user?.color}
                  />
                </button>
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
            className="overflow-hidden rounded-xl border border-border"
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
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base text-foreground transition-colors hover:bg-foreground/5"
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
                            <Link key={item.title} to={item.href} className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground" onClick={() => setMobileOpen(false)}>
                              {item.title}
                            </Link>
                          ) : (
                            <a key={item.title} href={item.href} className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground" onClick={() => setMobileOpen(false)}>
                              {item.title}
                            </a>
                          )
                        ))
                      )}
                      {dd.sidePanel?.links.map((link) => (
                        link.href.startsWith('/') ? (
                          <Link key={link.label} to={link.href} className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground" onClick={() => setMobileOpen(false)}>
                            {link.label}
                          </Link>
                        ) : (
                          <a key={link.label} href={link.href} className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground" onClick={() => setMobileOpen(false)}>
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
                  <Link key={link.label} to={link.href} className="rounded-xl px-4 py-3 text-base text-foreground transition-colors hover:bg-foreground/5" onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} className="rounded-xl px-4 py-3 text-base text-foreground transition-colors hover:bg-foreground/5" onClick={() => setMobileOpen(false)}>
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
              {!isAuthenticated && (
                <div className="flex flex-col gap-2 px-4 pt-2">
                  {rightActions && <div className="flex flex-col gap-2">{rightActions}</div>}
                  <Button variant="outline" size="md" onClick={() => { signIn(); setMobileOpen(false) }} className="w-full">Sign in</Button>
                  <Button variant="primary" size="md" onClick={() => { signIn(); setMobileOpen(false) }} className="w-full">Start for free</Button>
                </div>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>

    {!transparent && <div style={{ height: `calc(var(--site-header-height) + ${bannerOffset}px)` }} />}
    </>
  )
}
