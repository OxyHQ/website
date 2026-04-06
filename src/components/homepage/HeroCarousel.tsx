import { useRef, useEffect, useCallback, useMemo } from 'react'
import type { CarouselSlot } from '../../data/heroCarousel'
import { useJobs, useNewsroomPosts } from '../../api/hooks'
import CarouselSlotRenderer from './HeroCarouselCard'

interface HeroCarouselProps {
  slots: CarouselSlot[]
}

const NORMAL_SPEED = 1.2   // px per frame (~72px/s at 60fps)
const SLOW_SPEED = 0.2     // px per frame on hover

export default function HeroCarousel({ slots }: HeroCarouselProps) {
  const { data: jobs } = useJobs()
  const { data: newsroomData } = useNewsroomPosts({ limit: 20 })
  const posts = newsroomData?.posts

  // Replace static faces with real CMS data when available
  const resolvedSlots = useMemo(() => {
    let newsroomIndex = 0

    return slots.map(slot => {
      const hasNewsroom = slot.faces.some(f => f.type === 'newsroom')
      const hasCareers = slot.faces.some(f => f.type === 'careers')

      if (hasNewsroom && posts?.length) {
        const count = slot.faces.length
        const slicedPosts = posts.slice(newsroomIndex, newsroomIndex + count)
        newsroomIndex += count
        if (slicedPosts.length === 0) return slot
        return {
          ...slot,
          faces: slicedPosts.map(post => ({
            type: 'newsroom' as const,
            title: post.title,
            image: post.coverImage ?? '',
            category: post.category,
          })),
        }
      }

      if (hasCareers && jobs?.length) {
        return {
          ...slot,
          faces: jobs.map((job: { title: string; slug: string; department?: string }) => ({
            type: 'careers' as const,
            jobTitle: job.title,
            department: job.department ?? 'Careers',
            slug: job.slug,
          })),
        }
      }

      return slot
    })
  }, [slots, jobs, posts])

  const outerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(-1) // start slightly negative to avoid wrap on first frame
  const speedRef = useRef(NORMAL_SPEED)
  const targetSpeedRef = useRef(NORMAL_SPEED)
  const rafRef = useRef<number>(0)

  // Animation loop — always runs, combines auto speed + any manual offset
  const animate = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    // Smoothly interpolate speed toward target (hover slow / normal)
    speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.05
    posRef.current -= speedRef.current

    // Infinite wrap: two identical grids side by side
    const halfWidth = track.scrollWidth / 2
    if (halfWidth > 0) {
      if (posRef.current <= -halfWidth) posRef.current += halfWidth
      else if (posRef.current > 0) posRef.current -= halfWidth
    }

    track.style.transform = `translateX(${posRef.current}px)`
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  // Start/stop on mount and visibility change
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    rafRef.current = requestAnimationFrame(animate)

    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(rafRef.current)
      else rafRef.current = requestAnimationFrame(animate)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [animate])

  // Wheel on the carousel element: add scroll delta on top of auto-animation
  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return

    const handleWheel = (e: WheelEvent) => {
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      const delta = isHorizontal ? e.deltaX : e.deltaY
      if (Math.abs(delta) < 1) return

      if (isHorizontal) e.preventDefault()

      posRef.current -= delta
    }

    outer.addEventListener('wheel', handleWheel, { passive: false })
    return () => outer.removeEventListener('wheel', handleWheel)
  }, [])

  const handleMouseEnter = useCallback(() => {
    targetSpeedRef.current = SLOW_SPEED
  }, [])

  const handleMouseLeave = useCallback(() => {
    targetSpeedRef.current = NORMAL_SPEED
  }, [])

  return (
    <div
      ref={outerRef}
      className="hero-carousel-outer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hero-carousel-track" ref={trackRef}>
        <div className="hero-carousel-grid">
          {resolvedSlots.map((slot, i) => (
            <CarouselSlotRenderer key={i} slot={slot} />
          ))}
        </div>
        <div className="hero-carousel-grid" aria-hidden="true">
          {resolvedSlots.map((slot, i) => (
            <CarouselSlotRenderer key={`dup-${i}`} slot={slot} />
          ))}
        </div>
      </div>
    </div>
  )
}
