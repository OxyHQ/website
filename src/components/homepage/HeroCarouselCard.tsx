import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { HeroCarouselCard } from '../../data/heroCarousel'

const sizeClasses: Record<string, string> = {
  '1x1': 'hero-card-1x1',
  '2x1': 'hero-card-2x1',
  '1x2': 'hero-card-1x2',
  '2x2': 'hero-card-2x2',
  '4x2': 'hero-card-4x2',
}

/* ─── 3D Cube Rotation ───
 * Both current and next faces are visible simultaneously during transition.
 * The container is a 3D cube: the current face rotates backward (0 → -90deg)
 * while the next face rotates in from the top (90deg → 0).
 */
function CubeRotator({ items, interval, renderItem }: {
  items: readonly unknown[]
  interval: number
  renderItem: (item: unknown, index: number) => React.ReactNode
}) {
  const [current, setCurrent] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  const next = (current + 1) % items.length
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (items.length <= 1) return
    const id = setInterval(() => {
      setIsRotating(true)
      // After animation completes, snap to the next item
      timeoutRef.current = setTimeout(() => {
        setCurrent(c => (c + 1) % items.length)
        setIsRotating(false)
      }, 600)
    }, interval)
    return () => {
      clearInterval(id)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [items.length, interval])

  return (
    <div className="cube-rotator">
      {/* Current face */}
      <motion.div
        className="cube-face"
        animate={{
          rotateX: isRotating ? -90 : 0,
          opacity: isRotating ? 0 : 1,
        }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformOrigin: 'center bottom' }}
      >
        {renderItem(items[current], current)}
      </motion.div>

      {/* Next face — only visible during rotation */}
      {items.length > 1 && (
        <motion.div
          className="cube-face"
          animate={{
            rotateX: isRotating ? 0 : 90,
            opacity: isRotating ? 1 : 0,
          }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformOrigin: 'center top' }}
        >
          {renderItem(items[next], next)}
        </motion.div>
      )}
    </div>
  )
}

/* ─── Newsroom Card ─── */
function NewsroomCard({ card }: { card: Extract<HeroCarouselCard, { type: 'newsroom' }> }) {
  return (
    <CubeRotator
      items={card.posts}
      interval={4000}
      renderItem={(item) => {
        const post = item as (typeof card.posts)[number]
        return (
          <div className="relative h-full w-full">
            <img
              src={post.image}
              alt={post.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-purple-900/30" />
            <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4">
              <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-purple-200 lg:text-[10px]">
                {post.category}
              </span>
              <p className="text-xs font-bold leading-tight text-white lg:text-sm">
                {post.title}
              </p>
            </div>
          </div>
        )
      }}
    />
  )
}

/* ─── Careers Card ─── */
function CareersCard({ card }: { card: Extract<HeroCarouselCard, { type: 'careers' }> }) {
  return (
    <div className="flex h-full w-full flex-col items-start justify-end bg-[#3b82f6] p-4 lg:p-5">
      <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white lg:text-[10px]">
        {card.department}
      </span>
      <p className="text-base font-extrabold leading-tight text-white lg:text-xl">
        {card.jobTitle}
      </p>
    </div>
  )
}

/* ─── Brand Card ─── */
function BrandCard({ card }: { card: Extract<HeroCarouselCard, { type: 'brand' }> }) {
  if (card.variant === 'oxy') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <span className="text-4xl font-black tracking-tight text-[#c084fc] lg:text-5xl">
          OXY
        </span>
      </div>
    )
  }

  // Fair brand — repeating diagonal text pattern
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#166534]">
      <div className="absolute inset-[-50%] flex flex-col justify-center gap-0.5 opacity-40" style={{ transform: 'rotate(-15deg)' }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="whitespace-nowrap text-xs font-extrabold text-green-300 lg:text-sm"
            style={{ marginLeft: `${(i % 3) * -30}px` }}
          >
            FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN &nbsp; FAIRCOIN
          </div>
        ))}
      </div>
      <span className="relative z-10 text-3xl font-black text-white lg:text-4xl">FAIR</span>
    </div>
  )
}

/* ─── Photo Card ─── */
function PhotoCard({ card }: { card: Extract<HeroCarouselCard, { type: 'photo' }> }) {
  return (
    <div className="h-full w-full">
      <img
        src={card.image}
        alt={card.alt}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

/* ─── FairCoin Dashboard Card ─── */
function FairCoinCard() {
  const stats = [
    { label: 'Current Blocks', value: '842,391', icon: '↑' },
    { label: 'Network (KH/s)', value: '1,247', icon: '⚡' },
    { label: 'Active Peers', value: '3,891', icon: '●' },
    { label: 'Difficulty', value: '0.0024', icon: '◆' },
  ]

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#166534]">
      {/* Left — header + stats + actions */}
      <div className="flex flex-1 flex-col p-4 lg:p-5">
        {/* Header with EF logo */}
        <div className="mb-auto flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14532d] lg:h-10 lg:w-10">
            <span className="text-sm font-black text-green-300 lg:text-base">EF</span>
          </div>
        </div>

        {/* FairCoin Today label */}
        <div className="mb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white lg:text-base">
            FairCoin <span className="font-normal italic text-green-200">Today</span>
          </h3>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/10 px-2.5 py-2 lg:px-3 lg:py-2.5">
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-green-400">{stat.icon}</span>
                <span className="text-[8px] font-semibold uppercase tracking-wider text-green-300 lg:text-[9px]">
                  {stat.label}
                </span>
              </div>
              <span className="mt-0.5 block text-sm font-bold text-white lg:text-base">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2 lg:mt-4">
          <button className="rounded-full bg-white px-4 py-1.5 text-[10px] font-bold text-green-900 lg:text-xs">
            Buy
          </button>
          <button className="rounded-full border border-white/30 px-4 py-1.5 text-[10px] font-bold text-white lg:text-xs">
            Learn more
          </button>
        </div>
      </div>

      {/* Right — sub-card with image */}
      <div className="m-2.5 flex w-[38%] flex-col overflow-hidden rounded-2xl bg-[#14532d] lg:m-3">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop"
          alt="Local store"
          className="h-3/5 w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="flex flex-1 items-center p-2.5 lg:p-3">
          <p className="text-[10px] font-semibold leading-snug text-green-100 lg:text-[11px]">
            Empowering local stores with FairCoin: a sustainable solution
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Values Card ─── */
function ValuesCard({ card }: { card: Extract<HeroCarouselCard, { type: 'values' }> }) {
  return (
    <CubeRotator
      items={card.items}
      interval={3500}
      renderItem={(item) => {
        const v = item as (typeof card.items)[number]
        return (
          <div className="flex h-full w-full flex-col justify-center bg-[#fafaf9] p-4 lg:p-5">
            <h4 className="text-sm font-bold text-gray-900 lg:text-base">{v.heading}</h4>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-600 lg:text-xs">{v.body}</p>
          </div>
        )
      }}
    />
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
