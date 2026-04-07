import SEO from '../components/SEO'
import AstroPageContent from '../components/astro/AstroPage'

export default function AstroPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip">
      <SEO
        title="Astro — AI Browser"
        description="Browse the web with AI by your side. Astro gives you instant answers, smarter suggestions, and help with tasks — all with privacy you control."
        canonicalPath="/astro"
      />
      <main className="flex-1">
        <AstroPageContent />
      </main>
    </div>
  )
}
