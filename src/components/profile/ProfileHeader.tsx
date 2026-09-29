import { useState, useCallback } from 'react'
import { Link } from '../../lib/navigation'
import { RiCalendarLine } from '@oxy.so/bloom/icons/RiCalendarLine'
import { useAuth, useOxy } from '@oxy.so/services/ui/client'
import { getNormalizedUserHandle } from '@oxy.so/core'
import { Avatar } from '@oxy.so/bloom/avatar'
import { Button } from '@oxy.so/bloom/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserProfileData } from '../../api/hooks'
import ProfileBadges from './ProfileBadges'

interface ProfileHeaderProps {
  profile: UserProfileData
  isOwnProfile: boolean
  onEditBio?: () => void
}

function formatJoinedDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default function ProfileHeader({ profile, isOwnProfile, onEditBio }: ProfileHeaderProps) {
  const { user, bio, badges, stats } = profile
  // `name.displayName` is optional in the SDK shape — a federated actor can
  // legitimately have none, so fall back to the normalized handle rather than
  // rendering an empty heading.
  const displayName =
    user.name.displayName?.trim() || getNormalizedUserHandle(user) || user.username
  const displayBio = bio

  return (
    <div>
      {/* Avatar + actions row */}
      <div className="flex items-center justify-between">
        <Avatar source={user.avatar} size={80} placeholderColor={user.color} />
        <div className="flex gap-2">
          {isOwnProfile ? (
            onEditBio && (
              <Button appearance="outline" tone="neutral" onPress={onEditBio}>
                Edit profile
              </Button>
            )
          ) : (
            <FollowButton userId={user._id} />
          )}
        </div>
      </div>

      {/* Name + username */}
      <div className="mt-2">
        <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
        <p className="text-body-md text-muted-foreground">@{user.username}</p>
      </div>

      {/* Bio */}
      {displayBio && (
        <p className="mt-3 text-body-md leading-normal text-foreground">{displayBio}</p>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mt-3">
          <ProfileBadges badges={badges} />
        </div>
      )}

      {/* Joined */}
      <div className="mt-3 flex items-center gap-1.5 text-body-md text-muted-foreground">
        <RiCalendarLine width={16} height={16} fill="currentColor" aria-hidden />
        <span>Joined Oxy{user.createdAt ? ` ${formatJoinedDate(user.createdAt)}` : ''}</span>
      </div>

      {/* Stats row - Twitter style */}
      {stats && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-body-md">
          <Link
            to={`/u/${user.username}/following`}
            className="hover:underline"
          >
            <span className="font-bold text-foreground">{stats.following}</span>{' '}
            <span className="text-muted-foreground">Following</span>
          </Link>
          <Link
            to={`/u/${user.username}/followers`}
            className="hover:underline"
          >
            <span className="font-bold text-foreground">{stats.followers}</span>{' '}
            <span className="text-muted-foreground">Followers</span>
          </Link>
          <span>
            <span className="font-bold text-foreground">{stats.comments}</span>{' '}
            <span className="text-muted-foreground">Comments</span>
          </span>
          <span>
            <span className="font-bold text-foreground">{stats.likes}</span>{' '}
            <span className="text-muted-foreground">Likes</span>
          </span>
          {stats.articles > 0 && (
            <span>
              <span className="font-bold text-foreground">{stats.articles}</span>{' '}
              <span className="text-muted-foreground">Articles</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function FollowButton({ userId }: { userId: string }) {
  const { isAuthenticated, signIn } = useAuth()
  const { oxyServices } = useOxy()
  const queryClient = useQueryClient()
  const [hovering, setHovering] = useState(false)

  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', userId],
    queryFn: () => oxyServices.follows.status(userId),
    enabled: isAuthenticated && !!userId,
  })

  const isFollowing = followStatus?.isFollowing ?? false

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        return oxyServices.follows.unfollow(userId)
      }
      return oxyServices.follows.follow(userId)
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
      <span className="inline-flex" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
        <Button
          appearance={hovering ? 'subtle' : 'outline'}
          tone={hovering ? 'danger' : 'neutral'}
          onPress={handleClick}
          disabled={toggleFollow.isPending}
          style={{ minWidth: 100 }}
        >
          {hovering ? 'Unfollow' : 'Following'}
        </Button>
      </span>
    )
  }

  return (
    <Button
      appearance="solid"
      tone="action"
      onPress={handleClick}
      disabled={toggleFollow.isPending}
      style={{ minWidth: 100 }}
    >
      Follow
    </Button>
  )
}
