import type { ReactNode } from 'react'
import UnderlineLink from './UnderlineLink'

export interface CardItem {
  /** An image URL renders as a 32px mark; a node (SVG, emoji) renders as-is. */
  icon?: ReactNode | string
  iconAlt?: string
  title: string
  body: string
  link?: { label: string; href: string; external?: boolean }
}

interface InfoCardProps {
  card: CardItem
  /** Row height for the grid this card sits in — blocks run at different scales. */
  heightClassName?: string
}

export default function InfoCard({ card, heightClassName = 'min-h-50 lg:min-h-85' }: InfoCardProps) {
  return (
    <div
      className={`border border-gray-a8 rounded-xl lg:rounded-2xl flex flex-col justify-between gap-y-8 lg:gap-y-16 p-6 pe-8 lg:p-8 bg-card h-full w-full ${heightClassName}`}
    >
      {typeof card.icon === 'string' ? (
        <img
          alt={card.iconAlt ?? ''}
          loading="lazy"
          width={32}
          height={32}
          decoding="async"
          className="size-6 sm:size-7 md:size-8"
          src={card.icon}
        />
      ) : (
        card.icon && <div className="text-gray-a1">{card.icon}</div>
      )}
      <div className="text-gray-a1">
        <h3 className="text-h6">{card.title}</h3>
        <p className="text-b1 mt-3 max-w-121">{card.body}</p>
        {card.link && (
          <div className="mt-6">
            <UnderlineLink href={card.link.href} external={card.link.external} className="text-b1 w-fit block">
              {card.link.label}
            </UnderlineLink>
          </div>
        )}
      </div>
    </div>
  )
}
