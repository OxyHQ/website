import PageShell from '../components/layout/PageShell'
import AstroPageContent from '../components/astro/AstroPage'

export default function AstroPage() {
  return (
    <PageShell
      seo={{
        title: 'Astro — AI Browser',
        description:
          'Browse the web with AI by your side. Astro gives you instant answers, smarter suggestions, and help with tasks — all with privacy you control.',
        canonicalPath: '/astro',
      }}
      className="cursor-theme astro-theme bg-background"
      mainClassName="flex-1"
    >
      <AstroPageContent />
    </PageShell>
  )
}
