import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import CommonsIcon from './CommonsIcon'
import { COMMONS_APP_PREVIEWS } from './commonsData'

// Same Fibonacci distribution and billboard projection as the supplied reference.
// The screenshots always face the viewer; depth changes their scale and light.
const tiles = Array.from({ length: 98 }, (_, index) => {
  const y = 1 - 2 * (index + 0.5) / 98
  const longitude = index * Math.PI * (3 - Math.sqrt(5))
  const radius = Math.sqrt(1 - y * y)
  return {
    app: COMMONS_APP_PREVIEWS[index % COMMONS_APP_PREVIEWS.length],
    x: radius * Math.cos(longitude), y: y * 0.98, z: radius * Math.sin(longitude),
    size: 0.72 + (index * 13 % 17) / 28,
  }
})

function project(tile: typeof tiles[number], angle: number): CSSProperties {
  const x = tile.x * Math.cos(angle) + tile.z * Math.sin(angle)
  const z = -tile.x * Math.sin(angle) + tile.z * Math.cos(angle)
  const y = tile.y * Math.cos(-0.13) - z * Math.sin(-0.13)
  const depth = tile.y * Math.sin(-0.13) + z * Math.cos(-0.13)
  const distance = (depth + 1) / 2
  const perspective = 2.7 / (2.7 - depth * 0.88)
  const scale = (0.26 + distance * 0.8) * tile.size
  const radius = 1.8221 * 0.38
  const height = 334 / 480 * 0.25
  return {
    left: `${(0.5 + x * radius * perspective) * 100}%`,
    top: `${(0.5437 + y * radius * perspective - 0.25 / 2.88 + height / 2) * 100}%`,
    width: `${25 * scale}%`, height: `${height * scale * 100}%`,
    opacity: 0.65 + distance * 0.35,
    filter: `brightness(${0.55 + distance * 0.45})`,
    zIndex: Math.round(distance * 800),
  }
}

export default function AppOrbit() {
  const root = useRef<HTMLDivElement>(null)
  const images = useRef<(HTMLImageElement | null)[]>([])
  const angle = useRef(0.75)
  const visible = useInView(root, { amount: 0.2 })
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const playing = visible && !paused && !reduced

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous = 0
    const tick = (time: number) => {
      if (previous && document.visibilityState === 'visible') {
        angle.current += Math.min(time - previous, 100) / 1000 * 0.035
        tiles.forEach((tile, index) => {
          const image = images.current[index]
          if (image) Object.assign(image.style, project(tile, angle.current))
        })
      }
      previous = time
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  return <div ref={root} className="commons-bento commons-orbit" data-playing={playing} data-slot="federal-orbit">
    <div className="commons-orbit-sphere" aria-hidden="true">
      {tiles.map((tile, index) => <img key={index} ref={(node) => { images.current[index] = node }} className="commons-orbit-tile" src={tile.app.image} alt="" loading="lazy" decoding="async" draggable={false} style={project(tile, 0.75)} />)}
    </div>
    <p className="sr-only">A rotating sphere of screenshots from Mention, Mercaria, Alia and Homiio, connected through your Oxy identity.</p>
    {!reduced && <button type="button" className="commons-control commons-art-control" aria-label={paused ? 'Play app orbit' : 'Pause app orbit'} onClick={() => setPaused(!paused)}>
      <CommonsIcon name={paused ? 'play' : 'pause'} size={18} />
    </button>}
  </div>
}
