import CardGrid from '../slices/CardGrid'
import CtaBlock from '../slices/CtaBlock'
import FaqSection from '../sections/FaqSection'
import UnderlineLink from '../slices/UnderlineLink'
import type { CardItem } from '../slices/InfoCard'
import LogoMarquee, { type MarqueeLogo } from '../slices/LogoMarquee'
import MediaBlock from '../slices/MediaBlock'
import PageHero from '../slices/PageHero'
import PromoBanner from '../slices/PromoBanner'
import UpdatesCarousel, { type UpdateItem } from '../slices/UpdatesCarousel'
import { commonsFaqItems } from './faqItems'

const CAPABILITY_CARDS: CardItem[] = [
  {
    title: 'Keys you hold',
    body: 'Your identity is a keypair generated on your device, kept in its secure hardware. No copy reaches our servers, so there is nothing for us to lose or hand over.',
    link: { label: 'How it works', href: '/developers/docs' },
  },
  {
    title: 'Sign in with Oxy',
    body: 'Scan the code, read what the app is asking for, approve with your face or fingerprint. Nothing to type, nothing to remember, no password to steal.',
    link: { label: 'For developers', href: '/developers/docs' },
  },
  {
    title: 'One session, every app',
    body: 'Sign in once and every Oxy app on the device follows. The session lives with the device, not with a cookie in one browser.',
    link: { label: 'See the ecosystem', href: '/apps' },
  },
  {
    title: 'A recovery phrase, not a support ticket',
    body: 'Twelve words restore the same identity on a new device. Written down and kept offline, they are the whole backup.',
    link: { label: 'Read the FAQ', href: '/help' },
  },
]

const DETAIL_CARDS: CardItem[] = [
  {
    title: 'Create your identity',
    body: 'Commons walks you through it once: generate the key on the device, acknowledge the recovery phrase, and store an encrypted backup locally. From that point on, your account signs for itself.',
    link: { label: 'Get the app', href: '/apps' },
  },
  {
    title: 'Your account, on the open web',
    body: 'Every Oxy account publishes a DID document at did:web:oxy.so. Link a Commons identity and it lists your key as the controller, so any service can verify you without going through us.',
    link: { label: 'Read the docs', href: '/developers/docs' },
  },
]

/** The apps that pick up a Commons session on the same device. */
const ECOSYSTEM_LOGOS: MarqueeLogo[] = [
  { alt: 'Mention', src: '/images/apps/mention.png' },
  { alt: 'Allo', src: '/images/apps/allo.png' },
  { alt: 'Inbox', src: '/images/apps/inbox.png' },
  { alt: 'Alia', src: '/images/apps/alia.svg' },
  { alt: 'Accounts', src: '/images/apps/accounts.png' },
  { alt: 'Astro', src: '/images/apps/astro.svg' },
  { alt: 'OxyOS', src: '/images/apps/oxyos.png' },
]

const UPDATES: UpdateItem[] = [
  {
    title: 'Every release across the Oxy ecosystem',
    href: '/changelog',
    image: '/images/hero/hero-1.webp',
    imageAlt: '',
  },
  {
    title: 'Build on Oxy: SDKs, APIs and the identity layer',
    href: '/developers/docs',
    image: '/images/hero/hero-3.webp',
    imageAlt: '',
  },
  {
    title: 'The apps a Commons identity signs you into',
    href: '/apps',
    image: '/images/hero/hero-4.webp',
    imageAlt: '',
  },
  {
    title: 'Why we build this way',
    href: '/company/manifesto',
    image: '/images/hero/hero-5.jpg',
    imageAlt: '',
  },
]

export default function CommonsContent() {
  return (
    <>
      <PageHero eyebrow="Commons" title="Identity you actually own" />

      <MediaBlock
        className="pt-12 lg:pt-16"
        src="/videos/commons-hero.mp4"
        poster="/images/commons/hero-poster.jpg"
        alt="Three people standing by a lake at dusk"
        ratioClassName="max-sm:aspect-[390/590] sm:aspect-video"
      />

      <CtaBlock
        body={
          <>
            Commons is where your Oxy identity lives: one key, held on your device, that signs you into every app in the ecosystem.
            <br />
            <br />
            No password to reuse, no account for us to hold on your behalf.
          </>
        }
        action={{ label: 'Get Commons', href: '/apps' }}
      />

      <CardGrid title="What Commons does" cards={CAPABILITY_CARDS} />

      <MediaBlock
        className="layout-padding-top"
        src="/videos/commons-crowd.mp4"
        poster="/images/commons/crowd-poster.jpg"
        alt="A crowd crossing a public square, seen from above"
      />

      <CardGrid cards={DETAIL_CARDS} cardHeightClassName="min-h-70 lg:min-h-110" className="pt-3 lg:pt-6" />

      <CtaBlock
        title="Commons for developers"
        body="Register your app, drop in the SDK, and let people sign in with a key they control instead of a password you have to store."
        emphasis="supporting"
        action={{ label: 'Read the docs', href: '/developers/docs' }}
        actionStyle="link"
      />

      <LogoMarquee logos={ECOSYSTEM_LOGOS} />

      <PromoBanner
        title="One identity, every Oxy app"
        paragraphs={[
          'Mention, Allo, Inbox, Homiio and the rest share one session on your device.',
          'Sign in once in Commons and the others are already signed in. Sign out, and they all let go together.',
        ]}
        link={{ label: 'See the ecosystem', href: '/apps' }}
        image={{ src: '/images/screenshots/mention-app.png', alt: 'Oxy apps sharing one identity' }}
      />

      <UpdatesCarousel title="More from Oxy" items={UPDATES} />

      <FaqSection
        title="Frequently asked questions"
        items={commonsFaqItems}
        className="faq-theme flex min-h-[100svh] items-center bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
      />

      <div className="layout-px-large mt-8 lg:mt-10">
        <UnderlineLink href="/help" className="text-b1">
          Visit the help centre
        </UnderlineLink>
      </div>
    </>
  )
}
