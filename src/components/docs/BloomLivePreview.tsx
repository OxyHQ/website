import { useEffect, useRef, useState } from 'react'
import type { AppColorName } from '@oxy.so/bloom/color-presets'
import type { PlaygroundValues } from '../../content/bloom-demos/_playground'

export interface BloomLivePreviewProps {
  source?: string
  demo?: string
  values?: PlaygroundValues
  preset?: AppColorName
  mode?: 'light' | 'dark'
}

/** Opaque-origin iframe: snippets never execute in the signed-in site. */
export function BloomLivePreview({
  source,
  demo,
  values = {},
  preset = 'oxy',
  mode = 'light',
}: BloomLivePreviewProps) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source === frame.current?.contentWindow &&
        event.origin === 'null' &&
        event.data?.type === 'bloom:ready'
      )
        setReady(true)
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [])
  useEffect(() => {
    if (ready)
      frame.current?.contentWindow?.postMessage(
        { type: 'bloom:render', source, demo, values, preset, mode },
        '*',
      )
  }, [ready, source, demo, values, preset, mode])
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-background">
      {!ready && (
        <p role="status" className="absolute inset-x-0 top-4 text-center text-sm">
          Loading preview…
        </p>
      )}
      <iframe
        ref={frame}
        title="Interactive Bloom preview"
        src="/bloom-preview.html"
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        className="block h-[480px] w-full border-0"
      />
    </div>
  )
}
