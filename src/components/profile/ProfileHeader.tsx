import { Pencil } from 'lucide-react'
import { Avatar } from '@oxyhq/bloom/avatar'
import type { UserProfileData } from '../../api/hooks'
import ProfileBadges from './ProfileBadges'

interface ProfileHeaderProps {
  profile: UserProfileData
  isOwnProfile: boolean
  onEditBio?: () => void
}

export default function ProfileHeader({ profile, isOwnProfile, onEditBio }: ProfileHeaderProps) {
  const { user, bio, badges, stats } = profile
  const displayName = [user.name.first, user.name.last].filter(Boolean).join(' ') || user.username

  return (
    <div>
      {/* Avatar + name row */}
      <div className="flex items-center gap-4">
        <Avatar source={user.avatar} size={64} placeholderColor={user.color} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
        {isOwnProfile && onEditBio && (
          <button
            type="button"
            onClick={onEditBio}
            className="shrink-0 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            <Pencil size={14} className="mr-1.5 inline" />
            Edit
          </button>
        )}
      </div>

      {/* Bio */}
      {bio && (
        <p className="mt-4 text-[15px] leading-relaxed text-secondary-foreground">{bio}</p>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mt-4">
          <ProfileBadges badges={badges} />
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mt-5 flex gap-5 border-t border-border pt-5 text-sm">
          <StatBlock count={stats.comments} label="Comments" />
          <StatBlock count={stats.likes} label="Likes" />
          <StatBlock count={stats.votes} label="Votes" />
        </div>
      )}
    </div>
  )
}

function StatBlock({ count, label }: { count: number; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-foreground">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
