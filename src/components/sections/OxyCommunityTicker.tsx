import { Pause, Play } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

type ImageCard = {
  type: 'image'
  image: string
  title: string
  width: 'wide' | 'large'
}

type ProfileCard = {
  type: 'profile'
  image: string
  name: string
  role: string
}

type QuoteCard = {
  type: 'quote'
  quote: string
  name: string
  role: string
  avatar?: string
  width: 'wide' | 'medium'
}

type StatCard = {
  type: 'stat'
  image: string
  value: string
  label: string
}

type QuotePairCard = {
  type: 'quote-pair'
  quotes: Array<{ quote: string; name: string; role: string; avatar?: string }>
}

type TickerCard = ImageCard | ProfileCard | QuoteCard | StatCard | QuotePairCard

const TICKER_CARDS: TickerCard[] = [
  {
    type: 'image',
    image: '/images/landing/team-banner.jpg',
    title: 'Build technology with people, not around them.',
    width: 'wide',
  },
  {
    type: 'profile',
    image: '/images/landing/hero-photo-01.avif',
    name: 'Mention',
    role: 'Open social network',
  },
  {
    type: 'quote',
    quote: 'Open source gives people the right to understand, improve, and leave the technology they use.',
    name: 'The Oxy community',
    role: 'Builders, contributors, and dreamers',
    avatar: '/images/apps/mention.png',
    width: 'wide',
  },
  {
    type: 'profile',
    image: '/images/landing/hero-photo-02.avif',
    name: 'Allo',
    role: 'Think better, together',
  },
  {
    type: 'stat',
    image: '/images/landing/hero-photo-03.avif',
    value: 'Open',
    label: 'by design',
  },
  {
    type: 'image',
    image: '/images/landing/partnerships-banner.avif',
    title: 'Useful tools, shared identity, and a foundation you can inspect.',
    width: 'large',
  },
  {
    type: 'profile',
    image: '/images/landing/hero-photo-04.avif',
    name: 'FairCoin',
    role: 'Currency that cares',
  },
  {
    type: 'quote-pair',
    quotes: [
      { quote: 'Technology should leave people with more agency, not less.', name: 'Oxy values', role: 'Human first' },
      { quote: 'Transparency is the beginning of trust.', name: 'Oxy values', role: 'Open by default' },
    ],
  },
  {
    type: 'profile',
    image: '/images/landing/company-band.jpg',
    name: 'Homiio',
    role: 'Housing made fair',
  },
  {
    type: 'stat',
    image: '/images/landing/founder-quote.jpg',
    value: 'Human',
    label: 'at the center',
  },
  {
    type: 'quote',
    quote: 'One identity can connect many tools without turning people into products.',
    name: 'The Oxy ecosystem',
    role: 'One account you own',
    avatar: '/images/apps/alia.svg',
    width: 'medium',
  },
  {
    type: 'image',
    image: '/images/landing/commons-night.webp',
    title: 'One identity, many ways to live, build, and connect.',
    width: 'wide',
  },
]

const IMAGE_WIDTHS = {
  wide: 'w-[315px] md:w-[420px]',
  large: 'w-[345px] md:w-[460px]',
  medium: 'w-[275px] md:w-[370px]',
} as const

function MediaCard({ card }: { card: ImageCard }) {
  return (
    <article className={`relative h-[360px] shrink-0 overflow-hidden rounded-2xl bg-foreground md:h-[480px] ${IMAGE_WIDTHS[card.width]}`}>
      <img src={card.image} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover object-top" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      <p className="absolute inset-x-0 bottom-0 p-5 text-xl font-medium leading-tight text-foreground md:p-7 md:text-[28px]">{card.title}</p>
    </article>
  )
}

function ProfileCardView({ card }: { card: ProfileCard }) {
  return (
    <article className="relative h-[360px] w-[225px] shrink-0 overflow-hidden rounded-2xl bg-foreground md:h-[480px] md:w-[300px]">
      <img src={card.image} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover object-top" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-5 text-left text-foreground md:p-6">
        <span className="text-[15px] font-medium">{card.name}</span>
        <span className="text-[13px] text-muted-foreground">{card.role}</span>
      </div>
    </article>
  )
}

function QuoteCardView({ card }: { card: QuoteCard }) {
  return (
    <article className={`flex h-[360px] shrink-0 flex-col justify-between gap-4 rounded-2xl bg-background p-[22px] pb-5 text-foreground md:h-[480px] md:p-8 md:pb-7 ${IMAGE_WIDTHS[card.width]}`}>
      <span aria-hidden="true" className="font-display text-[54px] leading-none text-muted-foreground/25 md:text-[64px]">“</span>
      <p className="flex-1 text-[15px] leading-[1.55] md:text-[17px]">{card.quote}</p>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{card.name}</span>
          <span className="truncate text-xs text-muted-foreground">{card.role}</span>
        </div>
        {card.avatar ? (
          <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-[10px] font-bold text-muted-foreground">
            <img src={card.avatar} alt="" aria-hidden="true" className="size-full object-cover" />
          </span>
        ) : null}
      </div>
    </article>
  )
}

