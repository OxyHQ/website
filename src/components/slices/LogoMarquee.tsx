export interface MarqueeLogo {
  alt: string
  src: string
}

interface LogoMarqueeProps {
  logos: MarqueeLogo[]
  /** Adds a second row scrolling the other way — only shown below `md`. */
  showReverseRow?: boolean
  className?: string
}

/** Copies of the logo list per marquee half — enough to overrun the widest viewport. */
const REPEATS = 4

/**
 * The gap sits on each item rather than the track, so the track's width is an
 * exact multiple of one item's slot and the `-50%` keyframe lands on an
 * identical frame. A `gap` on the track leaves a half-gap seam at the loop.
 */
function Track({ logos, direction }: { logos: MarqueeLogo[]; direction: 'left' | 'right' }) {
  return (
    <ul
      className={`absolute flex h-full w-max ${
        direction === 'left' ? 'animate-carousel-to-left' : 'animate-carousel-to-right'
      }`}
    >
      {Array.from({ length: REPEATS * 2 }).flatMap((_, copy) =>
        logos.map((logo) => (
          <li
            key={`${copy}-${logo.alt}`}
            className="flex h-full rounded-xl lg:rounded-2xl overflow-hidden border border-gray-a8 me-3 md:me-5"
          >
            <img alt={logo.alt} loading="lazy" width={236} height={236} decoding="async" className="h-full w-auto" src={logo.src} />
          </li>
        )),
      )}
    </ul>
  )
}

function Row({ logos, direction, className = '' }: { logos: MarqueeLogo[]; direction: 'left' | 'right'; className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden h-30 md:h-59 ${className}`}>
      {/* The fade has to be the page's own colour to read as the logos sliding
       * under the edge — `white` only matched while the theme was pinned light.
       * `to-transparent` fades to transparent BLACK in some engines, which
       * greys the midpoint, so the far stop is the same colour at zero alpha. */}
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-30 sm:w-50 lg:w-80 bg-gradient-to-r from-background to-background/0" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-30 sm:w-50 lg:w-80 bg-gradient-to-l from-background to-background/0" />
      <Track logos={logos} direction={direction} />
    </div>
  )
}

/** Continuously scrolling logo wall, faded into the page at both edges. */
export default function LogoMarquee({ logos, showReverseRow = true, className = 'pt-8 md:pt-16' }: LogoMarqueeProps) {
  return (
    <section className={`gap-5 flex flex-col ${className}`}>
      <Row logos={logos} direction="left" />
      {showReverseRow && <Row logos={logos} direction="right" className="md:hidden" />}
    </section>
  )
}
