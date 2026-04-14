import { useCallback } from 'react'

interface Dot {
  x: number
  y: number
  baseY: number
  phase: number
  amplitude: number
  speed: number
  size: number
}

/** Parse an rgb/rgba color string into [r, g, b] number strings. */
function parseRgb(color: string): [string, string, string] {
  const m = color.match(/(\d+)/g)
  return [m?.[0] ?? '255', m?.[1] ?? '255', m?.[2] ?? '255']
}

/**
 * Small canvas animation for the API product card.
 * Shows flowing data-stream dots visible on hover
 * (toggled via CSS group-hover opacity on the parent).
 */
export default function ApiCardCanvas({ className }: { className?: string }) {
  // React 19 callback ref — owns the rAF loop and resize listener from the
  // moment the canvas mounts until it unmounts.
  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {
    if (!el) return
    const ctx2d = el.getContext('2d')
    if (!ctx2d) return

    let w = 0
    let h = 0
    const DOT_COUNT = 60
    const dots: Dot[] = []
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

    const initDots = () => {
      dots.length = 0
      for (let i = 0; i < DOT_COUNT; i++) {
        const y = Math.random() * h
        dots.push({
          x: Math.random() * w,
          y,
          baseY: y,
          phase: Math.random() * Math.PI * 2,
          amplitude: Math.random() * 8 + 2,
          speed: Math.random() * 1.5 + 0.5,
          size: Math.random() * 1.5 + 0.5,
        })
      }
    }

    resize()
    initDots()

    const animate = () => {
      ctx2d.clearRect(0, 0, w, h)

      const time = Date.now() * 0.002
      const [cr, cg, cb] = fgRgb

      for (const dot of dots) {
        dot.x += dot.speed * 0.3
        if (dot.x > w + 5) {
          dot.x = -5
          dot.baseY = Math.random() * h
        }

        dot.y = dot.baseY + Math.sin(time + dot.phase) * dot.amplitude

        const alpha = 0.3 + Math.sin(time * 0.5 + dot.phase) * 0.2
        ctx2d.beginPath()
        ctx2d.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx2d.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`
        ctx2d.fill()
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)

    const onResize = () => {
      resize()
      initDots()
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
      style={{ width: '100%', height: '100%' }}
    />
  )
}
