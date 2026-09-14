import { useId, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '../../../lib/useCopyToClipboard'
import { useTranslation } from '../../../lib/i18n'
import type { CodeSample } from '../../../data/ai/quickstart'

interface CodeSampleTabsProps {
  samples: readonly CodeSample[]
  /** Rendered above the tabs; usually says what the snippet does. */
  caption?: string
  className?: string
}

/**
 * Tabbed code samples with a copy button.
 *
 * Implemented as a real tab list rather than a styled radio group so a keyboard
 * user gets arrow-key movement and a screen reader is told which panel is
 * showing. Every panel is in the DOM and the inactive ones are `hidden` rather
 * than unmounted, so switching language is instant and a browser's find-in-page
 * can reach a snippet the reader has not selected.
 */
export default function CodeSampleTabs({ samples, caption, className = '' }: CodeSampleTabsProps) {
  const { t } = useTranslation()
  const [active, setActive] = useState(samples[0]?.key ?? '')
  const { copied, copy } = useCopyToClipboard()
  const baseId = useId()

  if (samples.length === 0) return null
  const activeSample = samples.find((sample) => sample.key === active) ?? samples[0]

  return (
    <figure className={`overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div role="tablist" aria-label={caption ?? t('ai.quickstart.tabsLabel')} className="flex flex-wrap gap-1">
          {samples.map((sample) => {
            const selected = sample.key === activeSample.key
            return (
              <button
                key={sample.key}
                type="button"
                role="tab"
                id={`${baseId}-tab-${sample.key}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${sample.key}`}
                onClick={() => setActive(sample.key)}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm transition-colors ${
                  selected
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {sample.label}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => copy(activeSample.code)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? t('ai.quickstart.copied') : t('ai.quickstart.copy')}
          <span className="sr-only"> {activeSample.label}</span>
        </button>
      </div>
      {samples.map((sample) => (
        <div
          key={sample.key}
          role="tabpanel"
          id={`${baseId}-panel-${sample.key}`}
          aria-labelledby={`${baseId}-tab-${sample.key}`}
          hidden={sample.key !== activeSample.key}
        >
          <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-foreground">
            <code>{sample.code}</code>
          </pre>
        </div>
      ))}
      {caption && (
        <figcaption className="border-t border-border px-4 py-2 text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
