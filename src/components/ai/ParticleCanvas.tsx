import { useRef, useEffect } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  pulseOffset: number
}

/** Parse an rgb/rgba color string into [r, g, b] number strings. */
function parseRgb(color: string): [string, string, string] {
  const m = color.match(/(\d+)/g)
  return [m?.[0] ?? '255', m?.[1] ?? '255', m?.[2] ?? '255']
}

/**
 * Floating particle canvas with pulsing dots and connection lines.
 * Used as the background for the AI for Research CTA section.
 */
export default function ParticleCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    const PARTICLE_COUNT = 120
    const CONNECTION_DIST_SQ = 100 * 100 // squared to avoid sqrt
    const particles: Particle[] = []
    let fgRgb: [string, string, string] = ['255', '255', '255']

    function readFgColor() {
      const fg = getComputedStyle(canvas!).getPropertyValue('color')
      if (fg) fgRgb = parseRgb(fg)
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.scale(dpr, dpr)
      readFgColor()
    }

    function initParticles() {
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

    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)

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

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`
        ctx.fill()
      }

      // Connection lines (use squared distance to avoid sqrt)
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distSq = dx * dx + dy * dy
          if (distSq < CONNECTION_DIST_SQ) {
            const alpha = (1 - Math.sqrt(distSq) / 100) * 0.06
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`
            ctx.stroke()
          }
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    const onResize = () => { resize(); initParticles() }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animRef.current)
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
