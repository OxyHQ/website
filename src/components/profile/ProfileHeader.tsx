import { useState, useCallback } from 'react'
import { CalendarDays } from 'lucide-react'
import { useAuth } from '@oxyhq/auth'
import { useWebOxy } from '@oxyhq/auth'
import { Avatar } from '@oxyhq/bloom/avatar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const displayBio = bio || user.bio

  return (
    <div>
      {/* Avatar + actions row */}
      <div className="flex items-center justify-between">
        <Avatar source={user.avatar} size={80} placeholderColor={user.color} />
        <div className="flex gap-2">
          {isOwnProfile ? (
            onEditBio && (
              <button
                type="button"
                onClick={onEditBio}
                className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
              >
                Edit profile
              </button>
            )
          ) : (
            <FollowButton userId={user._id} />
          )}
        </div>
      </div>

      {/* Name + username */}
      <div className="mt-2">
        <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
        <p className="text-[15px] text-muted-foreground">@{user.username}</p>
      </div>

      {/* Bio */}
      {displayBio && (
        <p className="mt-3 text-[15px] leading-normal text-foreground">{displayBio}</p>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mt-3">
          <ProfileBadges badges={badges} />
        </div>
      )}

      {/* Joined */}
      <div className="mt-3 flex items-center gap-1.5 text-[15px] text-muted-foreground">
        <CalendarDays size={16} />
        <span>Joined Oxy</span>
      </div>

      {/* Stats row - Twitter style */}
      {stats && (
        <div className="mt-3 flex gap-4 text-[15px]">
          <span className="hover:underline">
            <span className="font-bold text-foreground">{stats.comments}</span>{' '}
            <span className="text-muted-foreground">Comments</span>
          </span>
          <span className="hover:underline">
            <span className="font-bold text-foreground">{stats.likes}</span>{' '}
            <span className="text-muted-foreground">Likes</span>
          </span>
          <span className="hover:underline">
            <span className="font-bold text-foreground">{stats.votes}</span>{' '}
            <span className="text-muted-foreground">Votes</span>
          </span>
        </div>
      )}
    </div>
  )
}

function FollowButton({ userId }: { userId: string }) {
  const { isAuthenticated, signIn } = useAuth()
  const { oxyServices } = useWebOxy()
  const queryClient = useQueryClient()
  const [hovering, setHovering] = useState(false)

  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', userId],
    queryFn: () => oxyServices.getFollowStatus(userId),
    enabled: isAuthenticated && !!userId,
  })

  const isFollowing = followStatus?.isFollowing ?? false

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        return oxyServices.unfollowUser(userId)
      }
      return oxyServices.followUser(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', userId] })
    },
  })

  const handleClick = useCallback(() => {
    if (!isAuthenticated) {
      signIn()
      return
    }
    toggleFollow.mutate()
  }, [isAuthenticated, signIn, toggleFollow])

  if (isFollowing) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        disabled={toggleFollow.isPending}
        className={`min-w-[100px] rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
          hovering
            ? 'border-red-500/50 bg-red-500/10 text-red-500'
            : 'border-border text-foreground'
        }`}
      >
        {hovering ? 'Unfollow' : 'Following'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={toggleFollow.isPending}
      className="min-w-[100px] rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      Follow
    </button>
  )
}
