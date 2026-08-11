import { Link } from 'react-router-dom'
import type { CardSize, CarouselSlot, HeroCard } from '../../data/heroCarousel'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCube, Autoplay } from 'swiper/modules'
import { PromoCard } from '../ui/PromoCard'
import 'swiper/css'
import 'swiper/css/effect-cube'

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
        <span className={`mb-0.5 block truncate font-bold uppercase tracking-wider text-purple-200 ${large ? 'text-label-sm lg:text-xs' : 'text-[9px] lg:text-[10px]'}`}>{card.category}</span>
        <p className={`font-display line-clamp-4 font-bold leading-snug ${large ? 'text-lg lg:text-xl' : 'text-sm lg:text-base'}`}>{card.title}</p>
      </div>
    </Link>
  )
}

function CareersFace({ card, size }: { card: Extract<HeroCard, { type: 'careers' }>; size: CardSize }) {
  const large = isLargeSlot(size)
  return (
    <Link to={card.slug ? `/company/careers/${card.slug}` : '/company/careers'} className={`flex h-full w-full flex-col items-start justify-end bg-primary text-white ${large ? 'p-5 lg:p-6' : 'p-4 lg:p-5'}`}>
      <span className="mb-2 inline-block max-w-full truncate rounded-full bg-white/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white lg:text-[10px]">{card.department}</span>
      <p className={`font-display line-clamp-3 font-extrabold leading-tight text-white ${large ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'}`}>{card.jobTitle}</p>
    </Link>
  )
}

function BrandFace({ card }: { card: Extract<HeroCard, { type: 'brand' }> }) {
  if (card.variant === 'oxy') {
    return <img src="/images/landing/oxy-logo.jpg" alt="Oxy" className="h-full w-full bg-black object-cover" width={640} height={640} loading="lazy" decoding="async" />
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
      <h4 className={`font-display truncate font-bold text-gray-900 ${large ? 'text-xl lg:text-2xl' : 'text-lg lg:text-xl'}`}>{card.heading}</h4>
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
    case 'video': return <VideoFace card={card} />
    case 'values': return <ValuesFace card={card} size={size} />
    case 'promo': return <PromoCard image={card.image} title={card.title} description={card.description} href={card.href} alt={card.alt} />
  }
}

export default function CarouselSlotRenderer({ slot }: { slot: CarouselSlot }) {
  const sizeClass = sizeClasses[slot.size]
  // Circles, rectangles and squares — nothing in between. A slot is round
  // only when round is the whole shape.
  const radiusClass = slot.rounded ? 'rounded-full' : ''

  if (slot.faces.length <= 1) {
    return (
      <div className={`overflow-hidden cursor-pointer border border-border ${radiusClass} ${sizeClass}`}>
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
    <div className={`relative overflow-hidden border border-border ${sizeClass}`}>
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
