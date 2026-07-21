import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@oxyhq/services'
import { getNormalizedUserHandle } from '@oxyhq/core'
import * as Skeleton from '@oxyhq/bloom/skeleton'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import ProfileHeader from '../components/profile/ProfileHeader'
import ProfileActivity from '../components/profile/ProfileActivity'
import ProfileEditForm from '../components/profile/ProfileEditForm'
import { useUserProfile } from '../api/hooks'

function ProfileSkeleton() {
  return (
    <div>
      {/* Avatar + button row */}
      <div className="flex items-center justify-between">
        <Skeleton.Circle size={80} />
        <Skeleton.Pill size={36} style={{ width: 112 }} />
      </div>
      {/* Name */}
      <div className="mt-2 space-y-1.5">
        <Skeleton.Box width={160} height={24} borderRadius={4} />
        <Skeleton.Box width={112} height={16} borderRadius={4} />
      </div>
      {/* Bio */}
      <div className="mt-3 space-y-1.5">
        <Skeleton.Box width="100%" height={16} borderRadius={4} />
        <Skeleton.Box width="66%" height={16} borderRadius={4} />
      </div>
      {/* Joined */}
      <Skeleton.Box width={96} height={16} borderRadius={4} style={{ marginTop: 12 }} />
      {/* Stats */}
      <div className="mt-3 flex gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton.Box key={i} width={80} height={16} borderRadius={4} />
        ))}
      </div>
      {/* Tabs */}
      <div className="mt-5 flex border-b border-border">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 py-3.5">
            <Skeleton.Box width={80} height={16} borderRadius={4} style={{ alignSelf: 'center' }} />
          </div>
        ))}
      </div>
      {/* Activity items */}
      <div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-border px-1 py-4">
            <div className="flex gap-3">
              <Skeleton.Box width={16} height={16} borderRadius={4} />
              <div className="flex-1 space-y-2">
                <Skeleton.Box width="100%" height={16} borderRadius={4} />
                <Skeleton.Box width={96} height={12} borderRadius={4} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileNotFound({ username }: { username: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-4xl font-bold text-foreground">User not found</p>
      <p className="text-sm text-muted-foreground">
        No profile exists for @{username}
      </p>
    </div>
  )
}

export default function UserProfilePage() {
  const { username = '' } = useParams<{ username: string }>()
  const { user: authUser } = useAuth()
  const { data: profile, isLoading, isError } = useUserProfile(username)
  const [isEditing, setIsEditing] = useState(false)

  const isOwnProfile = Boolean(authUser?.username && authUser.username === profile?.user.username)

  // `name.displayName` is optional in the SDK shape the profiles route passes
  // through, so fall back to the normalized handle rather than an empty title.
  const displayName = profile
    ? profile.user.name.displayName?.trim() || getNormalizedUserHandle(profile.user) || username
    : username

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={`${displayName} (@${username})`}
        description={profile?.bio || `View ${displayName}'s profile on Oxy`}
        canonicalPath={`/u/${username}`}
      />
      <Navbar />

      <main className="flex flex-1 flex-col">
        <div className="container">
          <div className="mx-auto max-w-[720px] px-5 py-12 md:px-8">
            {isLoading ? (
              <ProfileSkeleton />
            ) : isError || !profile ? (
              <ProfileNotFound username={username} />
            ) : (
              <div className="flex flex-col gap-8">
                <ProfileHeader
                  profile={profile}
                  isOwnProfile={isOwnProfile}
                  onEditBio={() => setIsEditing(true)}
                />

                {isEditing && isOwnProfile && (
                  <ProfileEditForm
                    currentBio={profile.bio}
                    currentShowActivity={profile.showActivity}
                    onSuccess={() => setIsEditing(false)}
                    onCancel={() => setIsEditing(false)}
                  />
                )}

                <ProfileActivity username={username} userId={profile.user._id} />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
