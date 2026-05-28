import { NewsCardRow } from './NewsCard'
import SectionHeader from './SectionHeader'
import { useNewsroomPosts } from '../../api/hooks'

/* ──────────────────────────────────────────────────
 * "Recent news" section — 2-col grid with row cards
 * Original: max-w-container grid w-full grid-cols-1 gap-sm @lg:grid-cols-2
 * ────────────────────────────────────────────── */
interface RecentNewsSectionProps {
  title?: string
  linkText?: string
  viewAllText?: string
  /**
   * When set, scopes the recent-news rail to a single category. Also flips the
   * "View more" link target to /company/news for the scoped variant.
   */
  category?: string
  /** Override target for the section header link (defaults to /newsroom). */
  href?: string
}

export default function RecentNewsSection({
  title = 'Recent news',
  linkText = 'View more',
  category,
  href = '/newsroom',
}: RecentNewsSectionProps) {
  const { data, isPending } = useNewsroomPosts({ category, limit: 5 })
  const recentNewsArticles = data?.posts ?? []

  if (!isPending && recentNewsArticles.length === 0) return null

  return (
    <section className="container">
      <SectionHeader
        title={title}
        href={href}
        linkText={linkText}
      />

      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
        {isPending && [1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface" />
        ))}
        {recentNewsArticles.map((article) => (
          <NewsCardRow key={article._id} article={article} />
        ))}
      </div>
    </section>
  )
}
