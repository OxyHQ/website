import { useRef, useEffect, useCallback, useMemo } from 'react'
import type { CarouselSlot } from '../../data/heroCarousel'
import { useJobs } from '../../api/hooks'
import CarouselSlotRenderer from './HeroCarouselCard'

interface HeroCarouselProps {
  slots: CarouselSlot[]
}

const NORMAL_SPEED = 1.2   // px per frame (~72px/s at 60fps)
const SLOW_SPEED = 0.2     // px per frame on hover
const RESUME_DELAY = 150  // ms after last scroll event before auto resumes

export default function HeroCarousel({ slots }: HeroCarouselProps) {
  const { data: jobs } = useJobs()

  // Replace static careers faces with real job data when available
  const resolvedSlots = useMemo(() => {
    if (!jobs?.length) return slots
    return slots.map(slot => {
      const hasCareers = slot.faces.some(f => f.type === 'careers')
      if (!hasCareers) return slot
      return {
        ...slot,
        faces: jobs.map((job: { title: string; slug: string; department?: string }) => ({
          type: 'careers' as const,
          jobTitle: job.title,
          department: job.department ?? 'Careers',
          slug: job.slug,
        })),
      }
    })
  }, [slots, jobs])

  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const speedRef = useRef(NORMAL_SPEED)
  const targetSpeedRef = useRef(NORMAL_SPEED)
  const rafRef = useRef<number>(0)
  const manualScrolling = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const animate = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    if (!manualScrolling.current) {
      // Smoothly interpolate speed toward target
      speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.03
      posRef.current -= speedRef.current
    }

    const halfWidth = track.scrollWidth / 2
    if (posRef.current <= -halfWidth) {
      posRef.current += halfWidth
    } else if (posRef.current >= 0) {
      posRef.current -= halfWidth
    }
    track.style.transform = `translateX(${posRef.current}px)`
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current)
      } else {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [animate])

  const outerRef = useRef<HTMLDivElement>(null)

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      manualScrolling.current = false
    }, RESUME_DELAY)
  }, [])

  // Listen to wheel events on the window so vertical page scroll also drives the carousel
  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return

    const handleWheel = (e: WheelEvent) => {
      // Check if the carousel is in the viewport
      const rect = outer.getBoundingClientRect()
      const inView = rect.bottom > 0 && rect.top < window.innerHeight
      if (!inView) return

      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      const delta = isHorizontal ? e.deltaX : e.deltaY
      if (Math.abs(delta) < 1) return

      // Horizontal scroll on the carousel: capture exclusively
      if (isHorizontal) e.preventDefault()

      // Vertical scroll: page scrolls normally AND carousel moves
      manualScrolling.current = true
      posRef.current -= delta
      scheduleResume()
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [scheduleResume])

  const handleMouseEnter = useCallback(() => {
    if (!manualScrolling.current) {
      targetSpeedRef.current = SLOW_SPEED
    }
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
