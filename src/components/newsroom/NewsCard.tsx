import { Link } from 'react-router-dom'
import type { NewsroomPost } from '../../data/newsroom'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/* ─────────────────────────────────────────────────
 * Featured card — left sticky column
 * Original: 4:5 aspect, rounded-md, hover scale-[1.0125]
 * Title: text-h2, Meta: text-meta
 * ─────────────────────────────────────────────── */
export function NewsCardFeatured({ article }: { article: NewsroomPost }) {
  return (
    <Link to={`/newsroom/${article.slug}`} className="group relative block">
      <div className="group relative">
        {/* Placeholder bg behind image */}
        <div
          className="absolute top-0 w-full rounded-md bg-surface"
          style={{ aspectRatio: '4 / 5' }}
        />
        {/* Image wrapper */}
        <div className="relative mx-auto w-full overflow-hidden rounded-md transition-opacity duration-300 [&_img]:translate-y-0 [&_img]:scale-100 [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.0125]">
          <div className="relative w-full" style={{ aspectRatio: '4 / 5' }}>
            <div className="h-full w-full">
              <img
                src={article.coverImage}
                alt={article.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Text — text-h2 title + text-meta category/date */}
      <div className="mt-4 flex flex-col gap-1 md:mt-5">
        <div className="text-heading-responsive-md text-foreground md:pe-10">
          {article.title}
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground md:pe-6">
          <span>{article.category}</span>
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <time className="whitespace-nowrap text-muted-foreground" dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          </span>
        </p>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────
 * Grid / sidebar card — 1:1 image
 * Original: aspect 1/1, rounded-md, hover scale-[1.025]
 * Title: text-h5, Meta: text-meta
 * ─────────────────────────────────────────────── */
export function NewsCardGrid({ article }: { article: NewsroomPost }) {
  return (
    <Link to={`/newsroom/${article.slug}`} className="group relative">
      <div className="group relative">
        <div
          className="absolute top-0 w-full rounded-md bg-surface"
          style={{ aspectRatio: '1 / 1' }}
        />
        <div className="relative mx-auto w-full overflow-hidden rounded-md transition-opacity duration-300 [&_img]:translate-y-0 [&_img]:scale-100 [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.025]">
          <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
            <div className="h-full w-full">
              <img
                src={article.coverImage}
                alt={article.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Text */}
      <div className="mt-2 flex flex-col gap-0.5 md:mt-3">
        <h3 className="text-base font-semibold leading-snug tracking-[-0.01em] text-foreground">
          {article.title}
        </h3>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          <span>{article.category}</span>
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <time className="whitespace-nowrap" dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          </span>
        </p>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────
 * Carousel card — 1:1 image, same structure as grid card
 * Used in horizontal scrolling sections
 * ─────────────────────────────────────────────── */
export function NewsCardCarousel({ article }: { article: NewsroomPost }) {
  return (
    <Link to={`/newsroom/${article.slug}`} className="group relative block">
      <div className="group relative">
        <div
          className="absolute top-0 w-full rounded-md bg-surface"
          style={{ aspectRatio: '1 / 1' }}
        />
        <div className="relative mx-auto w-full overflow-hidden rounded-md transition-opacity duration-300 [&_img]:translate-y-0 [&_img]:scale-100 [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.025]">
          <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
            <div className="h-full w-full">
              <img
                src={article.coverImage}
                alt={article.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-0.5 md:mt-3">
        <h3 className="text-base font-semibold leading-snug tracking-[-0.01em] text-foreground md:pe-6">
          {article.title}
        </h3>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          <span>{article.category}</span>
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <time className="whitespace-nowrap" dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          </span>
        </p>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────
 * Row card — "Recent news" 2-col grid
 * Original: group flex w-full items-center overflow-hidden
 * Image: relative aspect-square flex-[0_0_7.5rem] md:flex-[0_0_11.563rem]
 * Text: ps-xs @lg:ps-md, title mb-2xs text-h5
 * Hover: scale-[1.04]
 * ─────────────────────────────────────────────── */
export function NewsCardRow({ article }: { article: NewsroomPost }) {
  return (
    <Link
      to={`/newsroom/${article.slug}`}
      className="group flex w-full items-center overflow-hidden"
    >
      {/* Image — fixed width square thumbnail */}
      <div className="relative flex-[0_0_7.5rem] overflow-hidden md:flex-[0_0_11.563rem]">
        <div className="group relative">
          <div
            className="absolute top-0 w-full rounded-md bg-surface"
            style={{ aspectRatio: '1 / 1' }}
          />
          <div className="relative w-full overflow-hidden rounded-md [&_img]:translate-y-0 [&_img]:scale-100 [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.04]">
            <div className="relative aspect-square w-full">
              <img
                src={article.coverImage}
                alt={article.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Text — ps-xs on mobile, ps-md on lg */}
      <div className="flex flex-auto flex-col ps-3 lg:ps-5">
        <div className="mb-1 text-base font-semibold leading-snug tracking-[-0.01em] text-foreground">
          {article.title}
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          <span>{article.category}</span>
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <time className="whitespace-nowrap" dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          </span>
        </p>
      </div>
    </Link>
  )
}
