import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { HeroCarouselCard } from '../../data/heroCarousel'

const sizeClasses: Record<string, string> = {
  '1x1': 'hero-card-1x1',
  '2x1': 'hero-card-2x1',
  '1x2': 'hero-card-1x2',
  '2x2': 'hero-card-2x2',
  '4x2': 'hero-card-4x2',
}

/* ─── Rotating content hook ─── */
function useRotatingIndex(length: number, interval: number) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (length <= 1) return
    const id = setInterval(() => setIndex(i => (i + 1) % length), interval)
    return () => clearInterval(id)
  }, [length, interval])
  return index
}

/* ─── Newsroom Card ─── */
function NewsroomCard({ card }: { card: Extract<HeroCarouselCard, { type: 'newsroom' }> }) {
  const idx = useRotatingIndex(card.posts.length, 4000)
  const post = card.posts[idx]

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#7c3aed]">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="absolute inset-0 flex flex-col"
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
        >
          <img
            src={post.image}
            alt={post.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-purple-200">
              {post.category}
            </span>
            <p className="text-sm font-semibold leading-tight text-white">
              {post.title}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ─── Careers Card ─── */
function CareersCard({ card }: { card: Extract<HeroCarouselCard, { type: 'careers' }> }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#3b82f6] p-4 text-center">
      <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
        {card.department}
      </span>
      <p className="text-lg font-bold leading-tight text-white">
        {card.jobTitle}
      </p>
    </div>
  )
}

/* ─── Brand Card ─── */
function BrandCard({ card }: { card: Extract<HeroCarouselCard, { type: 'brand' }> }) {
  if (card.variant === 'oxy') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black p-4">
        <span className="text-3xl font-black tracking-tight text-[#c084fc]">
          OXY
        </span>
      </div>
    )
  }

  // Fair brand — repeating text pattern
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#166534]">
      {/* Repeating FAIRCOIN text pattern */}
      <div className="absolute inset-0 flex flex-col justify-center gap-1 opacity-30">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="whitespace-nowrap text-sm font-bold text-green-200"
            style={{ transform: `translateX(${(i % 3) * -20}px)` }}
          >
            FAIRCOIN FAIRCOIN FAIRCOIN FAIRCOIN FAIRCOIN FAIRCOIN
          </div>
        ))}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-1">
        <span className="text-2xl font-black text-white">FAIR</span>
      </div>
    </div>
  )
}

/* ─── Photo Card ─── */
function PhotoCard({ card }: { card: Extract<HeroCarouselCard, { type: 'photo' }> }) {
  return (
    <div className="h-full w-full overflow-hidden">
      <img
        src={card.image}
        alt={card.alt}
        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

/* ─── FairCoin Dashboard Card ─── */
function FairCoinCard() {
  const stats = [
    { label: 'Current Blocks', value: '842,391' },
    { label: 'Network (KH/s)', value: '1,247' },
    { label: 'Active Peers', value: '3,891' },
    { label: 'Difficulty', value: '0.0024' },
  ]

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#166534]">
      {/* Left section — stats */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-green-200">
            FairCoin Today
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 px-3 py-2">
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-green-300">
                  {stat.label}
                </span>
                <span className="text-sm font-bold text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold text-green-900">
            Buy
          </button>
          <button className="rounded-full border border-white/30 px-4 py-1.5 text-[11px] font-semibold text-white">
            Learn more
          </button>
        </div>
      </div>
      {/* Right section — empowering stores */}
      <div className="relative flex w-2/5 flex-col overflow-hidden rounded-2xl bg-[#14532d] m-3">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop"
          alt="Local store"
          className="h-2/3 w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="flex flex-1 items-center p-3">
          <p className="text-[11px] font-semibold leading-tight text-green-100">
            Empowering local stores with FairCoin: a sustainable solution
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Values Card ─── */
function ValuesCard({ card }: { card: Extract<HeroCarouselCard, { type: 'values' }> }) {
  const idx = useRotatingIndex(card.items.length, 3500)
  const item = card.items[idx]

  return (
    <div className="flex h-full w-full flex-col justify-center bg-[#fafaf9] p-5">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
        >
          <h4 className="text-sm font-bold text-gray-900">{item.heading}</h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.body}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ─── Polymorphic Renderer ─── */
export default function HeroCarouselCardRenderer({ card }: { card: HeroCarouselCard }) {
  const sizeClass = sizeClasses[card.size] ?? 'hero-card-1x1'

  return (
    <div className={`hero-card ${sizeClass}`}>
      {card.type === 'newsroom' && <NewsroomCard card={card} />}
      {card.type === 'careers' && <CareersCard card={card} />}
      {card.type === 'brand' && <BrandCard card={card} />}
      {card.type === 'photo' && <PhotoCard card={card} />}
      {card.type === 'faircoin' && <FairCoinCard />}
      {card.type === 'values' && <ValuesCard card={card} />}
    </div>
  )
}
