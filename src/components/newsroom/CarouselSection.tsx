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
 * Original: no-scrollbar snap-x snap-mandatory overflow-x-auto
 * Inner: @md:gap-sm px-sm @md:px-md pe-sm flex min-w-[56rem]
 *        @md:min-w-[unset] @lg:px-0 grid flex-none grid-cols-3
 * ────────────────────────────────────────────── */
export default function CarouselSection({
  title,
  href,
  articles,
  linkText,
}: CarouselSectionProps) {
  return (
    <section className="w-full">
      {/* Header stays inside container */}
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <SectionHeader title={title} href={href} linkText={linkText} />
      </div>

      {/* Horizontal scroll row — scrollable on mobile, static grid on md+ */}
      <div className="w-full overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto grid min-w-[56rem] max-w-[1200px] flex-none snap-x snap-mandatory grid-cols-3 gap-4 px-5 md:min-w-0 md:gap-6 md:px-8 lg:px-8">
          {articles.map((article) => (
            <div key={article.id} className="snap-start">
              <NewsCardCarousel article={article} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
