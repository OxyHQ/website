import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CardSize, CarouselSlot, HeroCard } from '../../data/heroCarousel'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCube, Autoplay } from 'swiper/modules'
import { StarFour, PlugsConnected, Unite, Cpu } from '@phosphor-icons/react'
import 'swiper/css'
import 'swiper/css/effect-cube'

function useCountUp(end: number, decimals: number, duration = 2000) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        setValue(parseFloat((ease * end).toFixed(decimals)))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [end, decimals, duration])
  return { value, ref }
}

function AnimatedStat({ end, decimals }: { end: number; decimals: number }) {
  const { value, ref } = useCountUp(end, decimals)
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

function CardFace({ card }: { card: HeroCard }) {
  switch (card.type) {
    case 'newsroom':
      return (
        <div className="relative h-full w-full">
          <img
            src={card.image}
            alt={card.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-purple-900/30" />
          <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-purple-200 lg:text-[11px]">
              {card.category}
            </span>
            <p className="text-xl font-bold leading-tight text-white lg:text-2xl">
              {card.title}
            </p>
          </div>
        </div>
      )

    case 'careers':
      return (
        <Link
          to={card.slug ? `/company/careers/${card.slug}` : '/company/careers'}
          className="flex h-full w-full flex-col items-start justify-end bg-primary p-4 lg:p-5"
        >
          <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white lg:text-[10px]">
            {card.department}
          </span>
          <p className="text-2xl font-extrabold leading-tight text-white lg:text-3xl">
            {card.jobTitle}
          </p>
        </Link>
      )

    case 'brand':
      if (card.variant === 'oxy') {
        return (
          <img
            src="/images/landing/oxy3d.png"
            alt="Oxy"
            className="h-full w-full object-cover bg-black"
            loading="lazy"
            decoding="async"
          />
        )
      }
      return (
        <div className="relative flex h-full w-full items-center justify-center bg-[#166534]">
          <div className="absolute inset-[-50%] flex flex-col justify-center gap-0.5 opacity-40" style={{ transform: 'rotate(-15deg)' }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="whitespace-nowrap text-xs font-extrabold text-green-300 lg:text-sm"
                style={{ marginLeft: `${(i % 3) * -30}px` }}
              >
                FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN
              </div>
            ))}
          </div>
          <span className="relative z-10 text-3xl font-black text-white lg:text-4xl">FAIR</span>
        </div>
      )

    case 'photo':
      return (
        <img
          src={card.image}
          alt={card.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )

    case 'faircoin':
      return <FairCoinFace />

    case 'video':
      return (
        <video
          src={card.src}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="h-full w-full object-cover"
        />
      )

    case 'values':
      return (
        <div className="flex h-full w-full flex-col justify-center bg-[#fafaf9] p-4 lg:p-5">
          <h4 className="text-2xl font-bold text-gray-900 lg:text-3xl">{card.heading}</h4>
          <p className="mt-1 text-base leading-relaxed text-gray-600 lg:text-lg">{card.body}</p>
        </div>
      )
  }
}

const FAIRCOIN_STORE_IMAGE = '/images/landing/faircoin-store.png'

const FAIRCOIN_STATS = [
  { label: 'Current Blocks', end: 842391, decimals: 0, Icon: StarFour },
  { label: 'Network (KH/s)', end: 1247, decimals: 0, Icon: PlugsConnected },
  { label: 'Active Peers', end: 3891, decimals: 0, Icon: Unite },
  { label: 'Difficulty', end: 0.0024, decimals: 4, Icon: Cpu },
]

function FairCoinFace() {
  const [runs, setRuns] = useState(() => FAIRCOIN_STATS.map(() => 0))
  return (
    <div className="grid h-full w-full overflow-hidden grid-cols-[1fr_1fr_auto] bg-[#166534]" style={{ borderRadius: '9999px 20px 20px 9999px' }}>
      {/* Col 1: title + buttons */}
      <div className="flex flex-col justify-center gap-3 pl-10 py-4 pr-3 lg:pl-14 lg:py-5 lg:pr-4">
        <h3 className="text-5xl font-extrabold uppercase tracking-wider text-white">
          FairCoin <span className="font-normal italic text-green-200">Today</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          <a href="https://buy.fairco.in" target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-400 px-4 py-1.5 text-sm font-bold text-green-900">
            Buy
          </a>
          <a href="https://explorer.fairco.in" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold text-white">
            Explorer
          </a>
          <a href="https://fairco.in" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold text-white">
            Learn more
          </a>
        </div>
      </div>
      {/* Col 2: stats grid */}
      <div className="flex items-center py-4 px-3 lg:py-5 lg:px-4">
        <div className="flex w-full flex-col gap-1.5 lg:gap-2">
          {FAIRCOIN_STATS.map((stat, i) => (
            <div key={stat.label} className="cursor-pointer select-none rounded-full bg-white/10 px-2.5 py-2 lg:px-3 lg:py-2.5" onClick={() => setRuns(r => r.map((v, j) => j === i ? v + 1 : v))}>
              <div className="flex items-center gap-2">
                <stat.Icon size={16} className="text-green-400" weight="bold" />
                <div>
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-green-300 lg:text-[10px]">
                    {stat.label}
                  </span>
                  <span className="block text-xl font-bold text-white lg:text-2xl">
                    <AnimatedStat key={runs[i]} end={stat.end} decimals={stat.decimals} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Col 3: news card */}
      <div className="m-2.5 flex w-[260px] flex-col overflow-hidden rounded-2xl bg-[#14532d] lg:m-3 lg:w-[300px]">
        <img
          src={FAIRCOIN_STORE_IMAGE}
          alt="Local store"
          className="h-3/5 w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="flex flex-1 flex-col justify-end p-3 lg:p-4">
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-green-400 lg:text-[11px]">
            Apr 3, 2026
          </span>
          <p className="text-xl font-semibold leading-snug text-green-100 lg:text-2xl">
            Empowering local stores with FairCoin: a sustainable solution
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CarouselSlotRenderer({ slot }: { slot: CarouselSlot }) {
  const sizeClass = sizeClasses[slot.size]
  const radiusClass = slot.rounded ? 'rounded-full' : slot.roundedLeft ? '' : 'rounded-[20px]'
  const radiusStyle = slot.roundedLeft ? { borderRadius: '9999px 20px 20px 9999px' } : undefined
  // Static card — no rotation
  if (slot.faces.length <= 1) {
    return (
      <div className={`${slot.roundedLeft ? '' : 'overflow-hidden'} cursor-pointer ${radiusClass} ${sizeClass}`} style={radiusStyle}>
        <CardFace card={slot.faces[0]} />
      </div>
    )
  }

  // Rotating card — the entire grid cell IS the cube
  return (
    <CubeCard
      sizeClass={`${radiusClass} ${sizeClass}`}
      faces={slot.faces}
      interval={slot.rotateInterval ?? 4000}
    />
  )
}

function CubeCard({ sizeClass, faces, interval }: {
  sizeClass: string
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
            <CardFace card={face} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
