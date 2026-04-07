import { useState } from 'react'
import CommentItem from './CommentItem'
import CommentComposer from './CommentComposer'
import type { CommentData } from '../../api/hooks'

interface CommentThreadProps {
  comment: CommentData
  replies: CommentData[]
  targetType: string
  targetId: string
}

export default function CommentThread({ comment, replies, targetType, targetId }: CommentThreadProps) {
  const [replying, setReplying] = useState(false)

  return (
    <div>
      <CommentItem
        comment={comment}
        onReply={() => setReplying(true)}
        targetType={targetType}
        targetId={targetId}
      />

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-8 border-l border-border pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              targetType={targetType}
              targetId={targetId}
            />
          ))}
        </div>
      )}

      {/* Inline reply composer */}
      {replying && (
        <div className="ml-8 mt-1 pl-4">
          <CommentComposer
            targetType={targetType}
            targetId={targetId}
            parentId={comment._id}
            autoFocus
            onSuccess={() => setReplying(false)}
            onCancel={() => setReplying(false)}
          />
        </div>
      )}
    </div>
  )
}
