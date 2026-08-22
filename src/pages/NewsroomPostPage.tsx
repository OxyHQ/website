import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BloomColorScope } from '@oxyhq/bloom/theme'
import { useNewsroomPost, useNewsroomPosts } from '../api/hooks'
import PageShell from '../components/layout/PageShell'
import { NewsCardGrid } from '../components/newsroom/NewsCard'
import ArticleHero from '../components/newsroom/article/ArticleHero'
import ArticleMarkdown from '../components/newsroom/article/ArticleMarkdown'
import ArticleProducts from '../components/newsroom/article/ArticleProducts'
import ArticleScrollProgress from '../components/newsroom/article/ArticleScrollProgress'
import { extractHeadings } from '../components/newsroom/article/headings'
import ArticleToc from '../components/slices/ArticleToc'
import { WIDE_ARTICLE_BLOCK } from '../components/slices/articleBlock'
import CommentSection from '../components/social/CommentSection'
import DiscussOnMention from '../components/social/DiscussOnMention'
import LikeButton from '../components/social/LikeButton'
import ArticleAuthors from '../components/social/ArticleAuthor'
import StructuredData from '../components/StructuredData'
import { type NewsroomPost } from '../data/newsroom'
import { newsroomThemeFor } from '../lib/newsroom-theme'
import { brandConfig } from '../lib/seo'
import BackToNewsroomButton from '../components/newsroom/article/BackToNewsroomButton'

function newsroomSeoTitle(title: string, siteName: string): string {
  const suffix = ` | ${siteName}`
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title
}

export default function NewsroomPostPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  // Host-aware so an article read on fairco.in never emits oxy.so JSON-LD.
  const { origin, siteName, ogImage } = brandConfig(
    typeof window === 'undefined' ? undefined : window.location.hostname,
  )
  const { data: post, isLoading } = useNewsroomPost(slug)
  // Gated on `post`: without `enabled` this fired an unfiltered, unlimited
  // `/newsroom` request on every article load, only to discard it once the post
  // arrived and the category-filtered query replaced it.
  const { data: relatedData } = useNewsroomPosts(
    { category: post?.categories[0], limit: 4 },
    { enabled: !!post },
  )

  const relatedPosts = (relatedData?.posts ?? [])
    .filter((candidate: NewsroomPost) => candidate.slug !== slug)
    .slice(0, 3)
  const headings = useMemo(() => extractHeadings(post?.content ?? ''), [post?.content])

  if (isLoading) {
    return (
      <PageShell
        seo={{ title: 'Newsroom', description: 'Loading an Oxy Newsroom article.', canonicalPath: `/newsroom/${slug}` }}
        className="slice-theme bg-background text-foreground"
        mainClassName="flex flex-1 items-center justify-center"
      >
        <p className="text-body-3 text-muted-foreground">Loading…</p>
      </PageShell>
    )
  }

  if (!post) {
    return (
      <PageShell
        seo={{ title: 'Post not found', description: 'This Newsroom article could not be found.', canonicalPath: `/newsroom/${slug}` }}
        className="slice-theme bg-background text-foreground"
        mainClassName="flex flex-1 flex-col items-center justify-center gap-4"
      >
        <h1 className="text-subheading-2 text-foreground">Post not found</h1>
        <Link to="/newsroom" className="text-body-3 text-primary hover:underline">
          Back to Newsroom
        </Link>
      </PageShell>
    )
  }

  const url = `${origin}/newsroom/${post.slug}`

  return (
    <BloomColorScope colorPreset={newsroomThemeFor(post)}>
      <PageShell
        seo={{
          title: newsroomSeoTitle(post.metaTitle || post.title, siteName),
          description: post.description || post.resume,
          canonicalPath: `/newsroom/${post.slug}`,
          ogImage: post.ogImage || post.coverImage,
          ogType: 'article',
          publishedTime: post.publishedAt,
          modifiedTime: post.updatedAt,
        }}
        className="slice-theme bg-background text-foreground"
        mainClassName="flex-1"
      >
        <StructuredData data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.resume,
          image: post.coverImage || ogImage,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt || post.publishedAt,
          author: { '@type': 'Organization', name: siteName, url: origin },
          publisher: {
            '@type': 'Organization',
            name: siteName,
            logo: { '@type': 'ImageObject', url: `${origin}/favicon.svg` },
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        }} />

        <article className="mt-10 flex flex-col gap-12 bg-background md:gap-16">
          <ArticleHero post={post} url={url} />

          <section data-article-body className="w-full bg-background text-foreground">
          <div className="container grid grid-cols-8 place-items-start gap-x-2.5 pb-24 pt-10 sm:grid-cols-12 sm:gap-x-5 sm:pt-16 md:gap-x-6 md:pb-32 2xl:pb-40">
            {headings.length > 0 && (
              <ArticleToc
                entries={headings.map((heading) => ({
                  id: heading.id,
                  label: heading.text,
                  level: heading.level,
                }))}
              />
            )}

            <div className="contents">
              <ArticleMarkdown content={post.content} />
              <ArticleProducts post={post} />

              <footer data-toc-skip data-toc-collision-target className={`${WIDE_ARTICLE_BLOCK} mt-14 w-full lg:mt-20`}>
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                  <BackToNewsroomButton />
                  <div className="text-body-sm text-muted-foreground">
                    {post.authorUsername ? (
                      <span>By {post.authorUsername}</span>
                    ) : post.oxyUserId ? (
                      <ArticleAuthors userIds={[post.oxyUserId]} />
                    ) : null}
                  </div>
                </div>
                {post.tags.length > 0 && (
                  <div className="mb-8 flex flex-wrap gap-2" aria-label="Article tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-surface px-3 py-1.5 text-body-sm text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <LikeButton targetType="newsroom" targetId={post.slug} />
                  <DiscussOnMention title={post.title} url={url} hashtags={post.tags} via="oxy" />
                </div>

                <CommentSection targetType="newsroom" targetId={post.slug} />
              </footer>
            </div>
          </div>
          </section>
        </article>

        {relatedPosts.length > 0 && (
          <section className="w-full bg-[color-mix(in_srgb,var(--primary)_14%,var(--background))] py-20 text-foreground md:py-24">
            <div className="container">
              <h2 className="mb-10 text-primary text-subheading-2">Related articles</h2>
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <NewsCardGrid key={relatedPost._id || relatedPost.slug} article={relatedPost} />
                ))}
              </div>
            </div>
          </section>
        )}

        <ArticleScrollProgress />
      </PageShell>
    </BloomColorScope>
  )
}
