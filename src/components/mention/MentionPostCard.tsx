import { ChatCircle, Repeat, Heart, BookmarkSimple, Export, DotsThree } from '@phosphor-icons/react'
import type { MentionPost } from './data'

interface MentionPostCardProps {
  post: MentionPost
  className?: string
  /**
   * Feed mode — flat row with a divider and no card chrome, themed to the app
   * (so the phone feed follows light/dark mode). Otherwise a white floating
   * card on the sky. Same content size either way.
   */
  flat?: boolean
}

/**
 * A single Mention post — compact avatar, name/@handle/time, body copy, an
 * optional media tile and the engagement actions.
 */
export default function MentionPostCard({ post, className = '', flat = false }: MentionPostCardProps) {
  // Both modes follow the theme, and the floating hero card uses the same
  // surface as the in-phone feed (black in dark mode). The ring + shadow keep
  // it legible on the sky.
  const chrome = flat
    ? 'border-b border-border'
    : 'rounded-xl shadow-[0_14px_40px_-18px_rgba(20,40,90,0.45)] ring-1 ring-border'

  return (
    <article className={`w-[300px] bg-background px-3 py-2 text-left ${chrome} ${className}`}>
      <header className="flex items-center gap-1.5">
        <img src={post.avatar} alt={post.name} draggable={false} className="size-6 shrink-0 rounded-full object-cover" />
        <p className="min-w-0 flex-1 truncate text-[9px] leading-tight text-muted-foreground">
          <span className="font-bold text-foreground">{post.name}</span> <span>@{post.handle}</span> · {post.time}
        </p>
        <DotsThree weight="bold" className="size-3.5 shrink-0 text-muted-foreground" />
      </header>

      {post.text && <p className="mt-0.5 text-[9px] leading-snug text-foreground">{post.text}</p>}

      {post.image && (
        <img src={post.image} alt="" draggable={false} className="mt-1.5 aspect-[2/1] w-full rounded-md object-cover" />
      )}

      <div className="mt-1.5 flex items-center justify-between px-1 text-muted-foreground">
        <ChatCircle className="size-3" />
        <Repeat className="size-3" />
        <Heart className="size-3" />
        <BookmarkSimple className="size-3" />
        <Export className="size-3" />
      </div>
    </article>
  )
}
