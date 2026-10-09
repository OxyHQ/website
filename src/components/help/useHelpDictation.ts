import { useEffect, useRef, useState } from 'react'

type Recognition = {
  lang: string
  interimResults: boolean
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

/** The AI composer's native mic dictates into the draft; it never submits it. */
export function useHelpDictation(locale: string, onTranscript: (text: string) => void, onError: () => void) {
  const current = useRef<Recognition | null>(null)
  const [listening, setListening] = useState(false)
  useEffect(() => () => {
    if (!current.current) return
    current.current.onresult = null
    current.current.onerror = null
    current.current.onend = null
    current.current.abort()
    current.current = null
  }, [])

  function setActive(active: boolean) {
    if (!active) { current.current?.stop(); return }
    if (current.current) return
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition
    if (!Constructor) { onError(); return }
    const recognition = new Constructor()
    current.current = recognition
    recognition.lang = locale
    recognition.interimResults = false
    recognition.onresult = event => {
      if (current.current !== recognition) return
      const text = Array.from(event.results).slice(event.resultIndex).filter(result => result.isFinal).map(result => result[0].transcript).join(' ').trim()
      if (text) onTranscript(text)
    }
    recognition.onerror = event => { if (event.error !== 'aborted') onError() }
    recognition.onend = () => {
      if (current.current === recognition) current.current = null
      setListening(false)
    }
    try { recognition.start(); setListening(true) } catch {
      current.current = null
      setListening(false)
      onError()
    }
  }

  return { listening, setActive }
}
