import type { NewsArticle } from '../../data/newsroom'
import { NewsCardCarousel } from './NewsCard'
import SectionHeader from './SectionHeader'

interface CarouselSectionProps {
  title: string
  href: string
  articles: NewsArticle[]
  linkText?: string
}

/* ──────────────────────────────────────────────────
 * Horizontal scroll carousel section
 * Original outer: @lg:max-w-container flex w-auto
 * Original scroll: w-full no-scrollbar snap-x snap-mandatory overflow-x-auto overflow-y-hidden
 * Original inner: @md:gap-sm px-sm @md:px-md pe-sm flex min-w-[56rem]
 *   @md:min-w-[unset] @lg:px-0 grid flex-none grid-cols-3
 * Item: mb-md relative @md:mb-0 ps-sm snap-start @md:ps-0
 *   min-w-[calc(100%_/_3)] ps-0 last:me-0
 * ────────────────────────────────────────────── */
export default function CarouselSection({
  title,
  href,
  articles,
  linkText,
}: CarouselSectionProps) {
  return (
    <section className="w-full">
      {/* Header inside container */}
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <SectionHeader title={title} href={href} linkText={linkText} />
      </div>

      {/* Outer: flex w-auto, matching @lg:max-w-container */}
      <div className="mx-auto flex w-auto max-w-[1200px]">
        {/* Scroll container: no-scrollbar snap-x snap-mandatory */}
        <div className="w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Inner grid: min-w-[56rem] on mobile, unset on md+, grid-cols-3 */}
          <div className="grid min-w-[56rem] flex-none grid-cols-3 gap-4 px-5 pe-5 md:min-w-[unset] md:gap-5 md:px-8 lg:px-0">
            {articles.map((article) => (
              <div
                key={article.id}
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
