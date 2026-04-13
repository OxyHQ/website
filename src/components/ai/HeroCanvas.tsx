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

/** Parse an rgb/rgba color string into [r, g, b] number strings. */
function parseRgb(color: string): [string, string, string] {
  const m = color.match(/(\d+)/g)
  return [m?.[0] ?? '255', m?.[1] ?? '255', m?.[2] ?? '255']
}

/**
 * Full-viewport starfield canvas animation.
 * Stars drift toward the camera with depth perspective and faint trails.
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

    function initStars() {
      stars.length = 0
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * w - w / 2,
          y: Math.random() * h - h / 2,
          z: Math.random() * 1000,
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
      const [cr, cg, cb] = fgRgb

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
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`
        ctx.fill()

        if (star.px && star.py) {
          ctx.beginPath()
          ctx.moveTo(star.px, star.py)
          ctx.lineTo(sx, sy)
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * 0.15})`
          ctx.lineWidth = Math.max(r * 0.4, 0.2)
          ctx.stroke()
        }

        star.px = sx
        star.py = sy
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    const onResize = () => { resize(); initStars() }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 text-foreground"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
