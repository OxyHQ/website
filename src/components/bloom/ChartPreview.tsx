import { useEffect, useRef, useState } from 'react'
import BloomPreview, { type BloomDemoName } from './BloomPreview'

/** The reference renders every chart on a 596px canvas, scaled to its card. */
export default function ChartPreview({
  name,
  height,
}: {
  name: BloomDemoName
  height: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(Math.min(1, entry.contentRect.width / 596))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="group/preview relative w-full overflow-hidden h-auto px-4 pt-4 xl:h-auto">
      <div
        ref={ref}
        className="relative w-full"
        style={{ height: Math.round(height * scale) }}
      >
        <div
          className="absolute top-0 left-1/2"
          style={{
            width: 596,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <div className="relative h-full w-full">
            <BloomPreview name={name} />
          </div>
        </div>
      </div>
    </div>
  )
}
