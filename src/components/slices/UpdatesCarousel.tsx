import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SliceIcon from './SliceIcon'

export interface UpdateItem {
  title: string
  href: string
  image: string
  imageAlt: string
}

interface UpdatesCarouselProps {
  title: string
  items: UpdateItem[]
  /** Cards shown in the mobile grid, which has no carousel to page through. */
  mobileCount?: number
}

/** Gap between slides, in px — the arrows page by exactly one card plus this. */
const SLIDE_GAP = 24

function Card({ item, roundedClassName }: { item: UpdateItem; roundedClassName: string }) {
  return (
    <Link className="block" to={item.href}>
      <article className="group grid content-start">
        <div className={`aspect-444/297 overflow-hidden ${roundedClassName}`}>
          <div className="size-full transition-transform duration-300 group-hover:scale-105">
            <img
              alt={item.imageAlt}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition duration-50 ease-impulse"
              src={item.image}
            />
          </div>
        </div>
        <h3 className="text-b1 text-gray-a1 pt-4 transition-colors">{item.title}</h3>
      </article>
    </Link>
  )
}

/**
 * Related-content feed: a static two-column grid below `lg`, a horizontally
 * paged carousel above it. The carousel is a native scroll container with snap
 * points — the arrows just scroll it, so keyboard, trackpad and touch paging
 * all work without a slider runtime.
 */
export default function UpdatesCarousel({ title, items, mobileCount = 4 }: UpdatesCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const page = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.firstElementChild
    const step = slide instanceof HTMLElement ? slide.offsetWidth + SLIDE_GAP : track.clientWidth
    track.scrollBy({ left: step * direction, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const track = trackRef.current
    if (!track) return
    setAtStart(track.scrollLeft <= 1)
    setAtEnd(track.scrollLeft >= track.scrollWidth - track.clientWidth - 1)
  }

  const arrowClasses = (disabled: boolean) =>
    `px-6 py-2.5 h-8 items-center rounded-full inline-flex transition-all duration-100 ease-impulse ${
      disabled ? 'bg-gray-a9' : 'cursor-pointer bg-gray-a8 hover:bg-gray-a7'
    }`

  return (
    <section className="text-gray-a1 layout-padding-top">
      <div className="grid grid-cols-[1fr_auto] items-center layout-px-bleed mb-8 lg:mb-10">
        <h2 className="text-h4">{title}</h2>
        <div className="hidden lg:flex items-center">
          <button
            className={`${arrowClasses(atStart)} me-2`}
            type="button"
            aria-label="Previous slide"
            disabled={atStart}
            onClick={() => page(-1)}
          >
            <SliceIcon name="arrow-left" className={`size-3 ${atStart ? 'text-alt-gray-e2' : 'text-gray-a1'}`} />
          </button>
          <button className={arrowClasses(atEnd)} type="button" aria-label="Next slide" disabled={atEnd} onClick={() => page(1)}>
            <SliceIcon name="arrow-right" className={`size-3 ${atEnd ? 'text-alt-gray-e2' : 'text-gray-a1'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-3 layout-px-bleed lg:hidden">
        {items.slice(0, mobileCount).map((item) => (
          <Card key={item.href} item={item} roundedClassName="rounded-xl lg:rounded-2xl" />
        ))}
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="hidden lg:flex mt-8 gap-6 overflow-x-auto layout-px-bleed snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.href} className="w-125 shrink-0 snap-start">
            <Card item={item} roundedClassName="rounded-xl" />
          </div>
        ))}
      </div>
    </section>
  )
}
