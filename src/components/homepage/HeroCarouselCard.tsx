import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CardSize, CarouselSlot, HeroCard } from '../../data/heroCarousel'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCube, Autoplay } from 'swiper/modules'
import { StarFour, PlugsConnected, Unite, Cpu } from '@phosphor-icons/react'
import { useFairCoinStats, useNewsroomPosts } from '../../api/hooks'
import type { FairCoinStats } from '../../api/faircoinStore'
import 'swiper/css'
import 'swiper/css/effect-cube'

function AnimatedStat({ end, decimals, duration = 2000 }: { end: number; decimals: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let rafId = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        setValue(parseFloat((ease * end).toFixed(decimals)))
        if (t < 1) rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [end, decimals, duration])

  return (
    <span ref={ref}>
      {decimals > 0 ? value.toFixed(decimals) : value.toLocaleString()}
    </span>
  )
}

const sizeClasses: Record<CardSize, string> = {
  '1x1': 'row-span-1 col-span-1',
  '2x1': 'row-span-1 col-span-2',
  '1x2': 'row-span-2 col-span-2',
  '2x2': 'row-span-2 col-span-2',
  '4x2': 'row-span-2 col-span-4',
  '5x2': 'row-span-2 col-span-5',
}

const isLargeSlot = (size: CardSize) => size !== '1x1'

function NewsroomFace({ card, size }: { card: Extract<HeroCard, { type: 'newsroom' }>; size: CardSize }) {
  const large = isLargeSlot(size)
  return (
    <Link to={`/newsroom/${card.slug}`} className="relative block h-full w-full text-white">
      <img src={card.image} alt={card.title} className="absolute inset-0 h-full w-full object-cover" width={800} height={600} loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-purple-900/30" />
      <div className={`absolute bottom-0 left-0 right-0 ${large ? 'p-4 lg:p-5' : 'p-2.5 lg:p-3'}`}>
        <span className={`mb-0.5 block truncate font-bold uppercase tracking-wider text-purple-200 ${large ? 'text-[10px] lg:text-xs' : 'text-[9px] lg:text-[10px]'}`}>{card.category}</span>
        <p className={`line-clamp-4 font-bold leading-snug ${large ? 'text-lg lg:text-xl' : 'text-sm lg:text-base'}`}>{card.title}</p>
      </div>
    </Link>
  )
}

function CareersFace({ card, size }: { card: Extract<HeroCard, { type: 'careers' }>; size: CardSize }) {
  const large = isLargeSlot(size)
  return (
    <Link to={card.slug ? `/company/careers/${card.slug}` : '/company/careers'} className={`flex h-full w-full flex-col items-start justify-end bg-primary text-white ${large ? 'p-5 lg:p-6' : 'p-4 lg:p-5'}`}>
      <span className="mb-2 inline-block max-w-full truncate rounded-full bg-white/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white lg:text-[10px]">{card.department}</span>
      <p className={`line-clamp-3 font-extrabold leading-tight text-white ${large ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'}`}>{card.jobTitle}</p>
    </Link>
  )
}

function BrandFace({ card }: { card: Extract<HeroCard, { type: 'brand' }> }) {
  if (card.variant === 'oxy') {
    return <img src="/images/landing/oxy3d.png" alt="Oxy" className="h-full w-full bg-black object-cover" width={512} height={341} loading="lazy" decoding="async" />
  }
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#166534]">
      <div className="absolute inset-[-50%] flex flex-col justify-center gap-0.5 opacity-40" style={{ transform: 'rotate(-15deg)' }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="whitespace-nowrap text-xs font-extrabold text-green-300 lg:text-sm" style={{ marginLeft: `${(i % 3) * -30}px` }}>
            FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN
          </div>
        ))}
      </div>
      <span className="relative z-10 text-3xl font-black text-white lg:text-4xl">FAIR</span>
    </div>
  )
}

function PhotoFace({ card }: { card: Extract<HeroCard, { type: 'photo' }> }) {
  return <img src={card.image} alt={card.alt} className="h-full w-full object-cover" width={800} height={600} loading="lazy" decoding="async" />
}

