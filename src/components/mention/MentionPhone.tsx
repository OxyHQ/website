import { motion, useReducedMotion } from 'framer-motion'
import { RiChat1Line } from '@oxy.so/bloom/icons/RiChat1Line'
import { RiRepeatLine } from '@oxy.so/bloom/icons/RiRepeatLine'
import { RiHeartLine } from '@oxy.so/bloom/icons/RiHeartLine'
import { RiBookmarkLine } from '@oxy.so/bloom/icons/RiBookmarkLine'
import { RiShareBoxLine } from '@oxy.so/bloom/icons/RiShareBoxLine'
import phoneFrame from '../../assets/mention/phone.png'
import { MENTION_POSTS, type MentionPost } from './data'

/** Two laps so the auto-scroll loops seamlessly. */
const FEED_LOOP = [...MENTION_POSTS, ...MENTION_POSTS]

function FeedRow({ post }: { post: MentionPost }) {
  return (
    <div className="flex gap-2 border-b border-neutral-100 px-3 py-2.5">
      <img src={post.avatar} alt={post.name} draggable={false} className="size-7 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] text-muted-foreground">
          <span className="font-bold text-foreground">{post.name}</span> @{post.handle} · {post.time}
        </p>
        {post.text && <p className="mt-0.5 text-[10px] leading-snug text-foreground">{post.text}</p>}
        {post.image && <img src={post.image} alt="" draggable={false} className="mt-1.5 aspect-[16/10] w-full rounded-lg object-cover" />}
        <div className="mt-1.5 flex items-center justify-between pr-2 text-neutral-400">
          <RiChat1Line width={12} height={12} fill="currentColor" />
          <RiRepeatLine width={12} height={12} fill="currentColor" />
          <RiHeartLine width={12} height={12} fill="currentColor" />
          <RiBookmarkLine width={12} height={12} fill="currentColor" />
          <RiShareBoxLine width={12} height={12} fill="currentColor" />
        </div>
      </div>
    </div>
  )
}

/** iPhone mockup whose screen auto-scrolls a Mention feed (reduced-motion fallback). */
export default function MentionPhone() {
  const reduce = useReducedMotion()
  return (
    <div className="relative w-[268px]">
      <img src={phoneFrame} alt="" draggable={false} className="pointer-events-none relative z-10 w-full select-none" />
      {/* Screen clip — sits under the frame's bezel, above its white screen */}
      <div className="absolute inset-x-[5.5%] top-[5%] bottom-[3.5%] z-0 overflow-hidden rounded-[28px] bg-card">
        <motion.div
          animate={reduce ? undefined : { y: ['0%', '-50%'] }}
          transition={reduce ? undefined : { duration: 34, ease: 'linear', repeat: Infinity }}
        >
          {FEED_LOOP.map((post, i) => (
            <FeedRow key={`${post.id}-${i}`} post={post} />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
