import { useState } from 'react'
import { Send, X } from 'lucide-react'
import { useCreateComment } from '../../api/hooks'

const MAX_LENGTH = 2000

interface CommentComposerProps {
  targetType: string
  targetId: string
  parentId?: string
  onSuccess?: () => void
  onCancel?: () => void
  autoFocus?: boolean
}

export default function CommentComposer({
  targetType,
  targetId,
  parentId,
  onSuccess,
  onCancel,
  autoFocus = false,
}: CommentComposerProps) {
  const [body, setBody] = useState('')
  const createComment = useCreateComment()

  const trimmed = body.trim()
  const remaining = MAX_LENGTH - trimmed.length
  const canSubmit = trimmed.length > 0 && remaining >= 0 && !createComment.isPending

  function handleSubmit() {
    if (!canSubmit) return
    createComment.mutate(
      { targetType, targetId, body: trimmed, parentId },
      {
        onSuccess: () => {
          setBody('')
          onSuccess?.()
        },
      },
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={parentId ? 'Write a reply...' : 'Join the discussion...'}
        autoFocus={autoFocus}
        rows={parentId ? 2 : 3}
        maxLength={MAX_LENGTH}
        className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${remaining < 100 ? 'text-red-400' : 'text-muted-foreground'}`}
        >
          {remaining.toLocaleString()} characters remaining
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {createComment.isPending ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
