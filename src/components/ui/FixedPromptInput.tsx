import { useState, useCallback, useMemo, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import { PromptInput } from '@oxyhq/bloom/prompt-input'
import { usePromptPhrases } from '../../api/hooks'
import {
  subscribeDocumentIntersection,
  getDocumentIntersectionSnapshot,
  getDocumentIntersectionServerSnapshot,
} from './documentIntersectionStore'
import { useRotatingPlaceholder } from './useRotatingPlaceholder'

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

const HIDDEN_PREFIXES = ['/company', '/developers', '/settings', '/help', '/changelog', '/admin', '/dashboard', '/initiative', '/astro']

function slugFromPathname(pathname: string): string {
  const stripped = pathname.replace(/^\/+|\/+$/g, '')
  if (!stripped) return 'home'
  return stripped.split('/')[0]
}

function useDocumentIntersecting(selector: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => subscribeDocumentIntersection(selector, listener),
    [selector],
  )
  const snapshot = useCallback(
    () => getDocumentIntersectionSnapshot(selector),
    [selector],
  )
  return useSyncExternalStore(subscribe, snapshot, getDocumentIntersectionServerSnapshot)
}

export default function FixedPromptInput() {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { pathname } = useLocation()
  const hiddenByRoute = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  const hiddenByFooter = useDocumentIntersecting('footer')
  const hiddenByHero = useDocumentIntersecting('.page-hero')

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
