import PageShell from '../components/layout/PageShell'
import PeableContent from '../components/peable/PeableContent'

export default function PeablePage() {
  return (
    <PageShell
      seo={{
        title: 'Peable',
        description: 'Payments across the Oxy ecosystem, with every fee shown before you confirm. In development: nothing is open for deposits yet.',
        canonicalPath: '/peable',
      }}
      className="bg-bg-primary"
      mainClassName="flex-1"
    >
      <PeableContent />
    </PageShell>
  )
}
