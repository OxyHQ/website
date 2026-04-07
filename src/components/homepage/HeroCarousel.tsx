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

  const resolvedSlots = useMemo(() => {
    const newsroomFaces = (posts ?? []).map(post => ({
      type: 'newsroom' as const,
      title: post.title,
      image: post.coverImage ?? '',
      category: post.categories[0],
      slug: post.slug,
    }))

    const careerFaces = (jobs ?? []).map((job: { title: string; slug: string; department?: string }) => ({
      type: 'careers' as const,
      jobTitle: job.title,
      department: job.department ?? 'Careers',
      slug: job.slug,
    }))

    let newsroomOffset = 0

    return slots.map(slot => {
      const firstFaceType = slot.faces[0]?.type

      if (firstFaceType === 'newsroom' && newsroomFaces.length > 0) {
        const chunk = newsroomFaces.slice(newsroomOffset, newsroomOffset + slot.faces.length)
        newsroomOffset += slot.faces.length
        return chunk.length > 0 ? { ...slot, faces: chunk } : slot
      }

      if (firstFaceType === 'careers' && careerFaces.length > 0) {
        return { ...slot, faces: careerFaces }
      }

      return slot
    })
  }, [slots, jobs, posts])

  const outerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const speedRef = useRef(NORMAL_SPEED)
  const targetSpeedRef = useRef(NORMAL_SPEED)
  const rafRef = useRef<number>(0)

  const animate = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.05
    posRef.current -= speedRef.current

    const halfWidth = track.scrollWidth / 2
    if (halfWidth > 0) {
      if (posRef.current <= -halfWidth) posRef.current += halfWidth
      else if (posRef.current > 0) posRef.current -= halfWidth
    }

    track.style.transform = `translateX(${posRef.current}px)`
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const outer = outerRef.current
    if (!outer) return

    let visible = false

    const start = () => {
      if (!visible || document.hidden || rafRef.current !== 0) return
      rafRef.current = requestAnimationFrame(animate)
    }
    const stop = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) start()
        else stop()
      },
      { threshold: 0 },
    )
    io.observe(outer)

    const handleVisibility = () => {
      if (document.hidden) stop()
      else start()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [animate])

  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return

    const handleWheel = (e: WheelEvent) => {
      const rect = outer.getBoundingClientRect()
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return

      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      const delta = isHorizontal ? e.deltaX : e.deltaY
      if (Math.abs(delta) < 1) return

      if (isHorizontal) e.preventDefault()

      posRef.current -= delta
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
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
