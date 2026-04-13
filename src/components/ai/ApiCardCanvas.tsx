import { useRef, useEffect } from 'react'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    const DOT_COUNT = 60
    const dots: Dot[] = []
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

    function initDots() {
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

    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)

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
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    const onResize = () => { resize(); initDots() }
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
      style={{ width: '100%', height: '100%' }}
    />
  )
}
