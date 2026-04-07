import { MessageCircle, Heart, ArrowUpCircle, Lightbulb, Pencil } from 'lucide-react'
import type { UserProfileData } from '../../api/hooks'
import ProfileBadges from './ProfileBadges'

interface ProfileHeaderProps {
  profile: UserProfileData
  isOwnProfile: boolean
  onEditBio?: () => void
}

function StatItem({ icon: Icon, count, label }: { icon: typeof MessageCircle; count: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon size={16} />
      <span className="font-medium text-foreground">{count}</span>
      <span>{label}</span>
    </div>
  )
}

export default function ProfileHeader({ profile, isOwnProfile, onEditBio }: ProfileHeaderProps) {
  const { user, bio, badges, stats } = profile

  const displayName = [user.name.first, user.name.last].filter(Boolean).join(' ') || user.username
  const initial = (user.name.first?.[0] ?? user.username[0] ?? '?').toUpperCase()
  const avatarColor = user.color ?? '#6366f1'

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Avatar */}
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={displayName}
          className="h-24 w-24 rounded-full object-cover ring-2 ring-border"
        />
      ) : (
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white ring-2 ring-border"
          style={{ backgroundColor: avatarColor }}
        >
          {initial}
        </div>
      )}

      {/* Name and username */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
      </div>

      {/* Bio */}
      {bio && (
        <p className="max-w-md text-pretty text-sm text-muted-foreground">{bio}</p>
      )}

      {/* Badges */}
      <ProfileBadges badges={badges} />

      {/* Edit button */}
      {isOwnProfile && onEditBio && (
        <button
          type="button"
          onClick={onEditBio}
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          <Pencil size={14} />
          Edit profile
        </button>
      )}

      {/* Stats */}
      {stats && (
        <div className="flex flex-wrap justify-center gap-4 border-t border-border pt-4 sm:gap-6">
          <StatItem icon={MessageCircle} count={stats.comments} label="comments" />
          <StatItem icon={Heart} count={stats.likes} label="likes" />
          <StatItem icon={ArrowUpCircle} count={stats.votes} label="votes" />
          <StatItem icon={Lightbulb} count={stats.featureRequests} label="ideas" />
        </div>
      )}
    </div>
  )
}
