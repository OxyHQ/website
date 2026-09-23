import { RiHeartFill } from '@oxy.so/bloom/icons/RiHeartFill'
import { RiHeartLine } from '@oxy.so/bloom/icons/RiHeartLine'
import { useAuth } from '@oxy.so/services/ui/client'
import { useLikes, useToggleLike } from '../../api/hooks'

interface LikeButtonProps {
  targetType: string
  targetId: string
}

export default function LikeButton({ targetType, targetId }: LikeButtonProps) {
  const { isAuthenticated, signIn } = useAuth()
  const { data } = useLikes(targetType, targetId)
  const toggleLike = useToggleLike()

  const count = data?.count ?? 0
  const liked = data?.liked ?? false

  function handleClick() {
    if (!isAuthenticated) {
      signIn()
      return
    }
    toggleLike.mutate({ targetType, targetId })
  }

  return (
    <button
      onClick={handleClick}
      disabled={toggleLike.isPending}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
    >
      <span
        className={`inline-flex transition-colors ${liked ? 'text-tertiary-text' : 'text-muted-foreground'}`}
        aria-hidden="true"
      >
        {liked ? (
          <RiHeartFill width={16} height={16} fill="currentColor" />
        ) : (
          <RiHeartLine width={16} height={16} fill="currentColor" />
        )}
      </span>
      <span className={liked ? 'text-tertiary-text' : 'text-muted-foreground'}>
        {count > 0 ? count : 'Like'}
      </span>
    </button>
  )
}
