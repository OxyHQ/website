import type { NewsroomPostSummary } from '../../data/newsroom'
import { NewsCardCarousel } from './NewsCard'
import SectionHeaderWithLink from './SectionHeaderWithLink'

interface CarouselSectionProps {
  title: string
  href: string
  articles: NewsroomPostSummary[]
  linkText?: string
}

/* ──────────────────────────────────────────────────
 * Horizontal scroll carousel section
 * ────────────────────────────────────────────── */
export default function CarouselSection({
  title,
  href,
  articles,
  linkText,
}: CarouselSectionProps) {
  if (articles.length === 0) return null

  return (
    <section className="w-full">
      {/* Header inside container */}
      <div className="container">
        <SectionHeaderWithLink title={title} href={href} linkText={linkText} />
      </div>

      {/* Outer: flex w-auto, matching the site-global container */}
      <div className="container flex w-auto">
        {/* Scroll container: no-scrollbar snap-x snap-mandatory */}
        <div className="w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Inner grid: min-w-[56rem] on mobile, unset on md+, grid-cols-3 */}
          <div className="grid min-w-[56rem] flex-none grid-cols-3 gap-4 px-5 pe-5 md:min-w-[unset] md:gap-5 md:px-8 lg:px-0">
            {articles.map((article) => (
              <div
                key={article._id}
                className="relative mb-4 min-w-[calc(100%/3)] snap-start ps-0 last:me-0 md:mb-0"
              >
                <NewsCardCarousel article={article} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