function VideoFace({ card }: { card: Extract<HeroCard, { type: 'video' }> }) {
  return <video src={card.src} autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" />
}

function ValuesFace({ card, size }: { card: Extract<HeroCard, { type: 'values' }>; size: CardSize }) {
  const large = isLargeSlot(size)
  return (
    <div className={`flex h-full w-full flex-col justify-center bg-[#fafaf9] ${large ? 'p-4 lg:p-5' : 'p-3 lg:p-4'}`}>
      <h4 className={`truncate font-bold text-gray-900 ${large ? 'text-xl lg:text-2xl' : 'text-lg lg:text-xl'}`}>{card.heading}</h4>
      <p className={`mt-1 line-clamp-3 leading-relaxed text-gray-600 ${large ? 'text-sm lg:text-base' : 'text-xs lg:text-sm'}`}>{card.body}</p>
    </div>
  )
}

function CardFace({ card, size }: { card: HeroCard; size: CardSize }) {
  switch (card.type) {
    case 'newsroom': return <NewsroomFace card={card} size={size} />
    case 'careers': return <CareersFace card={card} size={size} />
    case 'brand': return <BrandFace card={card} />
    case 'photo': return <PhotoFace card={card} />
    case 'faircoin': return <FairCoinFace />
    case 'video': return <VideoFace card={card} />
    case 'values': return <ValuesFace card={card} size={size} />
  }
}

const FAIRCOIN_STORE_IMAGE = '/images/landing/faircoin-store.png'

type FairCoinStatKey = 'blocks' | 'hashrate' | 'peers' | 'difficulty'

const FAIRCOIN_STAT_META: { key: FairCoinStatKey; label: string; decimals: number; Icon: typeof StarFour }[] = [
  { key: 'blocks', label: 'Current Blocks', decimals: 0, Icon: StarFour },
  { key: 'hashrate', label: 'Network (KH/s)', decimals: 0, Icon: PlugsConnected },
  { key: 'peers', label: 'Active Peers', decimals: 0, Icon: Unite },
  { key: 'difficulty', label: 'Difficulty', decimals: 4, Icon: Cpu },
]

function toDisplayValues(stats: FairCoinStats | null): Record<FairCoinStatKey, number> {
  if (!stats) return { blocks: 0, hashrate: 0, peers: 0, difficulty: 0 }
  return {
    blocks: stats.blocks,
    hashrate: stats.networkHashPs / 1000,
    peers: stats.connections,
    difficulty: stats.difficulty,
  }
}

const FAIRCOIN_NEWS_DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }

