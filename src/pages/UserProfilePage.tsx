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
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="h-24 w-24 animate-pulse rounded-full bg-surface" />
      <div className="flex flex-col items-center gap-2">
        <div className="h-7 w-40 animate-pulse rounded bg-surface" />
        <div className="h-4 w-24 animate-pulse rounded bg-surface" />
      </div>
      <div className="h-4 w-64 animate-pulse rounded bg-surface" />
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-5 w-20 animate-pulse rounded bg-surface" />
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
          <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
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
