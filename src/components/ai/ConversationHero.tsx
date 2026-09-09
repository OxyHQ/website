import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import Button from '../ui/Button'
import {
  conversationHeroVideos, conversationHeroHeadline, conversationHeroCta,
  conversationHeroCtaHref, conversationHeroMessages, conversationHeroSlotDay,
  conversationHeroSlots, conversationHeroSlotCta,
} from '../../data/ai'

/* The conversation plays one bubble at a time and holds on the last one. It
 * then fades out as a whole, empties itself while nobody can see it, and starts
 * again over the next video — rather than collapsing four bubbles on screen. */
const STEP_MS = 1700
const HOLD_MS = 4200
const FADE_MS = 500
const EMPTY_MS = 550
/** Text bubbles plus the closing scheduler card. */
const STEP_COUNT = conversationHeroMessages.length + 1

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 1.5c-3.6 0-7 1.8-7 4v1.25c0 .41.34.75.75.75h12.5c.41 0 .75-.34.75-.75V17.5c0-2.2-3.4-4-7-4Z" />
    </svg>
  )
}

function ChevronIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* A bubble is placed by how many turns have passed since it was said: the two
 * newest are solid, the one behind them is half faded, and anything older has
 * left the stack. Hidden rows keep zero height so the column grows upward from
 * the bottom as the conversation runs. */
function HeroBubble({ side, age, children }: { side: 'alia' | 'person'; age: number; children: ReactNode }) {
  const said = age >= 0
  const current = said && age <= 1
  const opacity = !said || age >= 3 ? 'opacity-0' : age === 2 ? 'opacity-50' : 'opacity-100'

  return (
    <div
      className={`grid motion-safe:transition-[grid-template-rows] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
        said ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      } ${side === 'person' ? 'place-self-start' : 'place-self-end'}`}
    >
      <div className="overflow-hidden">
        <div
          className={`mt-2 w-[75vw] max-w-[334px] rounded-2xl border border-foreground/20 bg-foreground/10 p-4 backdrop-blur-[82px] mask-t-from-50% mask-t-to-90% mask-size-[auto_200%] motion-safe:transition-[opacity,mask-position,translate,scale] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1.2,0.36,1)] md:mt-3 ${
            current ? 'mask-position-[center_100%]' : 'mask-position-[center_top]'
          } ${said ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.985]'} ${opacity}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ConversationHero() {
  // React does not reflect `muted` as an attribute, and Chrome refuses to
  // autoplay a video it cannot see is muted. Set it on the element itself.
  const startPlayback = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return
    el.muted = true
    void el.play().catch(() => {})
  }, [])

  const [step, setStep] = useState(1)
  const [phase, setPhase] = useState<'play' | 'out' | 'empty'>('play')
  const [videoIndex, setVideoIndex] = useState(0)

  // A keyed callback-ref owns exactly one timer for each phase. React invokes
  // its cleanup before replacing the sentinel, so stale transitions cannot
  // advance a conversation that has already moved on.
  const phaseTimerRef = useCallback((node: HTMLSpanElement | null) => {
    if (!node) return
    const isLast = step >= STEP_COUNT
    const delay = phase === 'out' ? FADE_MS : phase === 'empty' ? EMPTY_MS : isLast ? HOLD_MS : STEP_MS
    const id = setTimeout(() => {
      if (phase === 'out') {
        setStep(0)
        setVideoIndex((i) => (i + 1) % conversationHeroVideos.length)
        setPhase('empty')
      } else if (phase === 'empty') {
        setStep(1)
        setPhase('play')
      } else if (isLast) {
        setPhase('out')
      } else {
        setStep((current) => current + 1)
      }
    }, delay)
    return () => clearTimeout(id)
  }, [phase, step])

  return (
    <header className="force-dark relative isolate h-svh w-full overflow-hidden border-b border-border bg-background text-foreground md:h-[90svh] md:min-h-[700px]">
      <span key={`${phase}-${step}`} ref={phaseTimerRef} hidden aria-hidden="true" />
      {conversationHeroVideos.map((src, i) => (
        <div key={src} className={`absolute inset-0 transition-opacity duration-500 ${i === videoIndex ? 'opacity-100' : 'opacity-0 delay-200'}`}>
          <video
            className="pointer-events-none absolute block h-full w-full scale-110 object-cover object-[75%_center] blur-[10px] md:object-center"
            ref={startPlayback}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        </div>
      ))}
      {/* The backdrops are product footage rather than filmed material, so the
        * copy side is dimmed and the base fades out under the chat stack. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />

      <div className="mt-30 h-[calc(100%-(var(--spacing)*30))] xl:mt-60 xl:h-[calc(100%-(var(--spacing)*60))]">
        <div className="container relative z-10 h-full">
          <h1 className="mb-4 whitespace-pre-line text-display-4 font-normal tracking-[-0.02em] text-foreground md:mb-6">
            {conversationHeroHeadline}
          </h1>
          <Button variant="inverse" size="lg" href={conversationHeroCtaHref} className="rounded-full md:h-14 md:px-8!">
            {conversationHeroCta}
          </Button>
        </div>

        <div className="container relative z-10">
          <div className="absolute bottom-0 left-0 w-full min-[600px]:right-0 min-[600px]:left-auto min-[600px]:w-auto">
            <div
              className={`flex w-full flex-col justify-end overflow-y-clip p-4 transition-opacity duration-500 md:h-[386px] min-[600px]:w-[454px] xl:pb-8 ${
                phase === 'play' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {conversationHeroMessages.map((message, i) => (
                <HeroBubble key={message.text} side={message.author} age={step - 1 - i}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-label-md text-foreground/80">
                      <figure className="relative aspect-square size-4 overflow-hidden rounded-full">
                        {message.author === 'alia'
                          ? <img src="/images/apps/alia-mark.svg" alt="" className="size-4" loading="lazy" decoding="async" />
                          : <PersonIcon />}
                      </figure>
                      <span>{message.name}</span>
                    </div>
                    <p className="text-body-md text-foreground">{message.text}</p>
                  </div>
                </HeroBubble>
              ))}

              <HeroBubble side="alia" age={step - 1 - conversationHeroMessages.length}>
                <div aria-hidden="true" className="flex flex-col gap-3">
                  <div className="flex justify-between text-foreground">
                    <ChevronIcon className="size-4 rotate-90" />
                    <p className="text-label-sm">{conversationHeroSlotDay}</p>
                    <ChevronIcon className="size-4 -rotate-90" />
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-label-sm text-foreground/80 md:gap-2">
                    {conversationHeroSlots.map((slot, i) => (
                      <p key={slot} className={`flex items-center justify-center rounded-full px-2 py-1 md:px-2.5 ${i === 0 ? 'bg-foreground/20 text-foreground' : ''}`}>
                        {slot}
                      </p>
                    ))}
                  </div>
                  <p className="flex w-full items-center justify-center rounded-lg bg-foreground px-3 py-2 text-label-sm text-background/55">
                    {conversationHeroSlotCta}
                  </p>
                </div>
              </HeroBubble>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
