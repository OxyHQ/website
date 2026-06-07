import type { NavDropdownCard, NavFeatureGrid as NavFeatureGridContent } from '../../data/content'
import NavDropdownItem from '../ui/NavDropdownItem'
import { PromoCard } from '../ui/PromoCard'

/* ─── Promo card ─── */

/** Nav adapter around the reusable {@link PromoCard} — keeps the rounded-xl shape
 *  used by the dropdown panels. */
export function NavCard({ card, className = '' }: { card: NavDropdownCard; className?: string }) {
  return (
    <PromoCard
      image={card.image}
      title={card.title}
      description={card.description}
      href={card.href}
      alt={card.alt}
      className={`rounded-xl ${className}`}
    />
  )
}

/* ─── Feature grid ─── */

/**
 * Three-column dropdown: a feature column followed by promo cards. Features reuse
 * `NavDropdownItem` so they match the other dropdowns; width fits content up to a
 * max so the panel grows/shrinks with what it holds.
 */
export function NavFeatureGrid({ grid }: { grid: NavFeatureGridContent }) {
  return (
    <div className="grid w-fit max-w-[1024px] grid-cols-[360px_300px_300px] gap-3 p-4 max-xl:grid-cols-[320px_260px_260px]">
      <ul className="flex flex-col gap-1">
        {grid.features.map((item) => (
          <li key={item.href} className="contents">
            <NavDropdownItem item={item} />
          </li>
        ))}
      </ul>
      {grid.cards.map((card) => (
        <NavCard key={card.href} card={card} />
      ))}
    </div>
  )
}
