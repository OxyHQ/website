const STATUS_STYLES: Record<string, string> = {
  open: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
  under_review: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  planned: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  in_progress: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  completed: 'border-green-500/30 bg-green-500/10 text-green-400',
  declined: 'border-red-500/30 bg-red-500/10 text-red-400',
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
