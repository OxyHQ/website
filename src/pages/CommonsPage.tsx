import CommonsContent from '../components/commons/CommonsContent'
import PageShell from '../components/layout/PageShell'

export default function CommonsPage() {
  return (
    <PageShell
      seo={{
        title: 'Commons by Oxy',
        description:
          'Commons is where your Oxy identity lives: one key, held on your device, that signs you into every app in the ecosystem. No password, no account held on your behalf.',
        canonicalPath: '/commons',
      }}
      className="slice-theme bg-background"
      mainClassName="flex-1 pb-20 lg:pb-32"
    >
      <CommonsContent />
    </PageShell>
  )
}
