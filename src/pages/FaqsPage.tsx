import { faqGroups } from '../components/faqs/faqGroups'
import PageShell from '../components/layout/PageShell'
import FaqDirectory from '../components/slices/FaqDirectory'
import PageHero from '../components/slices/PageHero'

export default function FaqsPage() {
  return (
    <PageShell
      seo={{
        title: 'Frequently asked questions',
        description: 'Short answers about Oxy: what it is, what it costs, how the apps fit together, how your data is handled and how to build on the platform.',
        canonicalPath: '/faqs',
      }}
      className="slice-theme bg-background"
      mainClassName="flex-1"
    >
      <PageHero title="Frequently Asked Questions" variant="listing" />
      <FaqDirectory groups={faqGroups} />
    </PageShell>
  )
}
