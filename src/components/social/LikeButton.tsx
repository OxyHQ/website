import { Heart } from 'lucide-react'
import { useAuth } from '@oxyhq/auth'
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
      <Heart
        className={`h-4 w-4 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
      />
      <span className={liked ? 'text-red-500' : 'text-muted-foreground'}>
        {count > 0 ? count : 'Like'}
      </span>
    </button>
  )
}
