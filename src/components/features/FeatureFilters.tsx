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

const CATEGORY_OPTIONS = ['General', 'Platform', 'AI', 'Codea', 'API'] as const

interface FeatureFiltersProps {
  status: string
  category: string
  sort: string
  onChangeStatus: (value: string) => void
  onChangeCategory: (value: string) => void
  onChangeSort: (value: string) => void
}

export default function FeatureFilters({
  status,
  category,
  sort,
  onChangeStatus,
  onChangeCategory,
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
                ? 'bg-primary-foreground text-primary-background'
                : 'text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => onChangeCategory(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onChangeSort(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