function FairCoinFace() {
  const stats = useFairCoinStats()
  const values = toDisplayValues(stats)
  const [runs, setRuns] = useState(() => FAIRCOIN_STAT_META.map(() => 0))

  // Pull the latest FairCoin-tagged newsroom post from the CMS for the
  // right-hand news card. Falls back to the static image + copy when the
  // query hasn't resolved or there's nothing tagged yet.
  const { data: newsData } = useNewsroomPosts({ tag: 'FairCoin', limit: 1 })
  const post = newsData?.posts?.[0]
  const newsImage = (post && typeof post.coverImage === 'string' && post.coverImage) || FAIRCOIN_STORE_IMAGE
  const newsTitle = post?.title ?? 'Empowering local stores with FairCoin'
  const newsDate = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', FAIRCOIN_NEWS_DATE_FORMAT)
    : ''
  const newsHref = post?.slug ? `/newsroom/${post.slug}` : null
  return (
    <div className="grid h-full w-full grid-cols-[1fr_1fr_auto] bg-[#166534]">
      {/* Col 1: title + buttons */}
      <div className="flex flex-col justify-center gap-3 pl-10 py-4 pr-3 lg:pl-14 lg:py-5 lg:pr-4">
        <h3 className="text-5xl font-extrabold uppercase tracking-wider text-white">
          FairCoin <span className="font-normal italic text-green-200">Today</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          <a href="https://buy.fairco.in" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[#166534]">
            Buy
          </a>
          <a href="https://explorer.fairco.in" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-bold text-white hover:bg-white/10">
            Explorer
          </a>
          <a href="https://fairco.in" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-bold text-white hover:bg-white/10">
            Learn more
          </a>
        </div>
      </div>
      {/* Col 2: stats grid */}
      <div className="flex items-center py-4 px-3 lg:py-5 lg:px-4">
        <div className="flex w-full flex-col gap-1.5 lg:gap-2">
          {FAIRCOIN_STAT_META.map((stat, i) => {
            const value = values[stat.key]
            return (
              <div key={stat.label} className="cursor-pointer select-none rounded-full bg-white/10 px-2.5 py-2 lg:px-3 lg:py-2.5" onClick={() => setRuns(r => r.map((v, j) => j === i ? v + 1 : v))}>
                <div className="flex items-center gap-2">
                  <stat.Icon size={16} className="text-white/70" weight="bold" />
                  <div>
                    <span className="block text-[9px] font-semibold uppercase tracking-wider text-white/70 lg:text-[10px]">
                      {stat.label}
                    </span>
                    <span className="block text-xl font-bold text-white lg:text-2xl">
                      <AnimatedStat key={`${runs[i]}-${value}`} end={value} decimals={stat.decimals} />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Col 3: news card — CMS-driven, latest post tagged "FairCoin" */}
      {newsHref ? (
        <Link to={newsHref} className="group m-2.5 flex w-[260px] flex-col overflow-hidden rounded-2xl bg-[#14532d] lg:m-3 lg:w-[300px]">
          <img
            src={newsImage}
            alt=""
            className="h-3/5 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            width={600}
            height={400}
            loading="lazy"
            decoding="async"
          />
          <div className="flex flex-1 flex-col justify-end p-3 lg:p-4">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-green-400 lg:text-[11px]">
              {newsDate}
            </span>
            <p className="line-clamp-3 text-xl font-semibold leading-snug text-green-100 lg:text-2xl">
              {newsTitle}
            </p>
          </div>
        </Link>
      ) : (
        <div className="m-2.5 flex w-[260px] flex-col overflow-hidden rounded-2xl bg-[#14532d] lg:m-3 lg:w-[300px]">
          <img
            src={newsImage}
            alt=""
            className="h-3/5 w-full object-cover"
            width={600}
            height={400}
            loading="lazy"
            decoding="async"
          />
          <div className="flex flex-1 flex-col justify-end p-3 lg:p-4">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-green-400 lg:text-[11px]">
              {newsDate}
            </span>
            <p className="line-clamp-3 text-xl font-semibold leading-snug text-green-100 lg:text-2xl">
              {newsTitle}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CarouselSlotRenderer({ slot }: { slot: CarouselSlot }) {
  const sizeClass = sizeClasses[slot.size]
  const radiusClass = slot.rounded ? 'rounded-full' : slot.roundedLeft ? 'hero-card-pill-left' : 'rounded-[20px]'

  if (slot.faces.length <= 1) {
    return (
      <div className={`overflow-hidden cursor-pointer ${radiusClass} ${sizeClass}`}>
        <CardFace card={slot.faces[0]} size={slot.size} />
      </div>
    )
  }

  return (
    <CubeCard
      sizeClass={`${radiusClass} ${sizeClass}`}
      size={slot.size}
      faces={slot.faces}
      interval={slot.rotateInterval ?? 4000}
    />
  )
}

function CubeCard({ sizeClass, size, faces, interval }: {
  sizeClass: string
  size: CardSize
  faces: HeroCard[]
  interval: number
}) {
  return (
    <div className={`relative overflow-hidden ${sizeClass}`}>
      <Swiper
        modules={[EffectCube, Autoplay]}
        effect="cube"
        direction="vertical"
        loop
        allowTouchMove={false}
        speed={800}
        autoplay={{
          delay: interval,
          disableOnInteraction: false,
        }}
        cubeEffect={{
          shadow: false,
          slideShadows: false,
        }}
        className="hero-cube-swiper"
      >
        {faces.map((face, i) => (
          <SwiperSlide key={i}>
            <CardFace card={face} size={size} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
