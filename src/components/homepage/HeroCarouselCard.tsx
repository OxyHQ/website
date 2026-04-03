import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import type { CarouselSlot, HeroCard } from '../../data/heroCarousel'

const sizeClasses: Record<string, string> = {
  '1x1': 'hero-card-1x1',
  '2x1': 'hero-card-2x1',
  '1x2': 'hero-card-1x2',
  '2x2': 'hero-card-2x2',
  '4x2': 'hero-card-4x2',
}

/* ─── Single card face renderer ─── */
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
            <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-purple-200 lg:text-[10px]">
              {card.category}
            </span>
            <p className="text-xs font-bold leading-tight text-white lg:text-sm">
              {card.title}
            </p>
          </div>
        </div>
      )

    case 'careers':
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

    case 'brand':
      if (card.variant === 'oxy') {
        return (
          <div className="flex h-full w-full items-center justify-center bg-black">
            <span className="text-4xl font-black tracking-tight text-[#c084fc] lg:text-5xl">
              OXY
            </span>
          </div>
        )
      }
      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#166534]">
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

    case 'faircoin':
      return <FairCoinFace />

    case 'values':
      return (
        <div className="flex h-full w-full flex-col justify-center bg-[#fafaf9] p-4 lg:p-5">
          <h4 className="text-sm font-bold text-gray-900 lg:text-base">{card.heading}</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-600 lg:text-xs">{card.body}</p>
        </div>
      )
  }
}

/* ─── FairCoin dashboard face ─── */
function FairCoinFace() {
  const stats = [
    { label: 'Current Blocks', value: '842,391', icon: '\u2191' },
    { label: 'Network (KH/s)', value: '1,247', icon: '\u26A1' },
    { label: 'Active Peers', value: '3,891', icon: '\u25CF' },
    { label: 'Difficulty', value: '0.0024', icon: '\u25C6' },
  ]

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#166534]">
      <div className="flex flex-1 flex-col p-4 lg:p-5">
        <div className="mb-auto flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14532d] lg:h-10 lg:w-10">
            <span className="text-sm font-black text-green-300 lg:text-base">EF</span>
          </div>
        </div>
        <div className="mb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white lg:text-base">
            FairCoin <span className="font-normal italic text-green-200">Today</span>
          </h3>
        </div>
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
        <div className="mt-3 flex gap-2 lg:mt-4">
          <button className="rounded-full bg-white px-4 py-1.5 text-[10px] font-bold text-green-900 lg:text-xs">
            Buy
          </button>
          <button className="rounded-full border border-white/30 px-4 py-1.5 text-[10px] font-bold text-white lg:text-xs">
            Learn more
          </button>
        </div>
      </div>
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

/* ─── Carousel Slot — renders one grid cell ─── */
export default function CarouselSlotRenderer({ slot }: { slot: CarouselSlot }) {
  const sizeClass = sizeClasses[slot.size] ?? 'hero-card-1x1'

  // Static card — no rotation
  if (slot.faces.length <= 1) {
    return (
      <div className={`hero-card ${sizeClass}`}>
        <CardFace card={slot.faces[0]} />
      </div>
    )
  }

  // Rotating card — the entire grid cell IS the cube
  return (
    <CubeCard
      sizeClass={sizeClass}
      faces={slot.faces}
      interval={slot.rotateInterval ?? 4000}
    />
  )
}

/* ─── 3D Cube Card ───
 * The grid cell itself is the cube perspective container.
 * A rotating inner div holds two faces positioned in 3D space.
 * The entire card — border-radius, content, everything — rotates as one unit.
 *
 * Geometry (vertical rotation, top→front):
 *   Front face:  translateZ(halfHeight)             — visible at rotateX(0)
 *   Top face:    rotateX(90deg) translateZ(halfHeight)  — visible at rotateX(-90deg)
 */
function CubeCard({ sizeClass, faces, interval }: {
  sizeClass: string
  faces: HeroCard[]
  interval: number
}) {
  const [current, setCurrent] = useState(0)
  const [angle, setAngle] = useState(0)
  const cubeRef = useRef<HTMLDivElement>(null)
  const [halfH, setHalfH] = useState(100)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const next = (current + 1) % faces.length

  useLayoutEffect(() => {
    if (cubeRef.current) {
      setHalfH(cubeRef.current.offsetHeight / 2)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setAngle(-90)
      timeoutRef.current = setTimeout(() => {
        setCurrent(c => (c + 1) % faces.length)
        if (cubeRef.current) cubeRef.current.style.transition = 'none'
        setAngle(0)
        requestAnimationFrame(() => {
          if (cubeRef.current) {
            cubeRef.current.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }
        })
      }, 800)
    }, interval)
    return () => {
      clearInterval(id)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [faces.length, interval])

  return (
    <div className={`hero-cube-slot ${sizeClass}`}>
      <div
        ref={cubeRef}
        className="hero-cube-inner"
        style={{
          transform: `rotateX(${angle}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Front face — the card you see normally */}
        <div
          className="hero-cube-face"
          style={{ transform: `translateZ(${halfH}px)` }}
        >
          <CardFace card={faces[current]} />
        </div>
        {/* Top face — rotates into view when cube flips */}
        <div
          className="hero-cube-face"
          style={{ transform: `rotateX(90deg) translateZ(${halfH}px)` }}
        >
          <CardFace card={faces[next]} />
        </div>
      </div>
    </div>
  )
}
