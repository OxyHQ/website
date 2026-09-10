import { CoinGlyph } from './icons'
import { SANDRA_IMAGE } from './data'

const TAGS = ['Dog', 'Music', 'TV', 'Clean', 'Yoga'] as const

/**
 * Roommate-match profile card. A compatibility score sits over the portrait,
 * followed by values-based tags — the heart of Homiio's "roommate harmony".
 */
export default function HomiioMatchCard() {
  return (
    <article className="w-[210px] rounded-3xl bg-card p-3 text-left shadow-xl ring-1 ring-border">
      <div className="relative">
        <img
          src={SANDRA_IMAGE}
          alt="Sandra, 28"
          draggable={false}
          className="h-[150px] w-full rounded-2xl object-cover"
        />
        <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-primary-foreground shadow">
          87%
        </span>
      </div>
      <h4 className="mt-2.5 text-lg font-bold text-foreground">Sandra, 28</h4>
      <div className="mt-1 flex items-center gap-1">
        <CoinGlyph className="h-4 w-4 text-foreground" />
        <span className="text-base font-extrabold tracking-tight text-foreground">230</span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {TAGS.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-success-subtle px-2.5 py-1 text-xs font-medium text-success-text"
          >
            {tag}
          </li>
        ))}
      </ul>
    </article>
  )
}
