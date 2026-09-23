import { useState } from 'react'
import { Link } from '../../lib/navigation'
import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine'
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine'
import { RiDeleteBinLine } from '@oxy.so/bloom/icons/RiDeleteBinLine'
import { RiEyeLine } from '@oxy.so/bloom/icons/RiEyeLine'
import { RiEyeOffLine } from '@oxy.so/bloom/icons/RiEyeOffLine'
import { RiMessage2Line } from '@oxy.so/bloom/icons/RiMessage2Line'
import { RiPencilLine } from '@oxy.so/bloom/icons/RiPencilLine'
import { useAuth } from '@oxy.so/services/ui/client'
import { useEditComment, useDeleteComment, useModerateComment } from '../../api/hooks'
import { useAdminAccess } from '../../hooks/useAdminAccess'
import type { CommentData } from '../../api/hooks'

const EDIT_WINDOW_MS = 15 * 60 * 1000

interface CommentItemProps {
  comment: CommentData
  onReply?: () => void
  targetType: string
  targetId: string
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function avatarInitial(username: string): string {
  return (username[0] ?? '?').toUpperCase()
}

export default function CommentItem({ comment, onReply, targetType, targetId }: CommentItemProps) {
  const { user } = useAuth()
  const editComment = useEditComment()
  const deleteComment = useDeleteComment()
  const moderateComment = useModerateComment()

  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isOwn = user?._id === comment.userId
  // Server-decided, like everywhere else. This only reveals the moderation
  // controls; `server/routes/comments.ts` re-checks before acting on them.
  const { isAdmin } = useAdminAccess()
  // Captured once at mount: whether the 15-minute edit window is still open.
  // Reading `Date.now()` directly in render is impure (unstable across
  // re-renders); a lazy initializer freezes it to the value the first render
  // would have produced.
  const [withinEditWindow] = useState(
    () => Date.now() - new Date(comment.createdAt).getTime() < EDIT_WINDOW_MS,
  )
  const canEdit = isOwn && withinEditWindow
  const canDelete = isOwn
  const isHidden = comment.status === 'hidden'

  function handleSaveEdit() {
    const trimmed = editBody.trim()
    if (!trimmed || trimmed === comment.body) {
      setEditing(false)
      return
    }
    editComment.mutate(
      { id: comment._id, body: trimmed, targetType, targetId },
      { onSuccess: () => setEditing(false) },
    )
  }

  function handleDelete() {
    deleteComment.mutate(
      { id: comment._id, targetType, targetId },
      { onSuccess: () => setConfirmDelete(false) },
    )
  }

  function handleModerate(status: string) {
    moderateComment.mutate({ id: comment._id, status, targetType, targetId })
  }

  if (comment.status === 'deleted') {
    return (
      <div className="flex gap-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-muted-foreground">
          ?
        </div>
        <div className="text-sm italic text-muted-foreground">This comment has been deleted.</div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 py-3 ${isHidden && !isAdmin ? 'hidden' : ''}`}>
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
        {avatarInitial(comment.username)}
      </div>

      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            to={`/u/${comment.username}`}
            className="font-medium text-foreground hover:underline"
          >
            @{comment.username}
          </Link>
          <span className="text-xs text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
          {comment.editedAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          {isHidden && isAdmin && (
            <span className="rounded bg-error-subtle px-1.5 py-0.5 text-xs text-error-text">
              hidden
            </span>
          )}
        </div>

        {/* Body or Edit Mode */}
        {editing ? (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={2}
              maxLength={2000}
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editComment.isPending}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <RiCheckLine width={12} height={12} fill="currentColor" aria-hidden />
                Save
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditBody(comment.body) }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RiCloseLine width={12} height={12} fill="currentColor" aria-hidden />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {comment.body}
          </p>
        )}

        {/* Actions */}
        {!editing && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {onReply && (
              <button
                type="button"
                onClick={onReply}
                className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <RiMessage2Line width={14} height={14} fill="currentColor" aria-hidden />
                Reply
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => { setEditing(true); setEditBody(comment.body) }}
                className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <RiPencilLine width={14} height={14} fill="currentColor" aria-hidden />
                Edit
              </button>
            )}
            {canDelete && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-error-text"
              >
                <RiDeleteBinLine width={14} height={14} fill="currentColor" aria-hidden />
                Delete
              </button>
            )}
            {confirmDelete && (
              <span className="inline-flex items-center gap-2 text-xs">
                <span className="text-error-text">Delete this comment?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteComment.isPending}
                  className="cursor-pointer font-medium text-error-text hover:opacity-80 disabled:opacity-50"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  No
                </button>
              </span>
            )}
            {isAdmin && !isHidden && (
              <button
                type="button"
                onClick={() => handleModerate('hidden')}
                disabled={moderateComment.isPending}
                className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-warning-text disabled:opacity-50"
              >
                <RiEyeOffLine width={14} height={14} fill="currentColor" aria-hidden />
                Hide
              </button>
            )}
            {isAdmin && isHidden && (
              <button
                type="button"
                onClick={() => handleModerate('visible')}
                disabled={moderateComment.isPending}
                className="inline-flex cursor-pointer items-center gap-1 text-xs text-warning-text transition-colors hover:text-foreground disabled:opacity-50"
              >
                <RiEyeLine width={14} height={14} fill="currentColor" aria-hidden />
                Unhide
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
