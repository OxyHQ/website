import type { NewsroomPost } from '../../../data/newsroom'
import { useCurrentLocale } from '../../../lib/i18n'
import { Link } from 'react-router-dom'
import ArticleListenControl from './ArticleListenControl'
import ShareLinkButton from './ShareLinkButton'

/**
 * An editorial opening with the title, standfirst and cover in one 12-column
 * composition. The compact hairline row keeps navigation and article metadata
 * together without turning the hero into application chrome.
 */

export default function ArticleHero({ post, url }: { post: NewsroomPost; url: string }) {
  const locale = useCurrentLocale()
  const date = new Date(post.publishedAt).toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header className="w-full text-foreground">
      <div className="container grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6">
          <div className="col-span-full mb-8 flex flex-wrap items-center justify-center gap-4 text-center text-body-sm text-muted-foreground">
            <time dateTime={post.publishedAt}>{date}</time>
            {post.categories.map((category) => (
              <Link
                key={category}
                to={`/newsroom?category=${encodeURIComponent(category)}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {category}
              </Link>
            ))}
          </div>

          <h1 className="col-span-full text-balance text-center text-primary text-heading-3 md:col-start-2 md:col-span-10 lg:col-start-3 lg:col-span-8">
            {post.title}
          </h1>

          {post.resume && (
            <p className="col-span-full mt-6 text-balance text-center text-foreground text-body-1 md:col-start-2 md:col-span-10 lg:col-start-3 lg:col-span-8">
              {post.resume}
            </p>
          )}
      </div>

      <div className="container grid grid-cols-8 gap-x-2.5 pt-20 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6">
          <div className="col-span-full flex items-center justify-between gap-3 border-t border-border pt-3 lg:col-start-4 lg:col-span-6">
            <ArticleListenControl
              title={post.title}
              resume={post.resume}
              content={post.content}
              locale={locale}
            />
            <ShareLinkButton url={url} />
          </div>
      </div>

      {post.coverImage && (
        <div className="container mt-12 grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6 md:mt-16">
          <figure className="col-span-full md:col-start-2 md:col-span-10">
            <img
              src={post.coverImage}
              alt={post.imageAlt ?? ''}
              width={1440}
              height={810}
              loading="eager"
              decoding="async"
              className="aspect-video w-full rounded-radius-12 object-cover object-center"
            />
          </figure>
        </div>
      )}
    </header>
  )
}
