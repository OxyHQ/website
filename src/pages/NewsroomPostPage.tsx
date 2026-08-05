import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import { useNewsroomPost, useNewsroomPosts } from '../api/hooks'
import { type NewsroomPost } from '../data/newsroom'
import { brandConfig } from '../lib/seo'
import { NewsCardGrid } from '../components/newsroom/NewsCard'
import LikeButton from '../components/social/LikeButton'
import DiscussOnMention from '../components/social/DiscussOnMention'
import CommentSection from '../components/social/CommentSection'
import ArticleHero from '../components/newsroom/article/ArticleHero'
import ArticleSummary from '../components/newsroom/article/ArticleSummary'
import ArticleMarkdown from '../components/newsroom/article/ArticleMarkdown'
import ArticleSidebar from '../components/newsroom/article/ArticleSidebar'
import ArticleScrollProgress from '../components/newsroom/article/ArticleScrollProgress'
import { extractHeadings } from '../components/newsroom/article/headings'

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

  const relatedPosts = (relatedData?.posts ?? []).filter(
    (p: NewsroomPost) => p.slug !== slug,
  ).slice(0, 3)

  const headings = useMemo(() => extractHeadings(post?.content ?? ''), [post?.content])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-text-secondary">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-semibold text-text">Post not found</h1>
          <Link to="/newsroom" className="text-sm text-primary hover:underline">
            Back to Newsroom
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const url = `${origin}/newsroom/${post.slug}`

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={post.metaTitle || post.title}
        description={post.description || post.resume}
        canonicalPath={`/newsroom/${post.slug}`}
        ogImage={post.ogImage || post.coverImage}
        ogType="article"
        publishedTime={post.publishedAt}
        modifiedTime={post.updatedAt}
      />
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
      <Navbar />

      <main>
        <ArticleHero post={post} url={url} />

        {/* Body and sidebar share one measure; the body keeps `min-w-0` so a
          * wide code block or table scrolls inside itself instead of pushing
          * the sidebar off the page. */}
        <div className="border-border lg:border-b">
          <div className="relative mx-auto w-full max-w-[80.5rem] lg:flex lg:gap-10 lg:px-6">
            <div className="flex w-full min-w-0 flex-col gap-4 px-4 py-4 pt-6 lg:gap-10 lg:px-0 lg:py-10">
              {post.resume && <ArticleSummary resume={post.resume} />}

              <article>
                <ArticleMarkdown content={post.content} />
              </article>

              <div className="flex items-center gap-3">
                <LikeButton targetType="newsroom" targetId={post.slug} />
                <DiscussOnMention title={post.title} url={url} hashtags={post.tags} via="oxy" />
              </div>

              <CommentSection targetType="newsroom" targetId={post.slug} />
            </div>

            <ArticleSidebar post={post} headings={headings} />
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <section className="container mt-16 md:mt-20">
            <h2 className="mb-8 text-xl font-semibold text-text">
              Related articles
            </h2>
            <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
              {relatedPosts.map((p) => (
                <NewsCardGrid key={p._id || p.slug} article={p} />
              ))}
            </div>
          </section>
        )}

        <ArticleScrollProgress />
      </main>

      <Footer />
    </div>
  )
}
