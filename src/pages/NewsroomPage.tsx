import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import NewsroomHeroSection from '../components/newsroom/NewsroomHeroSection'

export default function NewsroomPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main>
        <NewsroomHeroSection />
      </main>
      <Footer />
    </div>
  )
}
