import { Link } from 'react-router-dom'
import type { NavDropdownCard, NavFeatureGrid as NavFeatureGridContent } from '../../data/content'
import NavDropdownItem from '../ui/NavDropdownItem'

/* ─── Promo card ─── */

/** Image + gradient + title/description, the whole card links to `card.href`. */
function NavCardMedia({ card }: { card: NavDropdownCard }) {
  return (
    <>
      <img
        src={card.image}
        alt={card.alt ?? card.title}
        className="h-full w-full object-cover object-left transition-transform duration-500 ease-out group-hover:scale-105 dark:opacity-70 dark:group-hover:opacity-100"
      />
      <div className="absolute inset-x-0 bottom-0 flex h-64 items-end justify-center bg-gradient-to-b from-transparent to-gray-800">
        <div className="w-full overflow-hidden rounded-b-xl p-5">
          <p className="flex items-center font-semibold text-white">{card.title}</p>
          <p className="mt-1.5 text-sm text-gray-100 transition-colors group-hover:text-white dark:text-gray-200">
            {card.description}
          </p>
        </div>
      </div>
    </>
  )
}

/** Clickable promo card. Internal hrefs route via `Link`, external via `<a>`. */
export function NavCard({ card, className = '' }: { card: NavDropdownCard; className?: string }) {
  const cls = `group relative block h-full cursor-pointer overflow-hidden rounded-xl ${className}`
  return card.href.startsWith('/') ? (
    <Link to={card.href} className={cls}>
      <NavCardMedia card={card} />
    </Link>
  ) : (
    <a href={card.href} className={cls}>
      <NavCardMedia card={card} />
    </a>
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
