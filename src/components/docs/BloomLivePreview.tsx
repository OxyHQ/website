import { useEffect, useState, type ComponentType } from 'react'
import { ErrorBoundary } from '@oxyhq/bloom/error-boundary'
import { evaluateSnippet } from './BloomLiveRuntime'

/**
 * Runs the snippet and shows what it renders.
 *
 * Two rules make it usable while someone is typing. The last render that
 * worked stays on screen — half a line of JSX does not compile, and blanking
 * the preview on every keystroke would mean the reader edits against nothing.
 * And a failure is always a message next to that render: a compile error
 * arrives from `evaluateSnippet`, a throw during render is caught by the
 * boundary, and neither reaches the route.
 */

const DEBOUNCE_MS = 300

interface Preview {
  Component: ComponentType
  /**
   * Bumped per successful compile, and used as the boundary's `key`: a
   * boundary that has caught an error does not un-catch it, so the fixed
   * snippet needs a new boundary rather than the old one's children.
   */
  revision: number
}

/** The last compile that finished, and the text it ran on. */
interface Outcome {
  source: string
  error: string | null
}

export interface BloomLivePreviewProps {
  source: string
}

export function BloomLivePreview({ source }: BloomLivePreviewProps) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  // Derived, not stored: an edit that has not been compiled yet is exactly one
  // whose text differs from the text the last outcome came from.
  const compiling = outcome?.source !== source
  const error = outcome?.error ?? null

  // Compiling is asynchronous work driven by state a keystroke changes, which
  // is what an effect is for. The debounce keeps the compiler off the keystroke
  // path, and the cancel flag is what stops a slow compile from overwriting the
  // result of a newer one.
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      void evaluateSnippet(source).then((result) => {
        if (cancelled) return
        setOutcome({ source, error: result.ok ? null : result.message })
        if (result.ok) {
          setPreview((current) => ({
            Component: result.Component,
            revision: (current?.revision ?? 0) + 1,
          }))
        }
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [source])

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>Preview</span>
          {compiling ? <span className="normal-case tracking-normal">Compiling…</span> : null}
        </header>
        <div className="flex min-h-[260px] items-center justify-center p-8">
          {preview ? (
            <ErrorBoundary
              key={preview.revision}
              fallback={({ error: thrown }) => <PreviewMessage tone="error" text={thrown.message} />}
            >
              <preview.Component />
            </ErrorBoundary>
          ) : (
            <PreviewMessage tone="muted" text={error ?? 'Compiling…'} />
          )}
        </div>
      </div>
      {error && preview ? (
        <div className="rounded-2xl border border-error bg-error-subtle px-4 py-3">
          <p className="font-mono text-xs leading-relaxed text-error-text">{error}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Showing the last version that compiled.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function PreviewMessage({ tone, text }: { tone: 'error' | 'muted'; text: string }) {
  return (
    <p
      className={`max-w-lg text-center font-mono text-xs leading-relaxed ${
        tone === 'error' ? 'text-error-text' : 'text-muted-foreground'
      }`}
    >
      {text}
    </p>
  )
}
