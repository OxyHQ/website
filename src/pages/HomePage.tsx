import { useState, useLayoutEffect, useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { RiArrowRightUpLine } from '@oxy.so/bloom/icons/RiArrowRightUpLine'
import { RiBookReadLine } from '@oxy.so/bloom/icons/RiBookReadLine'
import { RiBugLine } from '@oxy.so/bloom/icons/RiBugLine'
import { RiCodeLine } from '@oxy.so/bloom/icons/RiCodeLine'
import { RiHandHeartLine } from '@oxy.so/bloom/icons/RiHandHeartLine'
import { RiMegaphoneLine } from '@oxy.so/bloom/icons/RiMegaphoneLine'
import { RiNewspaperLine } from '@oxy.so/bloom/icons/RiNewspaperLine'
import { RiSearchLine } from '@oxy.so/bloom/icons/RiSearchLine'
import { RiTeamLine } from '@oxy.so/bloom/icons/RiTeamLine'
import { RiTranslate2 } from '@oxy.so/bloom/icons/RiTranslate2'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import HomeHero from '../components/homepage/HomeHero'
import HomeTagPhysics from '../components/homepage/HomeTagPhysics'
import FairCoinSection from '../components/sections/FairCoinSection'
import FaqSection from '../components/sections/FaqSection'
import { usePage, type PageSection } from '../api/hooks'
import 'swiper/css'
import '../styles/landing.css'
import AIResearchSection from '../components/ai/AIResearchSection'
import HomeAiSection from '../components/homepage/HomeAiSection'
import OxyAppsFeatureGrid from '../components/sections/OxyAppsFeatureGrid'
import OxyUseCasesRolo from '../components/sections/OxyUseCasesRolo'
import PhotoCardCarousel, { type PhotoCard } from '../components/sections/PhotoCardCarousel'
import { Link } from '../lib/navigation'
import { AlertDialog } from '@oxy.so/bloom/alert-dialog'
import { AnimatedTitle } from '../components/ui/AnimatedTitle'
import { APP_CARD_IMAGES } from '../data/appCardImages'
import { useTranslation } from '../lib/i18n'
import { BrandScope } from '../theme/BrandScope'
import { useScrollDetent } from '../hooks/useScrollDetent'

/**
 * Pulls a heading, subheading or content string out of a Page document's
 * `sections` array. Returns the provided fallback when the section is missing
 * or the target field is empty. Mirrors the NewsroomPage helper — kept local
 * so each page can own its fallback set without a cross-page import.
 */
function pageHeading(sections: PageSection[] | undefined, type: string, fallback: string): string {
  return sections?.find(s => s.type === type)?.heading || fallback
}

function pageContent(sections: PageSection[] | undefined, type: string, fallback: string): string {
  return sections?.find(s => s.type === type)?.content || fallback
}

// Fallback copy for home-page marketing sections. Used when the CMS
// `pages/home` document is missing the corresponding section so the site
// renders identically to the hardcoded baseline.
const IMG = '/images/landing'

// Scroll-reveal preset shared by every reshaped section so the page animates
// in with one consistent, subtle motion.
const REVEAL = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
}

/* ------------------------------------------------------------------ */
/*  Build for everyone (resource links)                                */
/* ------------------------------------------------------------------ */
interface ResourceLink {
  label: string
  href: string
  external?: boolean
}

const BUILD_FOR_EVERYONE_LINKS: Array<Omit<ResourceLink, 'label'> & { key: string }> = [
  { key: 'home.buildLinkNewsroom', href: '/newsroom' },
  { key: 'home.buildLinkDocs', href: '/developers/docs' },
  { key: 'home.buildLinkCode', href: 'https://github.com/OxyHQ', external: true },
  { key: 'home.buildLinkTeam', href: '/company/team' },
]

