import PageShell from '../components/layout/PageShell'
import Navbar from '../components/layout/Navbar'
import AstroPageContent from '../components/astro/AstroPage'

export default function AstroPage() {
  return (
    <PageShell
      seo={{
        title: 'Astro Browser',
        description:
          'Browse with AI beside you: instant answers, smarter suggestions and help with tasks, with the privacy controls on your side.',
        canonicalPath: '/astro',
      }}
      navbar={<Navbar transparent transparentOn="light" />}
      className="cursor-theme astro-theme bg-background"
      mainClassName="flex-1"
    >
      <AstroPageContent />
    </PageShell>
  )
}
