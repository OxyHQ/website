import { motion, useReducedMotion, type MotionValue } from 'framer-motion'
import { ChatCircle, Repeat, Heart, BookmarkSimple, Export } from '@phosphor-icons/react'
import phoneFrame from '../../assets/mention/phone.png'
import { MENTION_POSTS, type MentionPost } from './data'

function FeedRow({ post }: { post: MentionPost }) {
  return (
    <div className="flex gap-2 border-b border-neutral-100 px-3 py-2.5">
      <img src={post.avatar} alt={post.name} draggable={false} className="size-7 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] text-neutral-500">
          <span className="font-bold text-neutral-900">{post.name}</span> @{post.handle} · {post.time}
        </p>
        {post.text && <p className="mt-0.5 text-[10px] leading-snug text-neutral-800">{post.text}</p>}
        {post.image && <img src={post.image} alt="" draggable={false} className="mt-1.5 aspect-[16/10] w-full rounded-lg object-cover" />}
        <div className="mt-1.5 flex items-center justify-between pr-2 text-neutral-400">
          <ChatCircle className="size-3" />
          <Repeat className="size-3" />
          <Heart className="size-3" />
          <BookmarkSimple className="size-3" />
          <Export className="size-3" />
        </div>
      </div>
    </div>
  )
}

interface MentionPhoneProps {
  className?: string
  /** When provided, the feed scrolls in lock-step with this value (page scroll). */
  feedY?: MotionValue<string>
}

/**
 * iPhone mockup whose screen runs a Mention feed. When `feedY` is supplied the
 * feed is driven by the page scroll; otherwise it auto-scrolls on a loop.
 */
export default function MentionPhone({ className = '', feedY }: MentionPhoneProps) {
  const reduce = useReducedMotion()
  const loop = [...MENTION_POSTS, ...MENTION_POSTS]

  return (
    <div className={`relative w-[268px] ${className}`}>
      <img src={phoneFrame} alt="" draggable={false} className="pointer-events-none relative z-10 w-full select-none" />
      {/* Screen clip — sits under the frame's bezel, above its white screen */}
      <div className="absolute inset-x-[5.5%] top-[5%] bottom-[3.5%] z-0 overflow-hidden rounded-[28px] bg-white">
        <motion.div
          style={feedY ? { y: feedY } : undefined}
          animate={feedY || reduce ? undefined : { y: ['0%', '-50%'] }}
          transition={feedY ? undefined : { duration: 34, ease: 'linear', repeat: Infinity }}
        >
          {loop.map((post, i) => (
            <FeedRow key={`${post.id}-${i}`} post={post} />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
