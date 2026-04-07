import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import StructuredData from '../components/StructuredData'
import { useNewsroomPost, useNewsroomPosts } from '../api/hooks'
import { type NewsroomPost } from '../data/newsroom'
import { NewsCardGrid } from '../components/newsroom/NewsCard'
import LikeButton from '../components/social/LikeButton'
import DiscussOnMention from '../components/social/DiscussOnMention'
import CommentSection from '../components/social/CommentSection'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function readTime(content?: string): string {
  if (!content) return '1 min read'
  const words = content.trim().split(/\s+/).length
  return `${Math.max(1, Math.round(words / 200))} min read`
}

export default function NewsroomPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: post, isLoading } = useNewsroomPost(slug!)
  const { data: relatedData } = useNewsroomPosts(
    post ? { category: post.category, limit: 4 } : undefined,
  )

  const relatedPosts = (relatedData?.posts ?? []).filter(
    (p: NewsroomPost) => p.slug !== slug,
  ).slice(0, 3)

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
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
          <h1 className="text-2xl font-semibold text-foreground">Post not found</h1>
          <Link to="/newsroom" className="text-sm text-primary hover:underline">
            Back to Newsroom
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
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
        description: post.excerpt,
        image: post.coverImage || 'https://oxy.so/og-default.png',
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author: { '@type': 'Organization', name: 'Oxy', url: 'https://oxy.so' },
        publisher: {
          '@type': 'Organization',
          name: 'Oxy',
          logo: { '@type': 'ImageObject', url: 'https://oxy.so/favicon.svg' },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `https://oxy.so/newsroom/${post.slug}` },
      }} />
      <Navbar />

      <main className="pb-20 md:pb-28">
        {/* Back link */}
        <div className="mx-auto max-w-[720px] px-5 pt-8 md:px-8">
          <Link
            to="/newsroom"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Newsroom
          </Link>
        </div>

        {/* Article header */}
        <header className="mx-auto max-w-[720px] px-5 pt-8 md:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{post.category}</span>
            <span>&middot;</span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span>&middot;</span>
            <span>{readTime(post.content)}</span>
          </div>
          <h1 className="mt-4 text-heading-responsive-lg text-foreground">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground">
              {post.excerpt}
            </p>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mx-auto mt-8 max-w-[900px] px-5 md:px-8">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full rounded-lg object-cover"
              style={{ aspectRatio: '16 / 9' }}
              width={1600}
              height={900}
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        {/* Markdown content */}
        <article className="prose prose-neutral dark:prose-invert mx-auto mt-10 max-w-[720px] px-5 md:px-8 prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl prose-h4:mt-6 prose-h4:mb-2 prose-h5:mt-4 prose-p:leading-[1.8] prose-p:text-secondary-foreground prose-li:text-secondary-foreground prose-li:leading-[1.8] prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-img:rounded-lg prose-hr:border-border prose-code:rounded prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface prose-pre:border prose-pre:border-border">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </article>

        {/* Like + social actions */}
        <div className="mx-auto mt-10 max-w-[720px] px-5 md:px-8 flex items-center gap-3">
          <LikeButton targetType="newsroom" targetId={post.slug} />
          <DiscussOnMention title={post.title} url={`https://oxy.so/newsroom/${post.slug}`} />
        </div>

        {/* Comments */}
        <div className="mx-auto max-w-[720px] px-5 md:px-8">
          <CommentSection targetType="newsroom" targetId={post.slug} />
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="mx-auto mt-16 max-w-[1200px] px-5 md:mt-20 md:px-8">
            <h2 className="mb-8 text-xl font-semibold text-foreground">
              Related articles
            </h2>
            <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
              {relatedPosts.map((p) => (
                <NewsCardGrid key={p._id || p.slug} article={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
