import { Link } from 'react-router-dom'
import type { NewsArticle } from '../../data/newsroom'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/* ─────────────────────────────────────────────────
 * Featured card — left sticky column, 4:5 image
 * Original: text-h2 title, text-meta category/date
 * ─────────────────────────────────────────────── */
export function NewsCardFeatured({ article }: { article: NewsArticle }) {
  return (
    <Link to={`/newsroom/${article.slug}`} className="group relative block">
      {/* Image — 4:5 like original */}
      <div className="relative w-full overflow-hidden rounded-md bg-surface-subtle">
        <div className="relative w-full" style={{ aspectRatio: '4 / 5' }}>
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.0125]"
          />
        </div>
      </div>
      {/* Text */}
      <div className="mt-5 flex flex-col gap-1">
        <div className="text-heading-responsive-md text-primary-foreground">
          {article.title}
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-caption-foreground">
          <span>{article.category}</span>
          <span className="flex flex-wrap items-center gap-x-2">
            <time className="whitespace-nowrap text-caption-foreground" dateTime={article.date}>
              {formatDate(article.date)}
            </time>
          </span>
        </p>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────
 * Grid / sidebar card — 1:1 image
 * Original: aspect-ratio 1/1, text-h5 title, text-meta
 * hover scale-[1.025]
 * ─────────────────────────────────────────────── */
export function NewsCardGrid({ article }: { article: NewsArticle }) {
  return (
    <Link to={`/newsroom/${article.slug}`} className="group relative">
      {/* Image — 1:1 */}
      <div className="relative w-full overflow-hidden rounded-md bg-surface-subtle">
        <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.025]"
          />
        </div>
      </div>
      {/* Text */}
      <div className="mt-3 flex flex-col gap-0.5">
        <h3 className="text-base font-semibold leading-snug tracking-[-0.01em] text-primary-foreground">
          {article.title}
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-caption-foreground">
          <span>{article.category}</span>
          <span className="flex flex-wrap items-center gap-x-2">
            <time className="whitespace-nowrap" dateTime={article.date}>
              {formatDate(article.date)}
            </time>
          </span>
        </p>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────
 * Carousel card — same as grid card, used in
 * horizontal scrolling sections
 * ─────────────────────────────────────────────── */
export function NewsCardCarousel({ article }: { article: NewsArticle }) {
  return (
    <Link to={`/newsroom/${article.slug}`} className="group relative block">
      {/* Image — 1:1 */}
      <div className="relative w-full overflow-hidden rounded-md bg-surface-subtle">
        <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.025]"
          />
        </div>
      </div>
      {/* Text */}
      <div className="mt-3 flex flex-col gap-0.5">
        <h3 className="text-base font-semibold leading-snug tracking-[-0.01em] text-primary-foreground">
          {article.title}
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-caption-foreground">
          <span>{article.category}</span>
          <span className="flex flex-wrap items-center gap-x-2">
            <time className="whitespace-nowrap" dateTime={article.date}>
              {formatDate(article.date)}
            </time>
          </span>
        </p>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────
 * Recent-news row card — 2-col grid, image+text side by side
 * Original: max-w-container grid grid-cols-1 gap-sm @lg:grid-cols-2
 * ─────────────────────────────────────────────── */
export function NewsCardRow({ article }: { article: NewsArticle }) {
  return (
    <Link
      to={`/newsroom/${article.slug}`}
      className="group flex w-full items-start gap-5"
    >
      {/* Image — 1:1 thumbnail */}
      <div className="w-36 shrink-0 overflow-hidden rounded-md bg-surface-subtle md:w-44">
        <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.025]"
          />
        </div>
      </div>
      {/* Text */}
      <div className="flex flex-col gap-0.5 pt-0.5">
        <h3 className="text-base font-semibold leading-snug tracking-[-0.01em] text-primary-foreground md:text-lg">
          {article.title}
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-caption-foreground">
          <span>{article.category}</span>
          <span className="flex flex-wrap items-center gap-x-2">
            <time className="whitespace-nowrap" dateTime={article.date}>
              {formatDate(article.date)}
            </time>
          </span>
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-tertiary-foreground">
          {article.description}
        </p>
      </div>
    </Link>
  )
}
