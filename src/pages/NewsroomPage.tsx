import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import NewsroomHeroSection from '../components/newsroom/NewsroomHeroSection'
import ArticleGridSection from '../components/newsroom/ArticleGridSection'
import RecentNewsSection from '../components/newsroom/RecentNewsSection'
import CarouselSection from '../components/newsroom/CarouselSection'
import { useNewsroomPosts } from '../api/hooks'

/* ──────────────────────────────────────────────────
 * /newsroom — cloned from OpenAI company-announcements
 *
 * Structure (top → bottom):
 * 1. Hero: "Recent news" title + category nav
 * 2. Featured grid: large sticky card (4:5) + sidebar cards (1:1)
 * 3. Filter/Sort toolbar + article listing grid (3-col, 1:1)
 * 4. "Recent news" — 2-col row cards
 * 5. "Stories" — 3-col horizontal carousel
 * 6. "Latest research" — 3-col horizontal carousel
 * 7. "Oxy for business" — 3-col horizontal carousel
 * ────────────────────────────────────────────── */
export default function NewsroomPage() {
  const { data: storiesData } = useNewsroomPosts({ category: 'Company', limit: 3 })
  const { data: researchData } = useNewsroomPosts({ category: 'Research', limit: 3 })
  const { data: businessData } = useNewsroomPosts({ category: 'Engineering', limit: 3 })

  const stories = storiesData?.posts ?? []
  const research = researchData?.posts ?? []
  const business = businessData?.posts ?? []

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Newsroom"
        description="The latest news, product announcements, research, and stories from Oxy — the AI-powered CRM platform for go-to-market teams."
        canonicalPath="/newsroom"
      />
      <Navbar />

      {/* Original sections wrapper: flex flex-col mt-xl gap-2xl @md:gap-3xl */}
      <main className="flex flex-col gap-12 pb-20 md:gap-16 md:pb-28">
        {/* 1 + 2. Hero + featured grid */}
        <NewsroomHeroSection />

        {/* 3. Article listing grid with filter/sort + load more */}
        <ArticleGridSection />

        {/* 4. Recent news — 2-col row layout */}
        <RecentNewsSection />

        {/* 5. Stories carousel */}
        <CarouselSection
          title="Stories"
          href="/newsroom"
          articles={stories}
        />

        {/* 6. Latest research carousel */}
        <CarouselSection
          title="Latest research"
          href="/newsroom"
          articles={research}
        />

        {/* 7. Oxy for business carousel */}
        <CarouselSection
          title="Oxy for business"
          href="/newsroom"
          articles={business}
        />
      </main>

      <Footer />
    </div>
  )
}
