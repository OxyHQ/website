import { SealCheck } from '@phosphor-icons/react'
import type { MentionProfile } from './data'

interface MentionProfileCardProps {
  profile: MentionProfile
  className?: string
}

/** Floating profile preview used in the "your unique link" section. */
export default function MentionProfileCard({ profile, className = '' }: MentionProfileCardProps) {
  return (
    <article className={`relative w-[270px] rounded-2xl bg-surface p-4 text-left shadow-[0_22px_60px_-22px_rgba(20,40,90,0.5)] ring-1 ring-border ${className}`}>
      <button
        type="button"
        className="absolute right-3 top-3 rounded-full bg-foreground px-3.5 py-1 text-xs font-semibold text-background"
      >
        Follow
      </button>
      <img src={profile.avatar} alt={profile.name} draggable={false} className="size-12 rounded-full object-cover" />
      <div className="mt-2 flex items-center gap-1">
        <h4 className="text-[15px] font-bold text-foreground">{profile.name}</h4>
        <SealCheck weight="fill" className="size-4 text-sky-500" />
      </div>
      <p className="text-[13px] text-muted-foreground">@{profile.handle}</p>
      <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">{profile.bio}</p>
      <div className="mt-2.5 flex gap-4 text-[12px] text-muted-foreground">
        <span><span className="font-bold text-foreground">{profile.following}</span> Following</span>
        <span><span className="font-bold text-foreground">{profile.followers}</span> Followers</span>
      </div>
    </article>
  )
}
