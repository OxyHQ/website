import { useState, useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { PromptInput } from '@oxyhq/bloom/prompt-input'
import { usePromptPhrases } from '../../api/hooks'

const DEFAULT_PHRASES = [
  'Ask Alia anything about Oxy',
  'What can Oxy do for my team?',
  'How does Oxy use AI?',
  'Tell me about Oxy pricing',
  'What integrations does Oxy support?',
  'How is Oxy different from other CRMs?',
  'Can Oxy help with sales automation?',
  'What is Universal Context?',
]

const TYPING_SPEED = 50
const PAUSE_AFTER_TYPED = 2000
const PAUSE_AFTER_ERASED = 400

const HIDDEN_PREFIXES = ['/company', '/developers', '/settings', '/help', '/changelog', '/admin', '/dashboard', '/initiative']

function slugFromPathname(pathname: string): string {
  const stripped = pathname.replace(/^\/+|\/+$/g, '')
  if (!stripped) return 'home'
  return stripped.split('/')[0]
}

function useRotatingPlaceholder(phrases: string[]) {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    if (phrases.length === 0) return
    const phrase = phrases[phraseIndex % phrases.length]
    let i = 0
    let erasing = false
    let timer: number

    function tick() {
      if (!erasing) {
        i++
        setText(phrase.slice(0, i))
        if (i >= phrase.length) {
          erasing = true
          timer = window.setTimeout(tick, PAUSE_AFTER_TYPED)
          return
        }
      } else {
        i--
        setText(phrase.slice(0, i))
        if (i <= 0) {
          setPhraseIndex((prev) => (prev + 1) % phrases.length)
          return
        }
      }
      timer = window.setTimeout(tick, erasing ? 30 : TYPING_SPEED)
    }

    timer = window.setTimeout(tick, PAUSE_AFTER_ERASED)
    return () => clearTimeout(timer)
  }, [phraseIndex, phrases])

  return text
}

export default function FixedPromptInput() {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hiddenByFooter, setHiddenByFooter] = useState(false)
  const [hiddenByHero, setHiddenByHero] = useState(false)

  const { pathname } = useLocation()
  const hiddenByRoute = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  const slug = slugFromPathname(pathname)
  const { data: fetchedPhrases } = usePromptPhrases(slug, !hiddenByRoute)
  const phrases = useMemo(
    () => (fetchedPhrases && fetchedPhrases.length > 0 ? fetchedPhrases : DEFAULT_PHRASES),
    [fetchedPhrases],
  )

  const placeholder = useRotatingPlaceholder(phrases)

  // Hide when footer or hero is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const t = setTimeout(() => {
      const footer = document.querySelector('footer')
      if (footer) {
        const footerObs = new IntersectionObserver(
          ([entry]) => setHiddenByFooter(entry.isIntersecting),
          { threshold: 0 },
        )
        footerObs.observe(footer)
        observers.push(footerObs)
      }

      const hero = document.querySelector('.page-hero')
      if (hero) {
        const heroObs = new IntersectionObserver(
          ([entry]) => setHiddenByHero(entry.isIntersecting),
          { threshold: 0 },
        )
        heroObs.observe(hero)
        observers.push(heroObs)
      }
    }, 100)
    return () => {
      clearTimeout(t)
      observers.forEach((obs) => obs.disconnect())
    }
  }, [pathname])

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    setIsLoading(true)
    // TODO: replace with real handler
    setTimeout(() => {
      setIsLoading(false)
      setValue('')
    }, 1500)
  }, [value, isLoading])

  return (
    <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5 transition-all duration-300 ${hiddenByFooter || hiddenByHero || hiddenByRoute ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
      {/* Gradient fade */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      {/* Bloom PromptInput */}
      <div className="pointer-events-auto relative w-full max-w-2xl">
        <PromptInput
          value={value}
          onValueChange={setValue}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onStop={() => setIsLoading(false)}
          placeholder={placeholder || 'Ask Alia'}
          maxHeight={160}
          style={{ minHeight: 36 }}
          disableKeyboardAvoidance
        />
      </div>
    </div>
  )
}
