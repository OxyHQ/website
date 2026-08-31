import { lazy, Suspense, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BloomColorScope } from '@oxyhq/bloom/theme'
import { useNewsroomPost } from '../api/hooks'
import { errorStatus } from '../api/client'
import PageShell from '../components/layout/PageShell'
import NewsroomRouteFallback from '../components/newsroom/NewsroomRouteFallback'
import ArticleHero from '../components/newsroom/article/ArticleHero'
import ArticleMarkdown from '../components/newsroom/article/ArticleMarkdown'
import ArticleProducts from '../components/newsroom/article/ArticleProducts'
import ArticleScrollProgress from '../components/newsroom/article/ArticleScrollProgress'
import { extractHeadings } from '../components/newsroom/article/headings'
import ArticleToc from '../components/slices/ArticleToc'
import { WIDE_ARTICLE_BLOCK } from '../components/slices/articleBlock'
import ArticleAuthors from '../components/social/ArticleAuthor'
import StructuredData from '../components/StructuredData'
import { newsroomThemeFor } from '../lib/newsroom-theme'
import { brandConfig } from '../lib/seo'
import { buildNewsroomArticleStructuredData, normalizeNewsroomSeoTitle } from '../lib/newsroomSeo'
import { markNewsroomArticleReady } from '../lib/newsroom-performance'
import BackToNewsroomButton from '../components/newsroom/article/BackToNewsroomButton'
import DeferredMount from '../components/ui/DeferredMount'

const ArticleCommunity = lazy(() => import('../components/newsroom/article/ArticleCommunity'))
const NewsroomRelatedArticles = lazy(() => import('../components/newsroom/article/NewsroomRelatedArticles'))

export default function NewsroomPostPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  // Host-aware so an article read on fairco.in never emits oxy.so JSON-LD.
  const { origin, siteName, ogImage } = brandConfig(
    typeof window === 'undefined' ? undefined : window.location.hostname,
  )
  const { data: post, error, isLoading, isFetching, refetch } = useNewsroomPost(slug)
  const headings = useMemo(() => extractHeadings(post?.content ?? ''), [post?.content])

  useEffect(() => {
    if (post) markNewsroomArticleReady(post.slug)
  }, [post])

  if (isLoading) {
    return <NewsroomRouteFallback />
  }

  if (!post) {
    const missing = errorStatus(error) === 404
    return (
      <PageShell
        seo={{
          title: missing ? 'Post not found' : 'Newsroom temporarily unavailable',
          description: missing
            ? 'This Newsroom article could not be found.'
            : 'This Newsroom article could not be loaded right now.',
          canonicalPath: `/newsroom/${slug}`,
          noIndex: true,
        }}
        className="slice-theme bg-background text-foreground"
        mainClassName="flex flex-1 flex-col items-center justify-center gap-4"
      >
        <h1 className="text-subheading-2 text-foreground">
          {missing ? 'Post not found' : 'The article could not be loaded'}
        </h1>
        {!missing && (
          <button
            type="button"
            disabled={isFetching}
            onClick={() => void refetch()}
            className="rounded-full bg-primary px-5 py-2.5 text-body-3 text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {isFetching ? 'Retrying…' : 'Try again'}
          </button>
        )}
        <Link to="/newsroom" className="text-body-3 text-primary hover:underline">
          Back to Newsroom
        </Link>
      </PageShell>
    )
  }

  const url = `${origin}/newsroom/${post.slug}/`

  return (
    <BloomColorScope colorPreset={newsroomThemeFor(post)}>
      <PageShell
        seo={{
          title: normalizeNewsroomSeoTitle(post.metaTitle || post.title, siteName),
          description: post.metaDescription || post.description || post.resume,
          canonicalPath: `/newsroom/${post.slug}`,
          ogImage: post.ogImage || post.coverImage,
          ogType: 'article',
          publishedTime: post.publishedAt,
          modifiedTime: post.updatedAt,
          author: post.authorUsername,
        }}
        className="slice-theme bg-background text-foreground"
        mainClassName="flex-1"
      >
        <StructuredData data={buildNewsroomArticleStructuredData(post, { origin, siteName, ogImage })} />

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

                <DeferredMount
                  fallback={<div className="mt-6 h-24 animate-pulse rounded-radius-12 bg-surface motion-reduce:animate-none" />}
                >
                  <Suspense fallback={<div className="mt-6 h-24 rounded-radius-12 bg-surface" />}>
                    <ArticleCommunity post={post} url={url} />
                  </Suspense>
                </DeferredMount>
              </footer>
            </div>
          </div>
          </section>
        </article>

        <DeferredMount rootMargin="900px 0px">
          <Suspense fallback={null}>
            <NewsroomRelatedArticles post={post} />
          </Suspense>
        </DeferredMount>

        <ArticleScrollProgress />
      </PageShell>
    </BloomColorScope>
  )
}
