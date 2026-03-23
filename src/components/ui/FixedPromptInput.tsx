import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PromptInput } from '@oxyhq/bloom/prompt-input'

const PHRASES = [
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

function useRotatingPlaceholder() {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    const phrase = PHRASES[phraseIndex]
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
          setPhraseIndex((prev) => (prev + 1) % PHRASES.length)
          return
        }
      }
      timer = window.setTimeout(tick, erasing ? 30 : TYPING_SPEED)
    }

    timer = window.setTimeout(tick, PAUSE_AFTER_ERASED)
    return () => clearTimeout(timer)
  }, [phraseIndex])

  return text
}

export default function FixedPromptInput() {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hidden, setHidden] = useState(false)
  const placeholder = useRotatingPlaceholder()

  // Hide on certain paths
  const { pathname } = useLocation()
  const HIDDEN_PREFIXES = ['/company', '/developers', '/settings', '/help', '/changelog', '/admin']
  const hiddenByRoute = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  // Hide when footer is in view so we don't overlay it
  useEffect(() => {
    // Small delay so the new page's footer is in the DOM
    const t = setTimeout(() => {
      const footer = document.querySelector('footer')
      if (!footer) return
      const observer = new IntersectionObserver(
        ([entry]) => setHidden(entry.isIntersecting),
        { threshold: 0 },
      )
      observer.observe(footer)
      return () => observer.disconnect()
    }, 100)
    return () => clearTimeout(t)
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
    <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5 transition-all duration-300 ${hidden || hiddenByRoute ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
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
