import { NewsCardRow } from './NewsCard'
import SectionHeader from './SectionHeader'
import { useNewsroomPosts } from '../../api/hooks'

/* ──────────────────────────────────────────────────
 * "Recent news" section — 2-col grid with row cards
 * Original: max-w-container grid w-full grid-cols-1 gap-sm @lg:grid-cols-2
 * ────────────────────────────────────────────── */
export default function RecentNewsSection() {
  const { data } = useNewsroomPosts({ limit: 5 })
  const recentNewsArticles = data?.posts ?? []
  return (
    <section className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
      <SectionHeader
        title="Recent news"
        href="/newsroom"
        linkText="View more"
      />

      {/* Original: max-w-container grid w-full grid-cols-1 gap-sm @lg:grid-cols-2 */}
      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
        {recentNewsArticles.map((article) => (
          <NewsCardRow key={article._id} article={article} />
        ))}
      </div>
    </section>
  )
}
