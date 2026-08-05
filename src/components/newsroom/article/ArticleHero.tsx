import type { NewsroomPost } from '../../../data/newsroom'
import { readTime } from '../../../lib/userUtils'
import ArticleAuthors from '../../social/ArticleAuthor'
import BackToNewsroomButton from './BackToNewsroomButton'
import ShareLinkButton from './ShareLinkButton'

/**
 * The article's opening screen: category, title, byline, and the two controls
 * that frame the read — back to the index, and the link to share.
 *
 * The cover behaves differently by width on purpose. From `lg` the band turns
 * black and the picture sits behind the title, so `force-dark` pins the palette
 * and the type stays light whatever mode the visitor is in. Below `lg` there is
 * not enough height for type over a photograph, so the band keeps the page's own
 * surface and the cover is shown whole, above the body.
 */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ArticleHero({ post, url }: { post: NewsroomPost; url: string }) {
  return (
    <>
      <section
        className={`relative flex overflow-hidden border-b border-border bg-fill-secondary p-6 pt-24 text-text md:min-h-[25rem] lg:min-h-[47.5rem] ${
          post.coverImage ? 'force-dark-lg lg:bg-black' : ''
        }`}
      >
        <div className="relative z-10 mx-auto flex h-auto w-full max-w-[77.5rem] flex-col items-center justify-between">
          <div className="flex size-full flex-col items-center justify-center gap-4 py-10 text-center md:py-20">
            {post.categories[0] && (
              <p className="inline-block rounded-sm bg-fill-hover px-2 py-1 font-mono text-xs uppercase tracking-wider text-text">
                {post.categories[0]}
              </p>
            )}
            <h1 className="text-heading-responsive-lg">{post.title}</h1>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <time className="text-sm" dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
              {post.oxyUserId && <ArticleAuthors userIds={[post.oxyUserId]} />}
            </div>
          </div>

          <div className="hidden w-full items-center justify-between md:flex">
            <div className="flex items-center gap-4">
              <BackToNewsroomButton />
              <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">{readTime(post.content)}</p>
            </div>
            <ShareLinkButton url={url} />
          </div>
        </div>

        {post.coverImage && (
          <div aria-hidden className="absolute top-0 left-0 z-0 hidden size-full opacity-70 lg:block">
            <img
              src={post.coverImage}
              alt=""
              width={1440}
              height={800}
              loading="eager"
              decoding="async"
              className="size-full object-cover object-center"
            />
          </div>
        )}
      </section>

      {post.coverImage && (
        <div className="p-4 pb-0 lg:hidden">
          <img
            src={post.coverImage}
            alt={post.imageAlt ?? ''}
            width={1440}
            height={800}
            loading="eager"
            decoding="async"
            className="aspect-video w-full object-cover object-center"
          />
        </div>
      )}
    </>
  )
}
