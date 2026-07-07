import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useOxy } from '@oxyhq/services'
import type { User } from '@oxyhq/core'
import { Avatar } from '@oxyhq/bloom/avatar'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import { useUserProfile } from '../api/hooks'

type TabType = 'followers' | 'following'

interface UserFollowersPageProps {
  initialTab: TabType
}

const TABS: Array<{ value: TabType; label: string }> = [
  { value: 'followers', label: 'Followers' },
  { value: 'following', label: 'Following' },
]

function UserRow({ user }: { user: User }) {
  const displayName = user.name.displayName
  return (
    <Link
      to={`/u/${user.username}`}
      className="block border-b border-border px-1 py-4 transition-colors hover:bg-surface/50"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <Avatar source={user.avatar ?? undefined} size={48} variant="thumb" placeholderColor={user.color ?? undefined} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-foreground">{displayName}</p>
          <p className="truncate text-[15px] text-muted-foreground">@{user.username}</p>
          {user.bio && (
            <p className="mt-1 text-[15px] text-foreground line-clamp-2">{user.bio}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

function ListSkeleton() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="border-b border-border px-1 py-4">
          <div className="flex gap-3">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-surface" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-surface" />
              <div className="h-4 w-24 animate-pulse rounded bg-surface" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function UserFollowersPage({ initialTab }: UserFollowersPageProps) {
  const { username = '' } = useParams<{ username: string }>()
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const { oxyServices } = useOxy()
  const { data: profile } = useUserProfile(username)
  const userId = profile?.user._id
  const canViewFollowList = Boolean(userId && profile?.stats)

  const { data, isLoading } = useQuery({
    queryKey: ['user-follow-list', userId, activeTab, canViewFollowList],
    queryFn: async () => {
      if (!userId || !canViewFollowList) return { users: [] as User[], total: 0 }
      if (activeTab === 'followers') {
        const res = await oxyServices.getUserFollowers(userId, { limit: 50 })
        return { users: res.followers, total: res.total }
      }
      const res = await oxyServices.getUserFollowing(userId, { limit: 50 })
      return { users: res.following, total: res.total }
    },
    enabled: canViewFollowList,
    staleTime: 60_000,
  })

  const displayName = profile ? profile.user.name.displayName : username
  const isActivityPrivate = Boolean(profile && !profile.stats)

  const tabLabel = activeTab === 'followers' ? 'Followers' : 'Following'
  const users = data?.users ?? []

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={`${tabLabel} · ${displayName} (@${username})`}
        description={`${tabLabel} of ${displayName} on Oxy`}
        canonicalPath={`/u/${username}/${activeTab}`}
      />
      <Navbar />

      <main className="flex flex-1 flex-col">
        <div className="container">
          <div className="mx-auto max-w-[720px] px-5 py-12 md:px-8">
            {/* Owner header */}
            <Link to={`/u/${username}`} className="mb-5 flex items-center gap-3">
              {profile && (
                <div className="shrink-0">
                  <Avatar
                    source={profile.user.avatar}
                    size={40}
                    variant="thumb"
                    placeholderColor={profile.user.color}
                  />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-foreground">{displayName}</h1>
                <p className="truncate text-[13px] text-muted-foreground">@{username}</p>
              </div>
            </Link>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className="relative flex-1 py-3.5 text-center text-sm font-medium transition-colors hover:bg-surface/50"
                >
                  <span className={activeTab === tab.value ? 'text-foreground' : 'text-muted-foreground'}>
                    {tab.label}
                  </span>
                  {activeTab === tab.value && (
                    <div className="absolute bottom-0 left-1/2 h-[3px] w-14 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            {isActivityPrivate ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                @{username} does not share activity publicly.
              </p>
            ) : isLoading ? (
              <ListSkeleton />
            ) : users.length > 0 ? (
              <div>
                {users.map((u) => (
                  <UserRow key={u.id ?? u.username} user={u} />
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No {activeTab} yet
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
