import { ArrowUpRight } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import type SwiperType from 'swiper'
import { useTranslation } from '../../lib/i18n'

export interface PhotoCard {
  image?: string
  visual?: ReactNode
  title: string
  description: string
  link?: { label: string; href: string; external?: boolean }
}

interface PhotoCardCarouselProps {
  title: string
  description?: string
  cards: readonly PhotoCard[]
  variant?: 'portrait' | 'square'
  id?: string
}

const REVEAL = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
}

export default function PhotoCardCarousel({ title, description, cards, variant = 'portrait', id }: PhotoCardCarouselProps) {
  const { t } = useTranslation()
  const swiperRef = useRef<SwiperType | null>(null)

  return (
    <section id={id} className="container">
      <div className="grid grid-cols-12 gap-6">
        <motion.div className="col-span-full py-16 max-[950px]:py-10" {...REVEAL}>
          <div className="mb-8 flex items-end justify-between gap-6">
            <div className="max-w-[560px]">
              <h2 className="text-heading-responsive-lg">{title}</h2>
              {description ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p> : null}
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
            slidesPerView={1.15}
            spaceBetween={24}
            grabCursor
            className="values-swiper"
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 24 },
              950: { slidesPerView: 2.5, spaceBetween: 24 },
              1200: { slidesPerView: 3.2, spaceBetween: 24 },
            }}
          >
            {cards.map((card) => (
              <SwiperSlide key={card.title} style={{ height: 'auto' }}>
                <article className="flex h-full flex-col">
                  <div className={`${variant === 'square' ? 'aspect-square' : 'aspect-[4/5]'} overflow-hidden rounded-3xl`}>
                    {card.image ? (
                      <img
                        src={card.image}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                        width={800}
                        height={1000}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface text-primary transition-transform duration-500 hover:scale-[1.03]">
                        {card.visual}
                      </div>
                    )}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{card.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{card.description}</p>
                  {card.link && (
                    <div className="mt-4">
                      {card.link.external ? (
                        <a
                          href={card.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-70"
                        >
                          {card.link.label}
                          <ArrowUpRight size={15} weight="regular" aria-hidden />
                        </a>
                      ) : (
                        <Link
                          to={card.link.href}
                          className="inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-70"
                        >
                          {card.link.label}
                          <ArrowUpRight size={15} weight="regular" aria-hidden />
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  )
}
