const STATUS_STYLES: Record<string, string> = {
  open: 'border-border bg-muted text-muted-foreground',
  under_review: 'border-info/30 bg-info-subtle text-info-text',
  planned: 'border-primary/30 bg-primary-subtle text-primary-text',
  in_progress: 'border-warning/30 bg-warning-subtle text-warning-text',
  completed: 'border-success/30 bg-success-subtle text-success-text',
  declined: 'border-error/30 bg-error-subtle text-error-text',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
}

interface FeatureStatusBadgeProps {
  status: string
}

export default function FeatureStatusBadge({ status }: FeatureStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.open
  const label = STATUS_LABELS[status] ?? status

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
