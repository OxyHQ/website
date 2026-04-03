import { useState } from 'react'
import type { HeroCarouselCard } from '../../data/heroCarousel'
import HeroCarouselCardRenderer from './HeroCarouselCard'

interface HeroCarouselProps {
  cards: HeroCarouselCard[]
}

export default function HeroCarousel({ cards }: HeroCarouselProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="hero-carousel-outer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="hero-carousel-track"
        style={{ '--marquee-speed': hovered ? '180s' : '60s' } as React.CSSProperties}
      >
        {/* Original grid */}
        <div className="hero-carousel-grid">
          {cards.map((card, i) => (
            <HeroCarouselCardRenderer key={i} card={card} />
          ))}
        </div>
        {/* Duplicate for seamless infinite loop */}
        <div className="hero-carousel-grid" aria-hidden="true">
          {cards.map((card, i) => (
            <HeroCarouselCardRenderer key={`dup-${i}`} card={card} />
          ))}
        </div>
      </div>
    </div>
  )
}
