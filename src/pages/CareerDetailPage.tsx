import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import CareerDetailContent from '../components/careers/CareerDetailPage'

export default function CareerDetailPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="container">
        <div className="border-border border-x">
          <CareerDetailContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}
