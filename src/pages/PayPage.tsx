import PageShell from '../components/layout/PageShell'
import PayContent from '../components/pay/PayContent'

export default function PayPage() {
  return (
    <PageShell
      seo={{
        title: 'Oxy Pay',
        description: 'Payments across the Oxy ecosystem, with every fee shown before you confirm. In development: nothing is open for deposits yet.',
        canonicalPath: '/pay',
      }}
      className="bg-bg-primary"
      mainClassName="flex-1"
    >
      <PayContent />
    </PageShell>
  )
}
