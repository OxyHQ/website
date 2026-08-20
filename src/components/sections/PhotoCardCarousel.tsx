import { ArrowUpRight } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import type SwiperType from 'swiper'

export interface PhotoCard {
  image: string
  title: string
  description: string
}

interface PhotoCardCarouselProps {
  title: string
  description?: string
  cards: readonly PhotoCard[]
  variant?: 'portrait' | 'square'
}

const REVEAL = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
}

export default function PhotoCardCarousel({ title, description, cards, variant = 'portrait' }: PhotoCardCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null)

  return (
    <section className="container">
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
                aria-label="Previous card"
                onClick={() => swiperRef.current?.slidePrev()}
                className="values-nav-btn"
              >
                <ArrowUpRight weight="regular" className="-rotate-[135deg]" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next card"
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
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{card.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{card.description}</p>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  )
}
