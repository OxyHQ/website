import type React from 'react'
import { useState, useEffect } from 'react'
import { hero } from '../../data/content'
import Button from '../ui/Button'

const cardShadow =
  'var(--color-border) 0px 0px 0px 1px, var(--color-input) 0px 1px 1px 0px'

const responseShadow =
  'var(--color-border) 0px 0px 0px 1px, var(--color-input) 0px 1px 1px 0px, var(--color-background) 0px 0px 24px 20px'

export default function HeroSection() {
  const fullText = 'Ask anything'
  const [typedText, setTypedText] = useState('')
  const [showCursor, setShowCursor] = useState(false)
  const [typingDone, setTypingDone] = useState(false)
  const [showResponse, setShowResponse] = useState(false)

  useEffect(() => {
    const timers: number[] = []

    // Start typing at 1200ms
    timers.push(window.setTimeout(() => {
      setShowCursor(true)
      let i = 0
      const interval = window.setInterval(() => {
        i++
        setTypedText(fullText.slice(0, i))
        if (i >= fullText.length) {
          clearInterval(interval)
          timers.push(window.setTimeout(() => {
            setShowCursor(false)
            setTypingDone(true)
          }, 400))
        }
      }, 60)
      timers.push(interval)
    }, 1200))

    // Stagger the response mockup reveals
    timers.push(window.setTimeout(() => setShowResponse(true), 2000))

    return () => timers.forEach(id => clearTimeout(id))
  }, [])

  return (
    <section className="flex min-h-[calc(100svh-var(--site-header-height))] flex-col bg-gradient-to-b from-background to-surface">
      {/* Main content area with background glow */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-1/4 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[120px]" />
        </div>

        {/* Content in 12-col grid */}
        <div className="pointer-events-none relative grid flex-1 grid-cols-12">
          <div className="col-[2/-2] flex flex-col items-center justify-center pb-12">
            <div className="pointer-events-auto">
              {/* Header with staggered animations */}
              <header className="flex w-full flex-col pt-30 pb-15 max-xl:pt-25 max-lg:pt-20 items-center" style={{ '--animate-delay': '0ms', '--animate-delay-mobile': '0ms' } as React.CSSProperties}>
                <h1
                  className="max-w-[15em] text-balance text-heading-responsive-lg fade-in-from-bottom-1 animate-in fill-mode-both transition-[opacity,translate,transform] delay-[calc(var(--animate-delay)+200ms)] duration-1000 ease-in-out will-change-[translate,transform] max-lg:delay-[calc(var(--animate-delay-mobile)+200ms)] text-center"
                >
                  {hero.title}
                </h1>
                <p
                  className="mt-4 max-w-xl text-balance text-lg text-foreground lg:text-xl fade-in-from-bottom-1 animate-in fill-mode-both transition-[opacity,translate,transform] delay-[calc(var(--animate-delay)+300ms)] duration-1000 ease-in-out will-change-[translate,transform] max-lg:delay-[calc(var(--animate-delay-mobile)+300ms)] text-center"
                >
                  {hero.subtitle}
                </p>
              </header>
            </div>

            {/* Search input mockup */}
            <div
              className="pointer-events-auto w-full max-w-md origin-bottom animate-search-bar-enter"
              style={{ animationDelay: '600ms' }}
            >
              <div aria-hidden="true" className="relative w-full">
                {/* White input bar */}
                <div
                  className="relative z-10 flex items-center justify-between rounded-lg bg-surface pl-3 backdrop-blur-[2px] md:rounded-xl md:pl-4"
                  style={{ boxShadow: cardShadow }}
                >
                  <span className="min-w-0 flex-1 text-[13px] font-medium leading-[18px] md:text-[15px] md:leading-5">
                    <span className="text-foreground" style={{ opacity: typedText.length > 0 ? 1 : 0 }}>
                      {typedText || '\u00A0'}
                      <span>{typingDone ? '.' : ''}</span>
                    </span>
                    {showCursor && (
                      <span className="ml-[1px] inline-block h-[1em] w-[1.5px] translate-y-[1px] animate-cursor-blink bg-foreground" />
                    )}
                  </span>
                  <div className="relative flex shrink-0 justify-end overflow-hidden p-1.5 md:w-40 md:p-[9px]">
                    {/* Blue send button */}
                    <div
                      className="flex size-7 items-center justify-center rounded-lg border border-foreground/10 bg-primary text-primary-foreground transition-opacity duration-500 md:size-8 md:rounded-[9px]"
                      style={{
                        boxShadow: '0px 2px 4px -2px var(--color-primary), 0px 3px 6px -2px var(--color-primary)',
                        opacity: typingDone ? 1 : 0.3,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="size-3.5 md:size-4">
                        <path
                          d="M6.52029 1.35461C6.74186 1.09971 7.04291 1.12433 7.23807 1.31949L11.237 5.31852C11.4601 5.54159 11.4601 5.90305 11.237 6.12613C11.014 6.34918 10.6526 6.34918 10.4295 6.12613L7.40604 3.1027V12.007C7.40578 12.3222 7.15002 12.5782 6.83475 12.5783C6.5194 12.5783 6.26371 12.3223 6.26346 12.007V3.1027L3.24002 6.12613C3.01694 6.34918 2.65451 6.34918 2.43143 6.12613C2.20878 5.90304 2.20858 5.54148 2.43143 5.31852L6.43045 1.31949L6.52029 1.35461Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Chat response area */}
                <div
                  className="relative z-1 mt-1.5 max-h-64 origin-center overflow-y-hidden rounded-lg p-2.5 backdrop-blur-xs md:mt-2 md:max-h-76 md:rounded-xl md:p-3.5 bg-surface/90"
                  style={{
                    boxShadow: responseShadow,
                    opacity: showResponse ? 1 : 0,
                    transform: showResponse ? 'none' : 'scale(0.95)',
                    transition: 'opacity 700ms ease-out, transform 700ms ease-out',
                  }}
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Meeting card */}
                    <div
                      className="flex max-w-80 flex-col overflow-hidden rounded-lg md:rounded-xl bg-surface"
                      style={{ boxShadow: cardShadow }}
                    >
                      {/* Green status bar */}
                      <div className="h-1 w-full bg-green-600" />

                      {/* Meeting details */}
                      <div className="flex flex-col gap-2.5 p-3 md:p-3.5">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-semibold leading-[18px] text-foreground md:text-sm">
                              Greenleaf Onboarding
                            </span>
                            <span className="text-[11px] leading-4 text-foreground/40 md:text-xs">
                              Dec 12, 10:40 – 11:40 AM
                            </span>
                          </div>
                          {/* Video icon + duration */}
                          <div className="flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-foreground/30">
                              <path d="M2 4.5C2 3.67157 2.67157 3 3.5 3H9.5C10.3284 3 11 3.67157 11 4.5V11.5C11 12.3284 10.3284 13 9.5 13H3.5C2.67157 13 2 12.3284 2 11.5V4.5Z" fill="currentColor" />
                              <path d="M12 5.5L14.4 3.7C14.5657 3.57574 14.8 3.69249 14.8 3.9V12.1C14.8 12.3075 14.5657 12.4243 14.4 12.3L12 10.5V5.5Z" fill="currentColor" />
                            </svg>
                            <span className="text-[11px] leading-4 text-foreground/35 md:text-xs">22 min</span>
                          </div>
                        </div>

                        {/* Avatar stack */}
                        <div className="flex items-center -space-x-1.5">
                          <div className="size-5 rounded-full border-[1.5px] border-white bg-primary md:size-6" />
                          <div className="size-5 rounded-full border-[1.5px] border-white bg-amber-500 md:size-6" />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-foreground/5" />

                      {/* Footer */}
                      <div className="flex items-center justify-between px-3 py-2 md:px-3.5 md:py-2.5">
                        <div className="flex items-center gap-1.5">
                          {/* Clock icon */}
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-foreground/30">
                            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-[11px] leading-4 text-foreground/40 md:text-xs">
                            Starts in 6 mins
                          </span>
                        </div>
                        <button className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium leading-4 text-white md:text-xs">
                          Join meeting
                        </button>
                      </div>
                    </div>

                    {/* Suggested follow-up tasks */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-medium leading-4 text-foreground/35 md:text-xs">
                        Suggested follow-up tasks:
                      </span>

                      {/* Task card 1 */}
                      <div
                        className="flex flex-col gap-3 rounded-lg py-2 pr-2 pl-2.5 md:rounded-xl md:py-2 md:pr-2 md:pl-2.5 bg-surface"
                        style={{ boxShadow: cardShadow }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-foreground/12">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-foreground/25">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <span className="text-[12px] leading-4 text-foreground/55 md:text-[13px] md:leading-[18px]">
                            Send onboarding checklist to Greenleaf team
                          </span>
                        </div>
                      </div>

                      {/* Task card 2 */}
                      <div
                        className="flex flex-col gap-3 rounded-lg py-2 pr-2 pl-2.5 md:rounded-xl md:py-2 md:pr-2 md:pl-2.5 bg-surface"
                        style={{ boxShadow: cardShadow }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-foreground/12">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-foreground/25">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <span className="text-[12px] leading-4 text-foreground/55 md:text-[13px] md:leading-[18px]">
                            Schedule follow-up sync for next week
                          </span>
                        </div>
                      </div>

                      {/* Task card 3 */}
                      <div
                        className="flex flex-col gap-3 rounded-lg py-2 pr-2 pl-2.5 md:rounded-xl md:py-2 md:pr-2 md:pl-2.5 bg-surface"
                        style={{ boxShadow: cardShadow }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-foreground/12">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-foreground/25">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <span className="text-[12px] leading-4 text-foreground/55 md:text-[13px] md:leading-[18px]">
                            Share meeting notes with stakeholders
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer grid */}
      <div aria-hidden="true" className="grid h-30 w-full grid-cols-12 overflow-hidden max-xl:h-30 max-lg:h-25">
        <div className="col-[2/-2] flex justify-between" />
      </div>

      {/* Separator line */}
      <svg width="100%" height="1" className="text-border">
        <line
          x1="0"
          y1="0.5"
          x2="100%"
          y2="0.5"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>

      {/* Sub-hero CTA bar */}
      <div className="container">
        <div className="grid w-full grid-cols-12">
          <div className="col-[2/-2] flex flex-col items-center justify-between gap-6 py-12 max-md:pb-10 max-md:pt-15 lg:flex-row lg:gap-0">
            <p className="max-w-md text-center text-lg text-foreground lg:text-left">
              Engineered for performance. Unified by design. Powered by
              Universal Context.
            </p>
            <div className="flex items-center justify-center gap-x-2.5">
              <Button variant="outline" size="md" href="#">
                Talk to sales
              </Button>
              <Button variant="primary" size="md" href="#">
                Start for free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
