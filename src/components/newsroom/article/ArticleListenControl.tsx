import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from '@phosphor-icons/react'
import { articleSpeechText, estimatedSpeechDuration } from './articleSpeech'

type SpeechState = 'idle' | 'playing' | 'paused'

/** Browser-native narration; unsupported browsers keep the anatomy visible but disabled. */
export default function ArticleListenControl({
  title,
  resume,
  content,
  locale,
}: {
  title: string
  resume: string
  content: string
  locale: string
}) {
  const text = useMemo(() => articleSpeechText(title, resume, content), [content, resume, title])
  const duration = useMemo(() => estimatedSpeechDuration(text), [text])
  const supported = typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window
  const [state, setState] = useState<SpeechState>('idle')
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
      utteranceRef.current = null
    }
  }, [supported])

  const toggle = () => {
    if (!supported) return
    if (state === 'playing') {
      window.speechSynthesis.pause()
      setState('paused')
      return
    }
    if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale
    utterance.onend = () => setState('idle')
    utterance.onerror = () => setState('idle')
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setState('playing')
  }

  const active = state !== 'idle'
  return (
    <div className="flex min-w-0 items-center gap-3 text-body-sm text-foreground">
      <button
        type="button"
        onClick={toggle}
        disabled={!supported}
        aria-label={!supported ? 'Listen to article is unavailable in this browser' : state === 'playing' ? 'Pause article' : state === 'paused' ? 'Resume article' : 'Listen to article'}
        aria-pressed={active}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45"
      >
        {state === 'playing' ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
      </button>
      <span className="whitespace-nowrap">{state === 'paused' ? 'Resume article' : state === 'playing' ? 'Pause article' : 'Listen to article'}</span>
      <span aria-hidden className="h-5 w-px bg-border" />
      <span className="tabular-nums text-muted-foreground">{duration}</span>
    </div>
  )
}
