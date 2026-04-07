import { useMemo } from 'react'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '@oxyhq/auth'
import { useComments } from '../../api/hooks'
import type { CommentData } from '../../api/hooks'
import CommentComposer from './CommentComposer'
import CommentThread from './CommentThread'

interface CommentSectionProps {
  targetType: string
  targetId: string
}

export default function CommentSection({ targetType, targetId }: CommentSectionProps) {
  const { isAuthenticated, signIn } = useAuth()
  const { data: comments, isLoading } = useComments(targetType, targetId)

  const { topLevel, repliesByParent } = useMemo(() => {
    const top: CommentData[] = []
    const byParent: Record<string, CommentData[]> = {}

    for (const c of comments ?? []) {
      if (c.parentId === null) {
        top.push(c)
      } else {
        const list = byParent[c.parentId] ?? []
        list.push(c)
        byParent[c.parentId] = list
      }
    }

    return { topLevel: top, repliesByParent: byParent }
  }, [comments])

  const totalCount = comments?.length ?? 0

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">
          {totalCount === 0
            ? 'Comments'
            : `Comments (${totalCount})`}
        </h3>
      </div>

      {/* Composer or sign-in prompt */}
      <div className="mt-4">
        {isAuthenticated ? (
          <CommentComposer targetType={targetType} targetId={targetId} />
        ) : (
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => signIn()}
              className="cursor-pointer font-medium text-primary hover:underline"
            >
              Sign in
            </button>
            {' '}to join the discussion.
          </div>
        )}
      </div>

      {/* Comments list */}
      <div className="mt-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        )}

        {!isLoading && totalCount === 0 && (
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to share your thoughts.
          </p>
        )}

        {topLevel.map((comment) => (
          <CommentThread
            key={comment._id}
            comment={comment}
            replies={repliesByParent[comment._id] ?? []}
            targetType={targetType}
            targetId={targetId}
          />
        ))}
      </div>
    </section>
  )
}
