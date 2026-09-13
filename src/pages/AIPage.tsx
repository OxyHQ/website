import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import StructuredData from '../components/StructuredData'
import AiLanding from '../components/ai/platform/AiLanding'
import { useTranslation } from '../lib/i18n'
import { aiServices } from '../data/ai/taxonomy'
import { isPurchasable } from '../lib/ai/availability'

/**
 * `/ai` — the Oxy AI umbrella landing.
 *
 * The structured data describes a `Service`, not a `Product` with an offer:
 * Oxy AI is a platform, nothing on this page is purchasable from it, and an
 * `OfferCatalog` here would advertise offers that do not exist. Services that
 * are genuinely open for self-service are the only ones that get listed as
 * available, which is why the filter reads `isPurchasable` rather than
 * enumerating the cards.
 */
export default function AIPage() {
  const { t } = useTranslation()

  return (
    <PageShell
      seo={{
        title: t('ai.seoTitle'),
        description: t('ai.seoDescription'),
        canonicalPath: '/ai',
      }}
      className="bg-background text-foreground"
      navbar={<Navbar transparent />}
      mainClassName="flex-1"
    >
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Oxy AI',
          serviceType: 'AI platform',
          description: t('ai.seoDescription'),
          provider: { '@type': 'Organization', name: 'Oxy', url: 'https://oxy.so/' },
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Oxy AI',
            itemListElement: aiServices
              .filter((service) => isPurchasable(service.availability))
              .map((service) => ({
                '@type': 'OfferCatalog',
                name: service.name,
                description: service.summary,
              })),
          },
        }}
      />
      <AiLanding />
    </PageShell>
  )
}
