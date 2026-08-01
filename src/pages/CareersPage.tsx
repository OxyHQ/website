import CareersContent from '../components/careers/CareersContent'
import PageShell from '../components/layout/PageShell'

export default function CareersPage() {
  return (
    <PageShell
      seo={{
        title: 'Careers',
        description:
          'Join Oxy and help build an open-source ecosystem of AI agents and apps. See open positions in Engineering, Product, Design, and more.',
        canonicalPath: '/company/careers',
      }}
      className="slice-theme bg-background"
      mainClassName="flex-1 pb-20 lg:pb-32"
    >
      <CareersContent />
    </PageShell>
  )
}
