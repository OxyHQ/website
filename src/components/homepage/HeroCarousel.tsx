import { useRef, useEffect, useCallback, useState } from 'react'
import type { CarouselSlot } from '../../data/heroCarousel'
import CarouselSlotRenderer from './HeroCarouselCard'

interface HeroCarouselProps {
  slots: CarouselSlot[]
}

const NORMAL_SPEED = 0.5   // px per frame (~30px/s at 60fps)
const SLOW_SPEED = 0.1     // px per frame on hover

export default function HeroCarousel({ slots }: HeroCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const speedRef = useRef(NORMAL_SPEED)
  const targetSpeedRef = useRef(NORMAL_SPEED)
  const rafRef = useRef<number>(0)
  const [, setMounted] = useState(false)

  const animate = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    // Smoothly interpolate speed toward target
    speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.03

    posRef.current -= speedRef.current
    const halfWidth = track.scrollWidth / 2
    if (Math.abs(posRef.current) >= halfWidth) {
      posRef.current += halfWidth
    }
    track.style.transform = `translateX(${posRef.current}px)`
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    setMounted(true)
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate])

  const handleMouseEnter = useCallback(() => {
    targetSpeedRef.current = SLOW_SPEED
  }, [])

  const handleMouseLeave = useCallback(() => {
    targetSpeedRef.current = NORMAL_SPEED
  }, [])

  return (
    <div
      className="hero-carousel-outer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hero-carousel-track" ref={trackRef}>
        <div className="hero-carousel-grid">
          {slots.map((slot, i) => (
            <CarouselSlotRenderer key={i} slot={slot} />
          ))}
        </div>
        <div className="hero-carousel-grid" aria-hidden="true">
          {slots.map((slot, i) => (
            <CarouselSlotRenderer key={`dup-${i}`} slot={slot} />
          ))}
        </div>
      </div>
    </div>
  )
}
