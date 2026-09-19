import {
  availabilityTone,
  type Availability,
  type AvailabilityTone,
} from '../../../lib/ai/availability'
import { useTranslation } from '../../../lib/i18n'

/**
 * The one way an availability state is shown.
 *
 * The label is always rendered as text. Colour carries the same information a
 * second time and never on its own — a reader who cannot tell the tones apart
 * still reads "Private preview", which is the whole point of the badge.
 */
const TONE_CLASSES: Record<AvailabilityTone, string> = {
  positive: 'border-success/30 bg-success-subtle text-success-text',
  info: 'border-info/30 bg-info-subtle text-info-text',
  notice: 'border-warning/30 bg-warning-subtle text-warning-text',
  neutral: 'border-border bg-surface text-muted-foreground',
  muted: 'border-border bg-muted text-muted-foreground',
}

interface AvailabilityBadgeProps {
  availability: Availability
  className?: string
}

export default function AvailabilityBadge({ availability, className = '' }: AvailabilityBadgeProps) {
  const { t } = useTranslation()
  const tone = availabilityTone(availability)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {t(`ai.availability.${camel(availability)}`)}
    </span>
  )
}

function camel(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}
