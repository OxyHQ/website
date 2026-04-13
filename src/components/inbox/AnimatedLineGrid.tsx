import { useRef, useEffect } from 'react'

export default function AnimatedLineGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let scrollY = 0

    function handleScroll() {
      scrollY = window.scrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas!.getBoundingClientRect()
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx!.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      if (!ctx || !canvas) return
      const w = canvas.getBoundingClientRect().width
      const h = canvas.getBoundingClientRect().height

      ctx.clearRect(0, 0, w, h)

      // Vertical lines
      const lineCount = 40
      const spacing = w / lineCount
      const scrollFactor = scrollY * 0.3
      const maxDisplacement = 20

      for (let i = 0; i < lineCount; i++) {
        const baseX = i * spacing
        // Magnetic displacement — lines near center move more
        const centerDist = Math.abs(baseX - w / 2) / (w / 2)
        const displacement = Math.sin(scrollFactor * 0.01 + i * 0.3) * maxDisplacement * (1 - centerDist)
        const x = baseX + displacement

        // Opacity fades with scroll
        const opacity = Math.max(0, 0.12 - scrollY * 0.0002)

        ctx.beginPath()
        ctx.moveTo(x, 0)

        // Curved line with scroll-responsive control points
        const cp1y = h * 0.33
        const cp2y = h * 0.66
        const cp1x = x + Math.sin(scrollFactor * 0.008 + i * 0.5) * 10
        const cp2x = x - Math.sin(scrollFactor * 0.006 + i * 0.4) * 10

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, h)
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Horizontal lines (fewer, thinner)
      const hLineCount = 15
      const hSpacing = h / hLineCount
      for (let i = 0; i < hLineCount; i++) {
        const baseY = i * hSpacing
        const displacement = Math.sin(scrollFactor * 0.005 + i * 0.4) * 8
        const y = baseY + displacement
        const opacity = Math.max(0, 0.06 - scrollY * 0.0001)

        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.lineWidth = 0.3
        ctx.stroke()
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      aria-hidden="true"
    />
  )
}
