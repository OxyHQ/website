import { Link } from 'react-router-dom'
import { BloomColorScope } from '@oxyhq/bloom/theme'
import type { NewsroomPost } from '../../data/newsroom'
import { useCurrentLocale } from '../../lib/i18n'
import { newsroomThemeFor } from '../../lib/newsroom-theme'

function ThemedCard({ article, children }: { article: NewsroomPost; children: React.ReactElement }) {
  return (
    <BloomColorScope colorPreset={newsroomThemeFor(article)}>
      {children}
    </BloomColorScope>
  )
}

function NewsImage({
  article,
  className,
  priority = false,
}: {
  article: NewsroomPost
  className: string
  priority?: boolean
}) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-surface ${className}`}>
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-surface text-heading-responsive-sm text-muted-foreground"
      >
        Oxy
      </div>
      {article.coverImage && (
        <img
          src={article.coverImage}
          alt={article.imageAlt?.trim() ?? ''}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          width={1200}
          height={675}
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none"
        />
      )}
    </div>
  )
}

function NewsMeta({ article }: { article: NewsroomPost }) {
  const locale = useCurrentLocale()
  const date = new Date(article.publishedAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
      {article.categories[0] && <span>{article.categories[0]}</span>}
      {article.categories[0] && <span aria-hidden>·</span>}
      <time className="whitespace-nowrap" dateTime={article.publishedAt}>{date}</time>
    </p>
  )
}

export function NewsCardFeatured({ article }: { article: NewsroomPost }) {
  return (
    <ThemedCard article={article}>
      <Link
        to={`/newsroom/${article.slug}`}
        className="group relative block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <NewsImage article={article} priority className="aspect-[4/5] w-full @lg:aspect-video" />
        <div className="mt-5 flex max-w-4xl flex-col gap-2 @lg:pe-10">
          <h2 className="text-heading-responsive-md text-foreground transition-colors group-hover:text-muted-foreground">
            {article.title}
          </h2>
          <NewsMeta article={article} />
        </div>
      </Link>
    </ThemedCard>
  )
}

export function NewsCardGrid({ article }: { article: NewsroomPost }) {
  return (
    <ThemedCard article={article}>
      <Link
        to={`/newsroom/${article.slug}`}
        className="group relative block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <NewsImage article={article} className="aspect-square w-full" />
        <div className="mt-3 flex flex-col gap-1.5">
          <h3 className="text-base font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
            {article.title}
          </h3>
          <NewsMeta article={article} />
        </div>
      </Link>
    </ThemedCard>
  )
}

export function NewsCardCarousel({ article }: { article: NewsroomPost }) {
  return (
    <ThemedCard article={article}>
      <Link
        to={`/newsroom/${article.slug}`}
        className="group relative block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <NewsImage article={article} className="aspect-square w-full" />
        <div className="mt-3 flex flex-col gap-1.5 md:pe-6">
          <h3 className="text-base font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground">
            {article.title}
          </h3>
          <NewsMeta article={article} />
        </div>
      </Link>
    </ThemedCard>
  )
}

export function NewsCardRow({ article }: { article: NewsroomPost }) {
  return (
    <ThemedCard article={article}>
      <Link
        to={`/newsroom/${article.slug}`}
        className="group grid w-full grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:grid-cols-[11.563rem_minmax(0,1fr)] sm:gap-6"
      >
        <NewsImage article={article} className="aspect-square w-full" />
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-base font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-muted-foreground sm:text-lg">
            {article.title}
          </h3>
          {article.resume && (
            <p className="hidden line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:block">
              {article.resume}
            </p>
          )}
          <NewsMeta article={article} />
        </div>
      </Link>
    </ThemedCard>
  )
}
