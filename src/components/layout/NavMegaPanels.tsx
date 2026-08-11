import type { NavDropdownCard } from '../../data/content'
import { Link } from 'react-router-dom'

/* ─── Promo card ─── */

/**
 * The panel's large item: a picture over its own copy, sitting on the same grid
 * as the plain items and hovering the same way. There used to be a second shape
 * — one full-bleed image with the words laid over it — which at nav size read
 * as an advert and made the words fight the picture.
 */
export function NavCard({ card, className = '' }: { card: NavDropdownCard; className?: string }) {
  const inner = (
    <>
      <span className="block h-40 w-full overflow-hidden rounded-md border border-border bg-surface">
        <img
          src={card.image}
          alt={card.alt ?? ''}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </span>
      <span className="flex flex-col gap-space-3xs">
        <span className="text-body-md font-medium text-foreground">{card.title}</span>
        <span className="text-body-xs text-muted-foreground transition-colors duration-150 group-hover:text-foreground/80">
          {card.description}
        </span>
      </span>
    </>
  )
  const cardClass = `group flex h-fit flex-col gap-space-sm rounded-md p-space-sm transition-colors duration-150 hover:bg-foreground/5 active:bg-foreground/10 ${className}`

  if (card.href.startsWith('/')) {
    return (
      <Link to={card.href} className={cardClass}>
        {inner}
      </Link>
    )
  }
  return (
    <a href={card.href} target="_blank" rel="noopener noreferrer" className={cardClass}>
      {inner}
    </a>
  )
}
