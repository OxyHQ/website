import { useRef, useEffect } from 'react'

interface Star {
  x: number
  y: number
  z: number
  px: number
  py: number
  size: number
  opacity: number
}

/**
 * Full-viewport starfield / particle canvas animation.
 * Replicates the xAI hero background with drifting stars that
 * subtly move toward the camera, creating a depth effect.
 */
export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    const STAR_COUNT = 400
    const stars: Star[] = []

    // Read the theme foreground color so particles match light/dark mode
    function getFgColor() {
      const style = getComputedStyle(canvas!)
      const fg = style.getPropertyValue('color')
      return fg || 'rgb(255,255,255)'
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.scale(dpr, dpr)
    }

    function initStars() {
      stars.length = 0
      for (let i = 0; i < STAR_COUNT; i++) {
        const x = Math.random() * w - w / 2
        const y = Math.random() * h - h / 2
        const z = Math.random() * 1000
        stars.push({
          x,
          y,
          z,
          px: 0,
          py: 0,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.2,
        })
      }
    }

    resize()
    initStars()

    const speed = 0.15

    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      // Parse foreground color to r,g,b for canvas drawing
      const fgRaw = getFgColor()
      const m = fgRaw.match(/(\d+)/g)
      const r2 = m?.[0] ?? '255'
      const g2 = m?.[1] ?? '255'
      const b2 = m?.[2] ?? '255'

      for (const star of stars) {
        star.z -= speed

        if (star.z <= 0) {
          star.x = Math.random() * w - w / 2
          star.y = Math.random() * h - h / 2
          star.z = 1000
          star.px = 0
          star.py = 0
        }

        const perspective = 600 / star.z
        const sx = star.x * perspective + cx
        const sy = star.y * perspective + cy

        if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) {
          star.x = Math.random() * w - w / 2
          star.y = Math.random() * h - h / 2
          star.z = 1000
          continue
        }

        const r = star.size * perspective * 0.5
        const alpha = star.opacity * Math.min(1, (1000 - star.z) / 600)

        ctx.beginPath()
        ctx.arc(sx, sy, Math.max(r, 0.3), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r2}, ${g2}, ${b2}, ${alpha})`
        ctx.fill()

        // Faint trail
        if (star.px && star.py) {
          ctx.beginPath()
          ctx.moveTo(star.px, star.py)
          ctx.lineTo(sx, sy)
          ctx.strokeStyle = `rgba(${r2}, ${g2}, ${b2}, ${alpha * 0.15})`
          ctx.lineWidth = Math.max(r * 0.4, 0.2)
          ctx.stroke()
        }

        star.px = sx
        star.py = sy
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    const onResize = () => {
      resize()
      initStars()
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
      className="absolute bottom-0 left-0 right-0 top-0 text-foreground"
      style={{ opacity: 1, width: '100%', height: '100%' }}
    />
  )
}
