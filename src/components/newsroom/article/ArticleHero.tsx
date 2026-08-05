import type { NewsroomPost } from '../../../data/newsroom'
import { readTime } from '../../../lib/userUtils'
import ArticleAuthors from '../../social/ArticleAuthor'
import BackToNewsroomButton from './BackToNewsroomButton'
import ShareLinkButton from './ShareLinkButton'

/**
 * The article's opening screen: category, title, byline, and the two controls
 * that frame the read — back to the index, and the link to share.
 *
 * With a cover image the whole band goes dark and the image sits behind it
 * (`force-dark` pins the palette, so the white type holds whatever mode the
 * visitor is in). Without one it stays on the page's own surface rather than
 * faking a dark hero over nothing.
 *
 * The reference layout this follows shows the cover behind the title only from
 * `lg` up and repeats it above the body on small screens. One image at every
 * width is the same picture in one place: less markup, one code path, and no
 * second network fetch of the same file on a phone.
 */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ArticleHero({ post, url }: { post: NewsroomPost; url: string }) {
  const hasCover = Boolean(post.coverImage)

  return (
    <section
      className={`relative flex overflow-hidden border-b border-border p-6 pt-24 md:min-h-[26rem] lg:min-h-[38rem] ${
        hasCover ? 'force-dark bg-black text-text' : 'bg-fill-secondary text-text'
      }`}
    >
      {/* One dimming pass, not two: the black underneath plus this opacity is
        * what keeps the title readable. A scrim on top of it as well left the
        * photograph barely visible. */}
      {hasCover && (
        <div aria-hidden className="absolute inset-0 z-0 size-full opacity-70">
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

      <div className="relative z-10 mx-auto flex h-auto w-full max-w-[77.5rem] flex-col items-center justify-between">
        <div className="flex size-full flex-col items-center justify-center gap-4 py-10 text-center md:py-20">
          {post.categories[0] && (
            <p className="inline-block rounded-radius-8 bg-fill-secondary px-2 py-1 font-mono text-xs uppercase tracking-wider text-text">
              {post.categories[0]}
            </p>
          )}
          <h1 className="text-heading-responsive-lg">{post.title}</h1>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <time className="text-sm" dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            {post.oxyUserId && <ArticleAuthors userIds={[post.oxyUserId]} />}
          </div>
        </div>

        {/* Shown at every width, unlike the layout this follows: a phone reader
          * is the one with no other way back to the index, and no address bar
          * to copy from. */}
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <BackToNewsroomButton />
            {/* Over a bright cover the muted role is unreadable, so this steps
              * back from the title with opacity instead of a dimmer colour. */}
            <p className="font-mono text-xs uppercase tracking-wider text-text/70">{readTime(post.content)}</p>
          </div>
          <ShareLinkButton url={url} />
        </div>
      </div>
    </section>
  )
}
