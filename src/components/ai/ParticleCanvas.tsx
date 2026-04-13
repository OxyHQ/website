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

/**
 * Floating particle canvas for the CTA / "Pro" section background.
 * Replicates the xAI SuperGrok section particle animation with
 * radial-gradient mask for soft edge falloff.
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
    const particles: Particle[] = []

    function resize() {
      const dpr = window.devicePixelRatio || 1
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.scale(dpr, dpr)
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

    function getFgColor() {
      const style = getComputedStyle(canvas!)
      const fg = style.getPropertyValue('color')
      return fg || 'rgb(255,255,255)'
    }

    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)

      const time = Date.now() * 0.001
      const fgRaw = getFgColor()
      const m = fgRaw.match(/(\d+)/g)
      const cr = m?.[0] ?? '255'
      const cg = m?.[1] ?? '255'
      const cb = m?.[2] ?? '255'

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        // Wrap around edges
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        const pulse = Math.sin(time * 1.5 + p.pulseOffset) * 0.3 + 0.7
        const alpha = p.opacity * pulse

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`
        ctx.fill()
      }

      // Draw faint connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.06
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    const onResize = () => {
      resize()
      initParticles()
    }
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
