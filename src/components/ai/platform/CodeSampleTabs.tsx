import { useState } from 'react'
import { Button } from '@oxy.so/bloom/button'
import { CodeLines } from '@oxy.so/bloom/code'
import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine'
import { RiFileCopyLine } from '@oxy.so/bloom/icons/RiFileCopyLine'
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control'
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
 * The switcher is a `SegmentedControl` of `type="tabs"`: picking a language
 * shows the same example a different way rather than setting anything, so it
 * announces as a tab list. Every panel is in the DOM and the inactive ones are
 * `hidden` rather than unmounted, so switching language is instant and a
 * browser's find-in-page can reach a snippet the reader has not selected. A
 * single sample gets no switcher at all.
 */
export default function CodeSampleTabs({ samples, caption, className = '' }: CodeSampleTabsProps) {
  const { t } = useTranslation()
  const [active, setActive] = useState(samples[0]?.key ?? '')
  const { copied, copy } = useCopyToClipboard()

  if (samples.length === 0) return null
  const activeSample = samples.find((sample) => sample.key === active) ?? samples[0]

  return (
    <figure className={`overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        {samples.length > 1 ? (
          <SegmentedControl
            type="tabs"
            size="sm"
            label={caption ?? t('ai.quickstart.tabsLabel')}
            value={activeSample.key}
            onValueChange={setActive}
          >
            {samples.map((sample) => (
              <SegmentedControlItem key={sample.key} value={sample.key}>
                <SegmentedControlItemText>{sample.label}</SegmentedControlItemText>
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        ) : (
          <span className="px-1 text-sm text-muted-foreground">{activeSample.label}</span>
        )}
        <Button
          size="sm"
          tone="neutral"
          appearance="outline"
          leadingIcon={copied ? RiCheckLine : RiFileCopyLine}
          accessibilityLabel={
            copied ? t('ai.quickstart.copied') : `${t('ai.quickstart.copy')} ${activeSample.label}`
          }
          onPress={() => void copy(activeSample.code, t('common.codeCopied'))}
        >
          {copied ? t('ai.quickstart.copied') : t('ai.quickstart.copy')}
        </Button>
      </div>
      {samples.map((sample) => (
        <div
          key={sample.key}
          role={samples.length > 1 ? 'tabpanel' : undefined}
          aria-label={sample.label}
          hidden={sample.key !== activeSample.key}
        >
          <CodeLines
            code={sample.code}
            language={sample.language}
            lineNumbers={false}
            size="md"
            style={{ padding: 16 }}
          />
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
