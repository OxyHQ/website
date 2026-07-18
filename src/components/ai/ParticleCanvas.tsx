import { useCallback } from 'react'
import { parseRgb } from './parseRgb'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  pulseOffset: number
}

/**
 * Floating particle canvas with pulsing dots and connection lines.
 * Used as the background for the AI for Research CTA section.
 */
export default function ParticleCanvas({ className }: { className?: string }) {
  // React 19 callback ref — owns the rAF loop and the window resize listener.
  // When the canvas mounts the loop starts; on unmount everything is torn down.
  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {
    if (!el) return
    const ctx2d = el.getContext('2d')
    if (!ctx2d) return

    let w = 0
    let h = 0
    const PARTICLE_COUNT = 120
    const CONNECTION_DIST_SQ = 100 * 100
    const particles: Particle[] = []
    let fgRgb: [string, string, string] = ['255', '255', '255']
    let rafId = 0

    const readFgColor = () => {
      const fg = getComputedStyle(el).getPropertyValue('color')
      if (fg) fgRgb = parseRgb(fg)
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      w = el.clientWidth
      h = el.clientHeight
      el.width = w * dpr
      el.height = h * dpr
      ctx2d.scale(dpr, dpr)
      readFgColor()
    }

    const initParticles = () => {
      particles.length = 0
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.8 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
          pulseOffset: Math.random() * Math.PI * 2,
        })
      }
    }

    resize()
    initParticles()

    const animate = () => {
      ctx2d.clearRect(0, 0, w, h)
      const time = Date.now() * 0.001
      const [cr, cg, cb] = fgRgb

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        const pulse = Math.sin(time * 1.5 + p.pulseOffset) * 0.3 + 0.7
        const alpha = p.opacity * pulse

        ctx2d.beginPath()
        ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx2d.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`
        ctx2d.fill()
      }

      ctx2d.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distSq = dx * dx + dy * dy
          if (distSq < CONNECTION_DIST_SQ) {
            const alpha = (1 - Math.sqrt(distSq) / 100) * 0.06
            ctx2d.beginPath()
            ctx2d.moveTo(particles[i].x, particles[i].y)
            ctx2d.lineTo(particles[j].x, particles[j].y)
            ctx2d.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`
            ctx2d.stroke()
          }
        }
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)

    const onResize = () => {
      resize()
      initParticles()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`text-foreground ${className ?? ''}`}
      style={{
        width: '100%',
        height: '100%',
        mask: 'radial-gradient(circle at center, black, transparent)',
        WebkitMask: 'radial-gradient(circle at center, black, transparent)',
      }}
    />
  )
}
