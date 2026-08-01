import CareersContent from '../components/careers/CareersContent'
import PageShell from '../components/layout/PageShell'

export default function CareersPage() {
  return (
    <PageShell
      seo={{
        title: 'Careers',
        description:
          'Open roles across engineering, design, community and operations. Help build software that answers to the people who use it.',
        canonicalPath: '/company/careers',
      }}
      className="slice-theme bg-background"
      mainClassName="flex-1 pb-20 lg:pb-32"
    >
      <CareersContent />
    </PageShell>
  )
}
