import { useEffect, useRef } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import AstroPageContent from '../components/astro/AstroPage'
import { setColorPreset, getSavedPreset } from '../theme'

export default function AstroPage() {
  const prevPreset = useRef(getSavedPreset())

  // Sync external theme system to blue while this page is mounted
  useEffect(() => {
    setColorPreset('blue')
    return () => setColorPreset(prevPreset.current)
  }, [])

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Astro — AI Browser"
        description="Browse the web with AI by your side. Astro gives you instant answers, smarter suggestions, and help with tasks — all with privacy you control."
        canonicalPath="/astro"
      />
      <Navbar />
      <main className="flex-1">
        <AstroPageContent />
      </main>
      <Footer />
    </div>
  )
}
