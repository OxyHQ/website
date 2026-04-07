import { useState } from 'react'
import { useCreateFeatureRequest } from '../../api/hooks'

const CATEGORY_OPTIONS = ['General', 'Platform', 'AI', 'Codea', 'API'] as const
const TITLE_MAX_LENGTH = 200

interface FeatureFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initial?: { title: string; description: string; category: string }
}

export default function FeatureForm({ onSuccess, onCancel, initial }: FeatureFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'General')

  const createRequest = useCreateFeatureRequest()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    createRequest.mutate(
      {
        title: trimmedTitle,
        description: description.trim() || undefined,
        category,
      },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
          setCategory('General')
          onSuccess?.()
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="feature-title" className="mb-1.5 block text-sm font-medium text-foreground">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="feature-title"
          type="text"
          required
          maxLength={TITLE_MAX_LENGTH}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A short, descriptive title"
          className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {title.length}/{TITLE_MAX_LENGTH}
        </p>
      </div>

      <div>
        <label htmlFor="feature-description" className="mb-1.5 block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="feature-description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the feature in detail. Markdown supported."
          className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div>
        <label htmlFor="feature-category" className="mb-1.5 block text-sm font-medium text-foreground">
          Category
        </label>
        <select
          id="feature-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {createRequest.isError && (
        <p className="text-sm text-red-400">
          {createRequest.error instanceof Error ? createRequest.error.message : 'Failed to submit request.'}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!title.trim() || createRequest.isPending}
          className="inline-flex items-center justify-center rounded-xl border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {createRequest.isPending ? 'Submitting...' : 'Submit'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
