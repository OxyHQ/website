import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
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
      {/* Avatar + name row */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-surface" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-36 animate-pulse rounded bg-surface" />
          <div className="h-4 w-24 animate-pulse rounded bg-surface" />
        </div>
      </div>
      {/* Bio */}
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-surface" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
      </div>
      {/* Stats */}
      <div className="mt-5 flex gap-5 border-t border-border pt-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-6 w-8 animate-pulse rounded bg-surface" />
            <div className="h-3 w-14 animate-pulse rounded bg-surface" />
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

  const displayName = profile
    ? [profile.user.name.first, profile.user.name.last].filter(Boolean).join(' ') || profile.user.username
    : username

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={`${displayName} (@${username})`}
        description={profile?.bio || `View ${displayName}'s profile on Oxy`}
        canonicalPath={`/u/${username}`}
      />
      <Navbar />

      <main className="flex flex-1 flex-col pt-[var(--site-header-height)]">
        <div className="container border-x border-border">
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

                <ProfileActivity username={username} />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
