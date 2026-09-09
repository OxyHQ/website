import * as Skeleton from '@oxyhq/bloom/skeleton'
import { NewsCardRow } from './NewsCard'
import SectionHeaderWithLink from './SectionHeaderWithLink'
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
  /** Search title and summary before selecting the recent-news rail. */
  search?: string
  /** Override target for the section header link (defaults to /newsroom). */
  href?: string
  /**
   * Off when the caller already provides the page frame. A `container` inside
   * a `container` applies the gutter twice, which leaves the rail sitting a
   * full gutter inside the sections around it.
   */
  framed?: boolean
}

export default function RecentNewsSection({
  title = 'Recent news',
  linkText = 'View more',
  category,
  search,
  href = '/newsroom',
  framed = true,
}: RecentNewsSectionProps) {
  const { data, isPending } = useNewsroomPosts({ category, search, limit: 5 })
  const recentNewsArticles = data?.posts ?? []

  if (!isPending && recentNewsArticles.length === 0) return null

  return (
    <section className={framed ? 'container' : undefined}>
      <SectionHeaderWithLink
        title={title}
        href={href}
        linkText={linkText}
      />

      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
        {isPending && [1, 2].map((i) => (
          <Skeleton.Box key={i} width="100%" height={128} borderRadius={16} />
        ))}
        {recentNewsArticles.map((article) => (
          <NewsCardRow key={article._id} article={article} />
        ))}
      </div>
    </section>
  )
}
