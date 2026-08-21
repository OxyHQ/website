import { useEffect, useState } from 'react'
import { useTranslation } from '../../lib/i18n'

const USE_CASE_KEYS = [
  'home.useCase1',
  'home.useCase2',
  'home.useCase3',
  'home.useCase4',
  'home.useCase5',
  'home.useCase6',
  'home.useCase7',
  'home.useCase8',
  'home.useCase9',
  'home.useCase10',
] as const

const ITEM_HEIGHT = 64
const ROLO_HEIGHT = 576

function itemOpacity(distance: number) {
  if (distance === 0) return 1
  if (distance === 1) return 0.68
  if (distance === 2) return 0.42
  if (distance === 3) return 0.2
  return 0.07
}

export default function OxyUseCasesRolo() {
  const { t } = useTranslation()
  const useCases = USE_CASE_KEYS.map((key) => t(key))
  const roloItems = [...useCases, ...useCases, ...useCases]
  const [activeIndex, setActiveIndex] = useState(useCases.length + Math.floor(useCases.length / 2))
  const [paused, setPaused] = useState(false)
  const [transitionEnabled, setTransitionEnabled] = useState(true)

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => setActiveIndex((index) => index + 1), 2200)
    return () => window.clearInterval(timer)
  }, [paused])

  useEffect(() => {
    if (activeIndex < useCases.length * 2) return
    const resetTimer = window.setTimeout(() => {
      setTransitionEnabled(false)
      setActiveIndex(useCases.length)
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setTransitionEnabled(true))
      })
    }, 620)
    return () => window.clearTimeout(resetTimer)
  }, [activeIndex])

  const translateY = ROLO_HEIGHT / 2 - ITEM_HEIGHT / 2 - activeIndex * ITEM_HEIGHT

  return (
    <section
      className="section w-full overflow-hidden bg-background text-foreground"
      aria-label={t('home.useCasesHeading')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="container">
        <div className="grid min-h-[40rem] grid-cols-1 items-center gap-8 py-16 md:grid-cols-[minmax(0,0.28fr)_minmax(0,0.72fr)] md:gap-4 md:py-20 lg:min-h-[48rem] lg:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] lg:gap-6">
          <p className="text-xl font-medium tracking-tight md:text-2xl">
            {t('home.useCasesHeading')}
          </p>

          <div
            className="relative h-[36rem] overflow-hidden"
            aria-hidden="true"
            style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)' }}
          >
            <ul
              className={`absolute inset-x-0 top-0 flex flex-col ${transitionEnabled ? 'transition-transform duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)]' : ''}`}
              style={{ transform: `translateY(${translateY}px)` }}
            >
              {roloItems.map((item, index) => {
                const distance = Math.abs(index - activeIndex)
                return (
                  <li
                    key={`${item}-${index}`}
                    className="flex h-16 shrink-0 items-center text-3xl font-medium leading-none tracking-tight transition-opacity duration-[620ms] md:text-5xl lg:text-6xl"
                    data-dist={Math.min(distance, 4)}
                    style={{ opacity: itemOpacity(distance) }}
                  >
                    {item}
                  </li>
                )
              })}
            </ul>
          </div>

          <ul className="sr-only">
            {useCases.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}