const BUILD_FOR_EVERYONE_LINK_CLASSES = [
  'bg-[color-mix(in_srgb,var(--background)_88%,var(--primary))] text-foreground',
  'bg-[color-mix(in_srgb,var(--background)_84%,var(--primary))] text-foreground',
  'bg-[color-mix(in_srgb,var(--background)_80%,var(--primary))] text-foreground',
  'bg-secondary text-secondary-foreground',
] as const

function BuildForEveryoneSection() {
  const { t, locale } = useTranslation()
  const { data: pageData } = usePage('home')
  const sections = pageData?.sections
  // Heading is stored as a single string with a pipe separator so the CMS can
  // drive line-breaks at the exact point used by the current layout. Fall
  // back to the pre-CMS two-line split when nothing has been published yet.
  const headingFallback = `${t('home.allInOneHeadingLine1')}|${t('home.allInOneHeadingLine2')}`
  const headingRaw = locale === 'en'
    ? pageHeading(sections, 'all-in-one', headingFallback)
    : headingFallback
  const [headingLine1, headingLine2] = headingRaw.includes('|')
    ? headingRaw.split('|', 2)
    : [headingRaw, '']
  const body = locale === 'en'
    ? pageContent(sections, 'all-in-one', t('home.allInOneBody'))
    : t('home.allInOneBody')
  const sectionRef = useRef<HTMLElement>(null)
  useScrollDetent(sectionRef)

  return (
    <BrandScope className="build-theme">
      <section
        ref={sectionRef}
        id="build-for-everyone"
        className="build-theme scroll-mt-[var(--site-header-height)] bg-[color-mix(in_srgb,var(--primary)_10%,var(--background))]"
      >
        <div className="container">
          <motion.div
            className="grid grid-cols-1 items-start gap-8 py-10 min-[951px]:grid-cols-2 min-[951px]:gap-12 min-[951px]:py-14"
            {...REVEAL}
          >
              {/* Left — heading + body */}
              <div>
                <h2 className="text-heading-responsive-lg text-primary-text">
                  {headingLine1}
                  {headingLine2 && (
                    <>
                      <br />
                      {headingLine2}
                    </>
                  )}
                </h2>
                <p className="mt-4 max-w-[460px] text-foreground/70">{body}</p>
              </div>

              {/* Right — resource links */}
              <ul className="flex flex-col gap-2">
                {BUILD_FOR_EVERYONE_LINKS.map((link, index) => {
                  const rowClass = `group flex items-center justify-between gap-4 rounded-full px-5 py-3 font-display text-xl font-[450] transition-[filter] duration-200 hover:brightness-110 ${BUILD_FOR_EVERYONE_LINK_CLASSES[index]}`
                  const arrow = (
                    <span
                      className="inline-flex shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    >
                      <RiArrowRightUpLine width={20} height={20} fill="currentColor" />
                    </span>
                  )
                  return (
                    <li key={link.key}>
                      {link.external ? (
                        <a href={link.href} target="_blank" rel="noreferrer" className={rowClass}>
                          <span>{t(link.key)}</span>
                          {arrow}
                        </a>
                      ) : (
                        <Link to={link.href} className={rowClass}>
                          <span>{t(link.key)}</span>
                          {arrow}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
          </motion.div>
        </div>
      </section>
    </BrandScope>
  )
}

/* ------------------------------------------------------------------ */
/*  Values (photo-card carousel)                                       */
/* ------------------------------------------------------------------ */
const VALUES: Array<Pick<PhotoCard, 'image'>> = [
  {
    image: '/images/hero/hero-4.webp',
  },
  {
    image: '/images/hero/hero-1.webp',
  },
  {
    image: '/images/hero/hero-5.jpg',
  },
  {
    image: '/images/hero/hero-3.webp',
  },
  {
    image: '/images/landing/value-people.avif',
  },
]

function ValuesSection() {
  const { t } = useTranslation()
  const cards = [
    { image: VALUES[0].image, title: t('home.valueHumanTitle'), description: t('home.valueHumanDescription') },
    { image: VALUES[1].image, title: t('home.valueDataTitle'), description: t('home.valueDataDescription') },
    { image: VALUES[2].image, title: t('home.valuePurposeTitle'), description: t('home.valuePurposeDescription') },
    { image: VALUES[3].image, title: t('home.valueOpenTitle'), description: t('home.valueOpenDescription') },
    { image: VALUES[4].image, title: t('home.valuePeopleTitle'), description: t('home.valuePeopleDescription') },
  ]
  return <PhotoCardCarousel title={t('home.valuesHeading')} cards={cards} />
}

/* ------------------------------------------------------------------ */
/*  Enterprise Partnership Services                                    */
/* ------------------------------------------------------------------ */
const PARTNERSHIP_ITEMS = [
  { key: 'home.partnershipContribute', Icon: RiCodeLine },
  { key: 'home.partnershipCommunity', Icon: RiTeamLine },
  { key: 'home.partnershipBugs', Icon: RiBugLine },
  { key: 'home.partnershipTranslate', Icon: RiTranslate2 },
  { key: 'home.partnershipDocs', Icon: RiBookReadLine },
  { key: 'home.partnershipVolunteer', Icon: RiHandHeartLine },
  { key: 'home.partnershipSpread', Icon: RiMegaphoneLine },
  { key: 'home.buildLinkNewsroom', Icon: RiNewspaperLine },
  { key: 'home.buildLinkDocs', Icon: RiSearchLine },
]

function PartnershipSection() {
  const { t } = useTranslation()
  const ref = useRef<HTMLElement>(null)
  const backgroundRef = useRef<HTMLImageElement>(null)
  const [backgroundTravel, setBackgroundTravel] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const visibleTravel = Math.min(backgroundTravel * 0.2, 120)
  const backgroundOffset = useTransform(scrollYProgress, [0, 1], [0, -visibleTravel])
  const backgroundY = useSpring(backgroundOffset, { stiffness: 90, damping: 24, mass: 0.45 })

  useLayoutEffect(() => {
    const section = ref.current
    const image = backgroundRef.current
    if (!section || !image) return

    const measureTravel = () => {
      setBackgroundTravel(Math.max(image.getBoundingClientRect().height - section.getBoundingClientRect().height, 0))
    }

    measureTravel()
    image.addEventListener('load', measureTravel)
    const observer = new ResizeObserver(measureTravel)
    observer.observe(section)
    observer.observe(image)

    return () => {
      image.removeEventListener('load', measureTravel)
      observer.disconnect()
    }
  }, [])

  return (
    <BrandScope className="partnership-theme">
      <section ref={ref} className="partnership-theme relative isolate min-h-[560px] overflow-hidden text-foreground md:min-h-[680px]">
        <motion.img
          ref={backgroundRef}
          src="/images/landing/spacex-launch.jpg"
          alt=""
          aria-hidden="true"
          style={{ y: backgroundY }}
          className="absolute left-0 top-0 z-0 h-auto min-h-full w-full object-cover object-[50%_0%] will-change-transform"
          width={1440}
          height={900}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 z-0 bg-background/55" />

        <div className="container relative z-10">
          <div className="grid items-start gap-6 py-7 min-[951px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[951px]:gap-10 min-[951px]:py-8">
            <div>
              <AnimatedTitle static as="h2" className="text-heading-responsive-lg mb-4 font-[550] lg:text-[3.25rem] lg:leading-[1.08]">{t('home.partnershipTitle')}</AnimatedTitle>
              <p className="max-w-[500px] text-foreground/80">
                {t('home.partnershipDescription')}
              </p>
            </div>

            <div className="grid grid-cols-2 items-center gap-x-6 gap-y-1.5 max-[650px]:grid-cols-1">
              {PARTNERSHIP_ITEMS.map(({ key, Icon }) => (
                <div
                  key={key}
                  className="flex min-h-7 items-center gap-2 px-1 py-0.5 text-sm font-medium leading-snug text-foreground/90"
                >
                  <Icon width={18} height={18} fill="currentColor" aria-hidden />
                  <span>{t(key)}</span>
                </div>
              ))}
              <a
                href="/sustain/"
                className="flex min-h-8 items-center gap-2 px-1 py-0.5 text-base font-semibold text-tertiary transition-colors duration-200 hover:text-tertiary/80 md:text-lg"
              >
                {t('home.partnershipCta')}
                <RiArrowRightUpLine width={18} height={18} fill="currentColor" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>
    </BrandScope>
  )
}

/* ------------------------------------------------------------------ */
/*  For Developers card                                                */
/* ------------------------------------------------------------------ */

function CommonsAppSection() {
  const { t } = useTranslation()
  const [iosSoonOpen, setIosSoonOpen] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  // The backdrop is 140% tall and starts 20% above the band, so a ±8% drift of
  // its own height still leaves it covering the band edge to edge.
  const backdropY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  // The phone only ever moves DOWN from its resting position. Lifting it would
  // raise the photo's hard bottom edge into the band and show the cut.
  const phoneY = useTransform(scrollYProgress, [0, 1], ['22%', '0%'])

  return (
    <section ref={ref} className="force-dark relative isolate overflow-hidden">
      <motion.img
        src={`${IMG}/commons-night.webp`}
        alt=""
        aria-hidden="true"
        style={reduce ? undefined : { y: backdropY }}
        className="-z-20 absolute -top-[20%] left-0 h-[140%] w-full object-cover"
        width={1794}
        height={877}
        loading="lazy"
        decoding="async"
      />
      {/* The illustration is busiest on the left, where the copy sits. The
          band is a night scene in either theme, so it takes the `.force-dark`
          palette and the scrim is that palette's background. */}
      <div className="-z-10 absolute inset-0 bg-linear-to-r from-background/88 via-background/72 via-45% to-background/35 max-lg:bg-linear-to-b max-lg:from-background/85 max-lg:via-background/60 max-lg:via-60% max-lg:to-background/85" />

      {/* No bottom padding on the right: the phone is meant to rise out of the
          band's lower edge rather than float in the middle of it. */}
      <div className="container pt-20 lg:pt-28">
        <div className="grid grid-cols-12 items-end gap-6">
          <div className="col-span-full pb-20 text-foreground max-lg:text-center lg:col-span-5 lg:pb-28">
            <AnimatedTitle as="h2" className="mb-5 text-heading-responsive-lg lg:text-[4rem] lg:leading-[1.05]">{t('home.commonsTitle')}</AnimatedTitle>
            <p className="max-w-[500px] text-lg leading-relaxed opacity-80 lg:text-xl max-lg:mx-auto">
              {t('home.commonsDescription')}
            </p>

            <div className="mt-10 flex flex-col gap-5 max-lg:items-center lg:mt-12">
              <p className="max-w-[530px] font-[450] text-[13px] leading-relaxed tracking-wide">
                <span className="opacity-60">
                  {t('home.commonsDetails')}
                </span>{' '}
                {t('home.commonsFree')}
              </p>
              {/* Official store artwork, served as files. Commons is live on
                  Google Play; there is no iOS listing yet, so the App Store
                  badge says so instead of sending people to a dead end.
                  The black behind each badge is Apple's and Google's own badge
                  colour (their guidelines forbid recolouring), not a theme one. */}
              <div className="flex flex-wrap items-center gap-3 max-lg:justify-center">
                <button
                  type="button"
                  onClick={() => setIosSoonOpen(true)}
                  aria-label={t('home.appStore')}
                  className="inline-flex w-fit cursor-pointer overflow-hidden rounded-full border-0 bg-black leading-none transition-opacity hover:opacity-80"
                >
                  <img className="block" src="/images/badges/app-store.svg" alt={t('home.appStore')} width={128} height={38} />
                </button>
                <a
                  href="https://play.google.com/store/apps/details?id=so.oxy.commons"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('home.googlePlay')}
                  className="inline-flex w-fit overflow-hidden rounded-full border-0 bg-black leading-none transition-opacity hover:opacity-80"
                >
                  <img className="block" src="/images/badges/google-play.svg" alt={t('home.googlePlay')} width={128} height={38} />
                </a>
              </div>
            </div>
            <AlertDialog
              visible={iosSoonOpen}
              onClose={() => setIosSoonOpen(false)}
              title={t('home.commonsIosSoonTitle')}
              description={t('home.commonsIosSoonBody')}
              confirmLabel={t('common.close')}
              hideCancel
            />
          </div>

          <motion.div
            style={reduce ? undefined : { y: phoneY }}
            className="col-span-full self-end max-lg:mt-4 lg:col-span-6 lg:col-start-7"
          >
            <img
              src={APP_CARD_IMAGES['/commons']}
              alt={t('home.commonsImageAlt')}
              className="mx-auto h-auto w-full max-w-[320px] object-contain drop-shadow-[0_30px_60px_color-mix(in_srgb,var(--background)_45%,transparent)] sm:max-w-[440px] lg:max-w-none"
              width={577}
              height={433}
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const { t } = useTranslation()
  const homeFaqs = [
    { question: t('home.faq1Question'), answer: t('home.faq1Answer') },
    { question: t('home.faq2Question'), answer: t('home.faq2Answer') },
    { question: t('home.faq3Question'), answer: t('home.faq3Answer') },
    { question: t('home.faq4Question'), answer: t('home.faq4Answer') },
    { question: t('home.faq5Question'), answer: t('home.faq5Answer') },
    { question: t('home.faq6Question'), answer: t('home.faq6Answer') },
    { question: t('home.faq7Question'), answer: t('home.faq7Answer') },
    { question: t('home.faq8Question'), answer: t('home.faq8Answer') },
    { question: t('home.faq9Question'), answer: t('home.faq9Answer') },
    { question: t('home.faq10Question'), answer: t('home.faq10Answer') },
    { question: t('home.faq11Question'), answer: t('home.faq11Answer') },
    { question: t('home.faq12Question'), answer: t('home.faq12Answer') },
  ]
  return (
    <>
      <SEO
        title={t('home.seoTitle')}
        description={t('home.seoDescription')}
        canonicalPath="/"
      />
      {/* The hero's top band is the page's own background, so the bar writes
          in the page's ink rather than the light type a dark hero takes. */}
      <Navbar transparent transparentOn="light" />
      <main className="oxy-landing">
        <HomeHero />
        <BuildForEveryoneSection />
        <OxyAppsFeatureGrid />
        <HomeTagPhysics />
        <OxyUseCasesRolo />
        <ValuesSection />
        <FairCoinSection />
        <HomeAiSection />
        <AIResearchSection />
        <PartnershipSection />
        <FaqSection
          title={t('home.faqHeading')}
          groups={[
            {
              title: t('home.faqGroupAbout'),
              items: [homeFaqs[0], homeFaqs[2], homeFaqs[3]],
            },
            {
              title: t('home.faqGroupControl'),
              items: [homeFaqs[4], homeFaqs[6], homeFaqs[7]],
            },
            {
              title: t('home.faqGroupProducts'),
              items: [homeFaqs[1], homeFaqs[8], homeFaqs[9]],
            },
            {
              title: t('home.faqGroupCommunity'),
              items: [homeFaqs[5], homeFaqs[10], homeFaqs[11]],
            },
          ]}
          className="faq-theme flex min-h-[100svh] items-center bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
        />
        <CommonsAppSection />
      </main>
      <Footer hideTopDivider />
    </>
  )
}
