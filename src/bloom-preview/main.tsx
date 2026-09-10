import { Suspense, createElement, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BloomThemeProvider } from '@oxy.so/bloom/theme'
import { APP_COLOR_NAMES, type AppColorName } from '@oxy.so/bloom/color-presets'
import { ErrorBoundary } from '@oxy.so/bloom/error-boundary'
import { getBloomDemo } from '../content/bloom-demos/registry'
import type { PlaygroundValues } from '../content/bloom-demos/_playground'
import { BloomCodePreview } from './CodePreview'
import '../index.css'

interface PreviewState {
  source?: string
  demo?: string
  values: PlaygroundValues
  preset: AppColorName
  mode: 'light' | 'dark'
}
const hostOrigin = new URL(import.meta.url).origin
function Preview() {
  const [state, setState] = useState<PreviewState>({
    demo: 'Button',
    values: {},
    preset: 'oxy',
    mode: 'light',
  })
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== hostOrigin || window.parent === window)
        return
      const data = event.data
      if (
        !data ||
        data.type !== 'bloom:render' ||
        !APP_COLOR_NAMES.includes(data.preset) ||
        !['light', 'dark'].includes(data.mode)
      )
        return
      if (
        data.source !== undefined &&
        (typeof data.source !== 'string' || data.source.length > 100000)
      )
        return
      if (data.demo !== undefined && (typeof data.demo !== 'string' || !getBloomDemo(data.demo)))
        return
      if (!data.values || typeof data.values !== 'object' || Array.isArray(data.values)) return
      if (
        Object.keys(data.values).length > 100 ||
        Object.values(data.values).some((v) => !['string', 'boolean', 'number'].includes(typeof v))
      )
        return
      setState({
        source: data.source,
        demo: data.demo,
        values: data.values,
        preset: data.preset,
        mode: data.mode,
      })
    }
    window.addEventListener('message', receive)
    window.parent.postMessage({ type: 'bloom:ready' }, hostOrigin)
    return () => window.removeEventListener('message', receive)
  }, [])
  const demo = state.demo ? getBloomDemo(state.demo) : undefined
  return (
    <BloomThemeProvider mode={state.mode} colorPreset={state.preset}>
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <ErrorBoundary
          key={state.demo ?? 'code'}
          fallback={({ error }) => (
            <p role="alert" className="p-6 text-error-text">
              {error.message}
            </p>
          )}
        >
          {state.source !== undefined ? (
            <BloomCodePreview source={state.source} />
          ) : demo ? (
            <Suspense fallback={<p>Loading component…</p>}>
              {demo.Playground
                ? createElement(demo.Playground, { values: state.values })
                : createElement(demo.Component)}
            </Suspense>
          ) : (
            <p>Choose a component.</p>
          )}
        </ErrorBoundary>
      </div>
    </BloomThemeProvider>
  )
}
createRoot(document.getElementById('root')!).render(<Preview />)
