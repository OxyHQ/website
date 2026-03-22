import type React from 'react'
import { useState, useEffect } from 'react'
import { hero } from '../../data/content'
import Button from '../ui/Button'

export default function HeroSection() {
  const fullText = 'Ask anything'
  const [typedText, setTypedText] = useState('')
  const [showCursor, setShowCursor] = useState(false)
  const [typingDone, setTypingDone] = useState(false)

  useEffect(() => {
    const timers: number[] = []

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

    return () => timers.forEach(id => clearTimeout(id))
  }, [])

  return (
    <section className="flex min-h-[calc(100svh-var(--site-header-height))] flex-col bg-gradient-to-b from-primary-background to-secondary-background">
      {/* Main content area with background glow */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-1/4 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.07] blur-[120px]" />
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
                  className="mt-4 max-w-xl text-balance text-lg text-secondary-foreground lg:text-xl fade-in-from-bottom-1 animate-in fill-mode-both transition-[opacity,translate,transform] delay-[calc(var(--animate-delay)+300ms)] duration-1000 ease-in-out will-change-[translate,transform] max-lg:delay-[calc(var(--animate-delay-mobile)+300ms)] text-center"
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
                  className="relative z-10 flex items-center justify-between rounded-lg bg-white-100 pl-3 backdrop-blur-[2px] md:rounded-xl md:pl-4"
                  style={{
                    boxShadow:
                      '0 0 0 1px rgba(28,40,64,0.04), 0 9px 4px rgba(127,135,144,0.01), 0 5px 3px rgba(127,135,144,0.05), 0 2px 2px rgba(127,135,144,0.09), 0 1px 1px rgba(127,135,144,0.1)',
                  }}
                >
                  <span className="min-w-0 flex-1 text-[13px] font-medium leading-[18px] md:text-[15px] md:leading-5">
                    <span className="text-white-900" style={{ opacity: typedText.length > 0 ? 1 : 0 }}>
                      {typedText || '\u00A0'}
                      <span>{typingDone ? '.' : ''}</span>
                    </span>
                    {showCursor && (
                      <span className="ml-[1px] inline-block h-[1em] w-[1.5px] translate-y-[1px] animate-cursor-blink bg-white-900" />
                    )}
                  </span>
                  <div className="relative flex shrink-0 justify-end overflow-hidden p-1.5 md:p-[9px]">
                    {/* Blue send button */}
                    <div
                      className="flex size-7 items-center justify-center rounded-lg border border-black/10 bg-[#266df0] text-white-100 transition-opacity duration-500 md:size-8 md:rounded-[9px]"
                      style={{
                        boxShadow:
                          '0 2px 4px -2px rgba(15,107,233,0.12), 0 3px 6px -2px rgba(15,107,233,0.08)',
                        opacity: typingDone ? 1 : 0.3,
                      }}
                    >
                      {/* Arrow up icon */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="size-3.5 md:size-4"
                      >
                        <path
                          d="M6.52 1.35C6.74 1.1 7.04 1.12 7.24 1.32L11.24 5.32C11.46 5.54 11.46 5.9 11.24 6.13C11.01 6.35 10.65 6.35 10.43 6.13L7.41 3.1V12.01C7.41 12.32 7.15 12.58 6.83 12.58C6.52 12.58 6.26 12.32 6.26 12.01V3.1L3.24 6.13C3.02 6.35 2.65 6.35 2.43 6.13C2.21 5.9 2.21 5.54 2.43 5.32L6.43 1.32L6.52 1.35Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Empty response area */}
                <div className="mt-1.5 h-64 md:mt-2 md:h-76" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator line */}
      <svg width="100%" height="1" className="text-subtle-stroke">
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
            <p className="max-w-md text-center text-lg text-secondary-foreground lg:text-left">
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
