import { CoinGlyph } from './icons'
import { SANDRA_IMAGE } from './data'

const TAGS = ['Dog', 'Music', 'TV', 'Clean', 'Yoga'] as const

interface HomiioMatchCardProps {
  className?: string
}

/**
 * Roommate-match profile card. A compatibility score sits over the portrait,
 * followed by values-based tags — the heart of Homiio's "roommate harmony".
 */
export default function HomiioMatchCard({ className = '' }: HomiioMatchCardProps) {
  return (
    <article
      className={`w-[210px] rounded-3xl bg-white p-3 text-left shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)] ring-1 ring-black/5 ${className}`}
    >
      <div className="relative">
        <img
          src={SANDRA_IMAGE}
          alt="Sandra, 28"
          draggable={false}
          className="h-[150px] w-full rounded-2xl object-cover"
        />
        <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow">
          87%
        </span>
      </div>
      <h4 className="mt-2.5 text-lg font-bold text-neutral-900">Sandra, 28</h4>
      <div className="mt-1 flex items-center gap-1">
        <CoinGlyph className="h-4 w-4 text-neutral-900" />
        <span className="text-base font-extrabold tracking-tight text-neutral-900">230</span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {TAGS.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-[#BCE9D0] px-2.5 py-1 text-xs font-medium text-emerald-950"
          >
            {tag}
          </li>
        ))}
      </ul>
    </article>
  )
}
