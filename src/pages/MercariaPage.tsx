import PageShell from '../components/layout/PageShell'
import Navbar from '../components/layout/Navbar'
import AstroPageContent from '../components/astro/AstroPage'
import FaqSection from '../components/sections/FaqSection'
import { APP_CARD_IMAGES } from '../data/appCardImages'

const MERCARIA_FAQ_GROUPS = [
  {
    title: 'The marketplace',
    items: [
      {
        question: 'What is Mercaria?',
        answer: 'Mercaria is Oxy\'s marketplace for buying and selling new products from shops and secondhand items from people.',
      },
      {
        question: 'Can both shops and individuals sell on Mercaria?',
        answer: 'Yes. A listing can belong to a person or a store, so secondhand sales and shop orders share the same catalogue, cart, checkout and refund paths.',
      },
      {
        question: 'What can I do in the Mercaria storefront?',
        answer: 'The storefront brings browsing, search, cart, checkout and orders together in one marketplace experience.',
      },
    ],
  },
  {
    title: 'Identity and commerce',
    items: [
      {
        question: 'Do I need a separate Mercaria account?',
        answer: 'No. Mercaria uses your Oxy identity, so there is no separate Mercaria account to create or manage.',
      },
      {
        question: 'Does Mercaria support multiple currencies?',
        answer: 'Yes. Listings keep their native currency, while Mercaria can present prices in the currency selected for the shopping experience.',
      },
      {
        question: 'How do the Mercaria apps work together?',
        answer: 'The customer storefront, merchant dashboard and point-of-sale app are separate experiences backed by one commerce API.',
      },
    ],
  },
] as const

export default function MercariaPage() {
  return (
    <PageShell
      seo={{
        title: 'Mercaria',
        description:
          'A marketplace for new goods from shops and secondhand items from people, with the same identity and trust you already have across Oxy.',
        canonicalPath: '/mercaria',
        ogImage: APP_CARD_IMAGES['/mercaria'],
      }}
      navbar={<Navbar transparent transparentOn="dark" />}
      className="cursor-theme astro-theme bg-background"
      mainClassName="flex-1"
    >
      <AstroPageContent
        heroBackgroundVideo="/videos/mercaria-hero.mp4"
        heroVideoScrollStart={7}
        heroIconSrc="/images/mercaria/icon.png"
        heroIconAlt="Mercaria icon"
        heroTitle="Buy and sell, all in one place."
        heroTitleClassName="!text-[clamp(2.75rem,6vw,5.5rem)]"
        heroSubtitle="New items from shops and secondhand finds from people, together in one marketplace built for both."
        centerHeroContent
        heroCtaLabel="Visit Mercaria"
        heroCtaHref="https://mercaria.co/"
        showHeroPlatformAvailability={false}
        showHeroBrowserMockup={false}
        heroOnly
      />
      <FaqSection
        title="Frequently asked questions"
        groups={MERCARIA_FAQ_GROUPS}
        className="faq-theme bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
      />
    </PageShell>
  )
}