function StatCardView({ card }: { card: StatCard }) {
  return (
    <article className="flex h-[360px] w-[275px] shrink-0 flex-col gap-4 md:h-[480px] md:w-[370px]">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
        <img src={card.image} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover object-top" loading="lazy" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-background p-6 text-center text-foreground">
        <span className="font-display text-[44px] font-medium leading-none md:text-[56px]">{card.value}<span className="ml-1 text-2xl">★</span></span>
        <span className="text-sm text-muted-foreground">{card.label}</span>
      </div>
    </article>
  )
}

function QuotePairCardView({ card }: { card: QuotePairCard }) {
  return (
    <article className="flex h-[360px] w-[275px] shrink-0 flex-col gap-4 md:h-[480px] md:w-[370px]">
      {card.quotes.map((quote) => (
        <div key={quote.quote} className="flex min-h-0 flex-1 flex-col items-start justify-start gap-3 rounded-2xl bg-background p-6 text-left text-foreground">
          <span aria-hidden="true" className="font-display text-5xl leading-none text-muted-foreground/25">“</span>
          <p className="flex flex-1 items-center text-[15px] font-medium leading-[1.45] md:text-[17px]">{quote.quote}</p>
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{quote.name}</span>
              <span className="truncate text-xs text-muted-foreground">{quote.role}</span>
            </div>
            {quote.avatar ? <img src={quote.avatar} alt="" aria-hidden="true" className="size-7 shrink-0 rounded-full object-cover" /> : null}
          </div>
        </div>
      ))}
    </article>
  )
}

function TickerCardView({ card }: { card: TickerCard }) {
  if (card.type === 'image') return <MediaCard card={card} />
  if (card.type === 'profile') return <ProfileCardView card={card} />
  if (card.type === 'quote') return <QuoteCardView card={card} />
  if (card.type === 'stat') return <StatCardView card={card} />
  return <QuotePairCardView card={card} />
}

export default function OxyCommunityTicker() {
  const trackRef = useRef<HTMLDivElement>(null)
  const loopWidthRef = useRef(0)
  const scrollPositionRef = useRef(0)
  const isHoveredRef = useRef(false)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    const track = trackRef.current
    const firstSet = track?.firstElementChild as HTMLElement | null
    if (!playing || !track || !firstSet) return

    const measureLoop = () => {
      loopWidthRef.current = firstSet.offsetWidth
    }

    measureLoop()
    scrollPositionRef.current = track.scrollLeft
    const resizeObserver = new ResizeObserver(measureLoop)
    resizeObserver.observe(firstSet)

    let frame = 0
    let previousTime = performance.now()
    const tick = (time: number) => {
      const elapsed = Math.min(time - previousTime, 50)
      previousTime = time
      scrollPositionRef.current += elapsed * (isHoveredRef.current ? 0.025 : 0.08)

      if (loopWidthRef.current > 0 && scrollPositionRef.current >= loopWidthRef.current) {
        scrollPositionRef.current -= loopWidthRef.current
      }

      track.scrollLeft = scrollPositionRef.current

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [playing])

  const renderCards = (clone = false) => (
    <div className="flex shrink-0 gap-4 pe-4" aria-hidden={clone || undefined}>
      {TICKER_CARDS.map((card, index) => (
        <TickerCardView key={`${clone ? 'clone' : 'original'}-${card.type}-${index}`} card={card} />
      ))}
    </div>
  )

  return (
    <section className="overflow-hidden bg-surface py-10 text-foreground md:py-14">
      <div className="group/ticker relative w-full">
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          className="pointer-events-none absolute bottom-4 right-4 z-10 hidden size-11 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-lg transition-[opacity,background-color] hover:bg-background group-hover/ticker:pointer-events-auto group-hover/ticker:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 group-focus-within/ticker:pointer-events-auto group-focus-within/ticker:opacity-100 md:flex"
          aria-label={playing ? 'Pause auto-scrolling' : 'Play auto-scrolling'}
        >
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} weight="fill" aria-hidden="true" />}
        </button>

        <div
          ref={trackRef}
          onMouseEnter={() => { isHoveredRef.current = true }}
          onMouseLeave={() => { isHoveredRef.current = false }}
          className="layout-px-bleed flex w-full overflow-x-auto pb-1 scrollbar-none"
        >
          {renderCards()}
          {renderCards(true)}
        </div>
      </div>
    </section>
  )
}
