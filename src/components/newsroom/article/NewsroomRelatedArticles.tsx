import { useNewsroomPosts } from '../../../api/hooks'
import type { NewsroomPost } from '../../../data/newsroom'
import { NewsCardGrid } from '../NewsCard'

export default function NewsroomRelatedArticles({ post }: { post: NewsroomPost }) {
  const { data } = useNewsroomPosts({ category: post.categories[0], limit: 4 })
  const relatedPosts = (data?.posts ?? [])
    .filter((candidate) => candidate.slug !== post.slug)
    .slice(0, 3)

  if (relatedPosts.length === 0) return null

  return (
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
  )
}
