const PRIORITY_STYLES: Record<string, string> = {
  medium: 'border-warning/30 bg-warning-subtle text-warning-text',
  high: 'border-tertiary/30 bg-tertiary-subtle text-tertiary-text',
  critical: 'border-error/30 bg-error-subtle text-error-text',
}

interface FeaturePriorityBadgeProps {
  /** Tier key, or null when the request has not reached the first tier. */
  priority: string | null
}

/**
 * The priority the vote count has earned, mirroring the label on the GitHub
 * issue. Nothing is rendered below the first tier, which is where most requests
 * sit: a badge on everything would say nothing.
 */
export default function FeaturePriorityBadge({ priority }: FeaturePriorityBadgeProps) {
  if (!priority) return null

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
        PRIORITY_STYLES[priority] ?? 'border-border bg-surface text-muted-foreground'
      }`}
      title="Set automatically from the vote count"
    >
      {priority} priority
    </span>
  )
}
