import { useState, useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { PromptInput } from '@oxyhq/bloom/prompt-input'
import { usePromptPhrases } from '../../api/hooks'
import { usePageChromeStore } from '../../stores/pageChromeStore'
import { isFairCoinHost } from '../../lib/host'

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

const TYPING_SPEED_MS = 50
const PAUSE_AFTER_TYPED_MS = 2000
const PAUSE_AFTER_ERASED_MS = 400
const ERASING_SPEED_MS = 30

// `/faircoin` covers the FairCoin landing + bridge under oxy.so. The
// `isFairCoinHost()` check below covers fairco.in, where the same pages live
// at the apex (`/`, `/bridge`) and the prefix list wouldn't match.
const HIDDEN_PREFIXES = ['/company', '/developers', '/settings', '/help', '/changelog', '/admin', '/dashboard', '/initiative', '/astro', '/faircoin', '/homiio', '/mention']

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

    const tick = () => {
      if (!erasing) {
        i++
        setText(phrase.slice(0, i))
        if (i >= phrase.length) {
          erasing = true
          timer = window.setTimeout(tick, PAUSE_AFTER_TYPED_MS)
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
      timer = window.setTimeout(tick, erasing ? ERASING_SPEED_MS : TYPING_SPEED_MS)
    }

    timer = window.setTimeout(tick, PAUSE_AFTER_ERASED_MS)
    return () => clearTimeout(timer)
  }, [phraseIndex, phrases])

  return text
}

export default function FixedPromptInput() {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const hiddenByHero = usePageChromeStore((s) => s.heroVisible)
  const hiddenByFooter = usePageChromeStore((s) => s.footerVisible)

  const { pathname } = useLocation()
  const hiddenByRoute =
    isFairCoinHost() ||
    HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  const slug = slugFromPathname(pathname)
  const { data: fetchedPhrases } = usePromptPhrases(slug, !hiddenByRoute)
  const phrases = useMemo(
    () => (fetchedPhrases && fetchedPhrases.length > 0 ? fetchedPhrases : DEFAULT_PHRASES),
    [fetchedPhrases],
  )

  const placeholder = useRotatingPlaceholder(phrases)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    setIsLoading(true)
    window.setTimeout(() => {
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
