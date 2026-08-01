import PageShell from '../components/layout/PageShell'
import PayContent from '../components/pay/PayContent'

export default function PayPage() {
  return (
    <PageShell
      seo={{
        title: 'Oxy Pay',
        description: 'Your money, on the world’s most powerful network. Earn yield, get cashback, and manage it all in one place.',
        canonicalPath: '/pay',
      }}
      className="bg-bg-primary"
      mainClassName="flex-1"
    >
      <PayContent />
    </PageShell>
  )
}
