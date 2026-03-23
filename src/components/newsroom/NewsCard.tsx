import type { NewsArticle } from '../../data/newsroom'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={`/newsroom/${article.slug}`}
      className="group flex flex-col"
    >
      {/* Image — square aspect ratio, subtle zoom on hover */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-subtle">
        <img
          src={article.imageUrl}
          alt={article.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.025]"
        />
      </div>

      {/* Text content */}
      <div className="mt-4 flex flex-col gap-2 md:mt-5">
        {/* Category */}
        <span className="text-xs font-medium uppercase tracking-wide text-caption-foreground">
          {article.category}
        </span>

        {/* Title */}
        <h3 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-primary-foreground md:text-xl">
          {article.title}
        </h3>

        {/* Date + description */}
        <div className="flex flex-col gap-1.5">
          <time
            className="text-sm text-caption-foreground"
            dateTime={article.date}
          >
            {formatDate(article.date)}
          </time>
          <p className="line-clamp-3 text-sm leading-relaxed text-tertiary-foreground">
            {article.description}
          </p>
        </div>
      </div>
    </a>
  )
}
