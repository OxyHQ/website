import InfoCard, { type CardItem } from './InfoCard'

interface CardGridProps {
  cards: CardItem[]
  /** Optional section title above the grid. */
  title?: string
  /** Optional line under the title. */
  description?: string
  columnsClassName?: string
  cardHeightClassName?: string
  /** Outer spacing — pass `pt-3 lg:pt-6` to butt this grid against the block above. */
  className?: string
}

/** A row of equal-height cards, the workhorse slice for feature and pathway lists. */
export default function CardGrid({
  cards,
  title,
  description,
  columnsClassName = 'md:grid-cols-2',
  cardHeightClassName,
  className = 'layout-padding-top',
}: CardGridProps) {
  return (
    <section className={`text-gray-a1 layout-px-large ${className}`}>
      {(title || description) && (
        <div className="mb-8 lg:mb-10">
          {title && <h2 className="text-h4 max-w-150">{title}</h2>}
          {description && <p className="text-b1 mt-4 max-w-125 text-alt-gray-e1">{description}</p>}
        </div>
      )}
      <div className={`grid grid-cols-1 gap-x-3 lg:gap-x-6 gap-y-3 lg:gap-y-6 auto-rows-fr ${columnsClassName}`}>
        {cards.map((card) => (
          <InfoCard key={card.title} card={card} heightClassName={cardHeightClassName} />
        ))}
      </div>
    </section>
  )
}
