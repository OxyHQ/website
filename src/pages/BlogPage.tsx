import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import BlogFeaturedSection from '../components/blog/BlogFeaturedSection'
import BlogGridSection from '../components/blog/BlogGridSection'
import BlogLatestSection from '../components/blog/BlogLatestSection'

export default function BlogPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="News"
        description="The latest news, product updates, and insights from the Oxy team."
        canonicalPath="/company/news"
      />
      <Navbar />
      <main>
        <div className="container">
          <div className="border-border border-x">
            <BlogFeaturedSection />
            <BlogGridSection />
          </div>
        </div>
        <BlogLatestSection />
      </main>
      <Footer />
    </div>
  )
}
