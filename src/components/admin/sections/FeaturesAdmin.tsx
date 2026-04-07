import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../api/client'
import type { FeatureRequestData } from '../../../api/hooks'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-zinc-500/10 text-zinc-400',
  under_review: 'bg-blue-500/10 text-blue-500',
  planned: 'bg-indigo-500/10 text-indigo-500',
  in_progress: 'bg-amber-500/10 text-amber-500',
  completed: 'bg-green-500/10 text-green-500',
  declined: 'bg-red-500/10 text-red-500',
}

interface FeatureListResponse {
  items: FeatureRequestData[]
  total: number
  page: number
  pages: number
}

export default function FeaturesAdmin() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isPending } = useQuery({
    queryKey: ['admin-features', statusFilter, currentPage],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20', sort: 'newest' })
      if (statusFilter) params.set('status', statusFilter)
      return apiFetch<FeatureListResponse>(`/features?${params}`)
    },
  })

  const clearCache = useMutation({
    mutationFn: () => apiFetch('/features/cache/clear', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-features'] })
    },
  })

  const statuses = ['open', 'under_review', 'planned', 'in_progress', 'completed', 'declined']

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Feature Board</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.total ?? 0} feature requests from GitHub (oxyhq org)
          </p>
        </div>
        <button
          onClick={() => clearCache.mutate()}
          disabled={clearCache.isPending}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {clearCache.isPending ? 'Clearing...' : 'Clear Cache'}
        </button>
      </div>

      {/* Status tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => { setStatusFilter(''); setCurrentPage(1) }}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            !statusFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          All
        </button>
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setCurrentPage(1) }}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
              statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Feature list */}
      <div className="mt-6 flex flex-col gap-3">
        {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}

        {data?.items.map(feature => (
          <div key={feature.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a
                    href={feature.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {feature.title}
                  </a>
                  <span className={`rounded px-1.5 py-0.5 text-xs capitalize ${STATUS_COLORS[feature.status] ?? ''}`}>
                    {feature.status.replace('_', ' ')}
                  </span>
                  <span className="rounded bg-surface px-1.5 py-0.5 text-xs text-muted-foreground">
                    {feature.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {feature.description || 'No description'}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{feature.repo}</span>
                  <span>#{feature.number}</span>
                  <span>by {feature.author}</span>
                  <span>{feature.totalVotes} votes ({feature.githubReactions} GH + {feature.localVotes} site)</span>
                  <span>{feature.commentCount} comments</span>
                  <span>{new Date(feature.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <a
                href={feature.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View on GitHub
              </a>
            </div>
          </div>
        ))}

        {!isPending && data?.items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No feature requests found.</p>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {data.pages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(data.pages, p + 1))}
            disabled={currentPage >= data.pages}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
