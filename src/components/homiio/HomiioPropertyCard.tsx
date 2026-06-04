import { CoinGlyph } from './icons'
import type { HomiioListing } from './data'

interface HomiioPropertyCardProps {
  listing: HomiioListing
  className?: string
}

/**
 * A single rental listing tile. Used both as the centre-stage example card and,
 * cloned many times, as the spokes of the rotating hero wheel.
 */
export default function HomiioPropertyCard({ listing, className = '' }: HomiioPropertyCardProps) {
  return (
    <article
      className={`flex w-[160px] flex-col rounded-2xl bg-white p-2 text-left shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5 ${className}`}
    >
      <img
        src={listing.image}
        alt={listing.title}
        loading="lazy"
        draggable={false}
        className="h-[112px] w-full rounded-xl object-cover"
      />
      <h4 className="mt-2 line-clamp-2 px-1 text-[11px] font-semibold leading-tight text-neutral-900">
        {listing.title}
      </h4>
      <div className="mt-1 flex items-center gap-1 px-1 pb-1">
        <CoinGlyph className="h-4 w-4 text-neutral-900" />
        <span className="text-base font-extrabold tracking-tight text-neutral-900">{listing.price}</span>
      </div>
    </article>
  )
}
