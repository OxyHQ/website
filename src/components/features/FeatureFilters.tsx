import OptionSelect from '../ui/OptionSelect'
import type { FeatureAppOption } from '../../api/hooks'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
] as const

const SORT_OPTIONS = [
  { value: 'votes', label: 'Most Voted' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
] as const

interface FeatureFiltersProps {
  status: string
  /** `owner/repo` of the selected app, or '' for every app. */
  app: string
  sort: string
  /** Apps on the board, from the same source the server filters against. */
  apps: FeatureAppOption[]
  onChangeStatus: (value: string) => void
  onChangeApp: (value: string) => void
  onChangeSort: (value: string) => void
}

export default function FeatureFilters({
  status,
  app,
  sort,
  apps,
  onChangeStatus,
  onChangeApp,
  onChangeSort,
}: FeatureFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChangeStatus(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              status === opt.value
                ? 'bg-primary-foreground text-background'
                : 'text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <OptionSelect
          size="sm"
          label="Filter by app"
          value={app}
          onValueChange={onChangeApp}
          options={[
            { value: '', label: 'All apps' },
            ...apps.map((option) => ({ value: option.key, label: option.displayName })),
          ]}
        />

        <OptionSelect
          size="sm"
          label="Sort feature requests"
          value={sort}
          onValueChange={onChangeSort}
          options={SORT_OPTIONS}
        />
      </div>
    </div>
  )
}
