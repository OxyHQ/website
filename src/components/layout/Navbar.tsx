import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import {
  platformDropdown,
  resourcesDropdown,
  simpleNavLinks,
  type NavDropdown,
} from '../../data/content'
import NavDropdownItem from '../ui/NavDropdownItem'
import Button from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'
import Logo from '../ui/Logo'
import Container from './Container'

/* ─── SVG Icons ─── */
function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M5.25 7.125 9 10.875l3.75-3.75" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
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
        {dropdown.sections.flatMap((section, si) => [
          <li key={`heading-${si}`} className="contents">
            <p className={`mt-3 mb-1 inline-block px-4 text-[10px] font-semibold uppercase tracking-wider text-caption-foreground ${isPlatform ? 'col-span-2' : ''}`}>
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
          <svg width="1" height="100%" className="absolute inset-y-0 left-0 text-primary-foreground/20">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <li className="contents">
            <p className="mt-3 mb-0.5 inline-block px-2.5 text-[10px] font-semibold uppercase tracking-wider text-caption-foreground">
              {dropdown.sidePanel.heading}
            </p>
          </li>
          {dropdown.sidePanel.links.map((link, i) => (
            <li key={i} className="contents">
              <a
                href={link.href}
                className="inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-[10px] border border-transparent px-2.5 text-sm text-primary-foreground transition-colors duration-300 hover:bg-surface"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─── Main Navbar ─── */
const dropdowns: NavDropdown[] = [platformDropdown, resourcesDropdown]
const dropdownLabels = dropdowns.map((d) => d.label)

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [prevDropdown, setPrevDropdown] = useState<string | null>(null)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null)

  // Cached panel sizes (measured once on mount from hidden off-screen panels)
  const [panelSizes, setPanelSizes] = useState<Record<string, { w: number; h: number }>>({})
  const [vpLeft, setVpLeft] = useState(0)
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
  }, [])

  // Compute viewport left so dropdown is centered under the active trigger,
  // clamped to stay within the Container (max-width safe area).
  const containerRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (!activeDropdown) return
    const trigger = triggerRefs.current[activeDropdown]
    const navArea = navAreaRef.current
    const container = containerRef.current
    const size = panelSizes[activeDropdown]
    if (!trigger || !navArea || !size || !container) return

    const navRect = navArea.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const triggerRect = trigger.getBoundingClientRect()

    // Trigger center relative to navArea (since viewport is positioned inside navArea)
    const triggerCenter = triggerRect.left + triggerRect.width / 2 - navRect.left

    // Ideal: center dropdown under trigger
    let left = triggerCenter - size.w / 2

    // Clamp within the Container bounds (relative to navArea)
    const containerLeft = containerRect.left - navRect.left
    const containerRight = containerRect.right - navRect.left
    const minLeft = containerLeft
    const maxLeft = containerRight - size.w
    left = Math.max(minLeft, Math.min(left, maxLeft))

    setVpLeft(left)
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
      {/* ─── Banner (scrolls away) ─── */}
      {bannerVisible && (
        <div className="isolate z-50 flex w-full items-center justify-center border-b border-subtle-stroke bg-surface-subtle">
          <Container>
            <div className="relative flex h-10 items-center justify-center">
              <a href="#" className="group flex items-center gap-1.5 text-[13px] leading-5 text-primary-foreground">
                <span>Ask more from CRM. Ask Oxy.</span>
                <ArrowRight />
              </a>
              <button
                className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[10px] text-tertiary-foreground transition-colors hover:text-primary-foreground"
                aria-label="Dismiss banner"
                onClick={() => setBannerVisible(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="m12.5 5.5-7 7m7 0-7-7" />
                </svg>
              </button>
            </div>
          </Container>
        </div>
      )}

    <header className="sticky top-0 z-50 border-b border-subtle-stroke bg-primary-background transition-colors duration-300">
      <div className="absolute inset-0 -z-10 backdrop-blur-md" />

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
        <nav ref={containerRef} className="pt-2 pb-[7px] lg:pt-4 lg:pb-[15px]">
          <div className="flex items-center justify-between">
            <div className="flex grow items-center gap-x-9">
              <a href="/" className="-mx-1.5 rounded-xl px-1.5" aria-label="Oxy homepage">
                <Logo className="h-6" />
              </a>

              {/* Desktop nav */}
              <div ref={navAreaRef} className="relative z-10" onMouseLeave={scheduleClose}>
                <ul className="hidden items-center gap-x-1.5 lg:flex">
                  {dropdowns.map((dd) => (
                    <li key={dd.label}>
                      <button
                        ref={(el) => { triggerRefs.current[dd.label] = el }}
                        className="group inline-flex h-9 cursor-pointer select-none items-center justify-center gap-x-1.5 rounded-[10px] border border-transparent px-3 text-[15px] transition-colors duration-300 hover:bg-surface hover:text-primary-foreground"
                        style={{
                          background: activeDropdown === dd.label ? 'var(--color-surface)' : undefined,
                          color: activeDropdown === dd.label ? 'var(--color-primary-foreground)' : 'var(--color-tertiary-foreground)',
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
                      <a
                        href={link.href}
                        className="inline-flex h-9 items-center justify-center rounded-[10px] border border-transparent px-3 text-[15px] text-tertiary-foreground transition-colors duration-300 hover:bg-surface hover:text-primary-foreground"
                        onMouseEnter={scheduleClose}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>

                {/* ─── Shared Viewport ─── */}
                {hasMeasured && (
                  <div
                    className="absolute top-full z-50 pt-2"
                    style={{
                      left: vpLeft,
                      pointerEvents: isOpen ? 'auto' : 'none',
                      opacity: isOpen ? 1 : 0,
                      transition: `left 0.2s ${easing}, opacity ${isOpen ? '0.15s' : '0.12s'} ease-out`,
                    }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  >
                    <div
                      className="overflow-hidden rounded-xl border border-subtle-stroke bg-primary-background shadow-lg"
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
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-tertiary-foreground lg:hidden"
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
              <ThemeToggle />
              <Button variant="outline" size="sm" href="#">Sign in</Button>
              <Button variant="primary" size="sm" href="#">Start for free</Button>
            </div>
          </div>
        </nav>
      </Container>

      {/* ─── Mobile drawer ─── */}
      {mobileOpen && (
        <div className="border-t border-subtle-stroke bg-primary-background lg:hidden">
          <Container>
            <div className="flex flex-col gap-1 py-4">
              {dropdowns.map((dd) => (
                <div key={dd.label}>
                  <button
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base text-secondary-foreground transition-colors hover:bg-surface-subtle"
                    onClick={() => setMobileAccordion(mobileAccordion === dd.label ? null : dd.label)}
                  >
                    {dd.label}
                    <ChevronDown className={`transition-transform duration-200 ${mobileAccordion === dd.label ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileAccordion === dd.label && (
                    <div className="flex flex-col gap-1 pb-2 pl-4">
                      {dd.sections.map((s) =>
                        s.items.map((item) => (
                          <a key={item.title} href={item.href} className="rounded-xl px-4 py-2 text-sm text-tertiary-foreground transition-colors hover:bg-surface-subtle hover:text-secondary-foreground" onClick={() => setMobileOpen(false)}>
                            {item.title}
                          </a>
                        ))
                      )}
                      {dd.sidePanel?.links.map((link) => (
                        <a key={link.label} href={link.href} className="rounded-xl px-4 py-2 text-sm text-tertiary-foreground transition-colors hover:bg-surface-subtle hover:text-secondary-foreground" onClick={() => setMobileOpen(false)}>
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {simpleNavLinks.map((link) => (
                <a key={link.label} href={link.href} className="rounded-xl px-4 py-3 text-base text-secondary-foreground transition-colors hover:bg-surface-subtle" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              ))}
              <hr className="my-2 border-subtle-stroke" />
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-tertiary-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <div className="flex flex-col gap-2 px-4 pt-2">
                <Button variant="outline" size="md" href="#" className="w-full">Sign in</Button>
                <Button variant="primary" size="md" href="#" className="w-full">Start for free</Button>
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
    </>
  )
}
