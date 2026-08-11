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
 * Feature dropdown: a block of links beside the promo cards, each half taking an
 * equal share of the band and deciding its own column count from what it gets.
 * `auto-fit` is what makes that automatic — no breakpoint table, and no width
 * hardcoded here; the band is bounded by the site container and nothing else.
 * Features reuse `NavDropdownItem` so they match the other dropdowns.
 */
export function NavFeatureGrid({ grid }: { grid: NavFeatureGridContent }) {
  return (
    <div className="flex w-full gap-space-lg py-space-sm">
      {/* Same gap the sectioned panels use: one rhythm across every dropdown. */}
      <ul className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(240px,1fr))] items-start gap-1">
        {grid.features.map((item) => (
          <li key={item.href} className="contents">
            <NavDropdownItem item={item} />
          </li>
        ))}
      </ul>
      <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-space-lg">
        {grid.cards.map((card) => (
          <NavCard key={card.href} card={card} className="h-full" />
        ))}
      </div>
    </div>
  )
}
