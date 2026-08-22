import { ArrowUpRight } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import type SwiperType from 'swiper'
import { useTranslation } from '../../lib/i18n'
import { APP_CARD_IMAGES } from '../../data/appCardImages'
import {
  APP_PROFILE_CARDS,
  CommunityProfileCardView,
  type CommunityProfileCard,
} from './OxyAppProfileCard'

const REVEAL = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
}

export default function OxyAppsFeatureGrid() {
  const { t } = useTranslation()
  const swiperRef = useRef<SwiperType | null>(null)

  const appCards = APP_PROFILE_CARDS.map((card) => {
    const roleKey: Record<string, 'products.mentionDescription' | 'products.alloDescription' | 'products.faircoinDescription' | 'products.homiioDescription' | 'products.mercariaDescription'> = {
      Mention: 'products.mentionDescription',
      Allo: 'products.alloDescription',
      FairCoin: 'products.faircoinDescription',
      Homiio: 'products.homiioDescription',
      Mercaria: 'products.mercariaDescription',
    } as const
    const role = t(roleKey[card.name])

    return { ...card, role }
  })

  const additionalCards: CommunityProfileCard[] = [
    {
      type: 'profile',
      image: APP_CARD_IMAGES['/inbox'],
      logo: '/images/apps/inbox.png',
      name: 'Inbox',
      role: t('products.inboxDescription'),
      href: '/inbox',
      theme: 'inbox-theme',
    },
    {
      type: 'profile',
      image: APP_CARD_IMAGES['/astro'],
      logo: '/images/apps/astro.svg',
      name: 'Astro',
      role: t('products.astroDescription'),
      href: '/astro',
      theme: 'astro-card-theme',
    },
    {
      type: 'profile',
      image: APP_CARD_IMAGES['/ai'],
      logo: '/images/apps/alia.svg',
      cornerIcon: '/images/apps/alia-corner.svg',
      name: 'Alia',
      role: t('products.aliaDescription'),
      href: '/ai',
      theme: 'alia-card-theme',
    },
    {
      type: 'profile',
      image: APP_CARD_IMAGES['/os'],
      logo: '/images/apps/oxyos.png',
      name: 'OxyOS',
      role: t('products.oxyOSDescription'),
      href: '/os',
      theme: 'oxyos-card-theme',
    },
    {
      type: 'profile',
      image: APP_CARD_IMAGES['/mercaria'],
      cornerIcon: '/images/apps/wholesale.png',
      name: 'Wholesale by Mercaria',
      role: t('products.wholesaleDescription'),
      href: 'https://dashboard.mercaria.co',
      theme: 'mercaria-theme',
    },
  ]

  const cards = [...appCards, ...additionalCards]

  return (
    <section className="container">
      <div className="grid grid-cols-12 gap-6">
        <motion.div className="col-span-full py-16 max-[950px]:py-10" {...REVEAL}>
          <div className="mb-8 flex items-end justify-between gap-6">
            <div className="max-w-[560px]">
              <h2 className="text-heading-responsive-lg">{t('home.appsFeaturesTitle')}</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t('home.appsFeaturesDescription')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                aria-label={t('common.previous')}
                onClick={() => swiperRef.current?.slidePrev()}
                className="values-nav-btn"
              >
                <ArrowUpRight weight="regular" className="-rotate-[135deg]" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={t('common.next')}
                onClick={() => swiperRef.current?.slideNext()}
                className="values-nav-btn"
              >
                <ArrowUpRight weight="regular" className="rotate-45" aria-hidden />
              </button>
            </div>
          </div>

          <Swiper
            onSwiper={(swiper) => { swiperRef.current = swiper }}
            slidesPerView="auto"
            spaceBetween={16}
            grabCursor
            className="values-swiper"
          >
            {cards.map((card) => (
              <SwiperSlide key={card.name} className="!w-[calc(100vw-40px)] sm:!w-96" style={{ height: 'auto' }}>
                <CommunityProfileCardView card={card} />
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  )
}
