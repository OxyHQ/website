import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, FileText, Lock } from 'lucide-react'
import { useUserActivity, useUserProfile, useNewsroomPosts } from '../../api/hooks'

interface ProfileActivityProps {
  username: string
  userId?: string
}

type TabType = 'posts' | 'comments' | 'likes'

const TABS: Array<{ value: TabType; label: string }> = [
  { value: 'posts', label: 'Articles' },
  { value: 'comments', label: 'Comments' },
  { value: 'likes', label: 'Likes' },
]

interface ActivityItemData {
  _id?: string
  body?: string
  targetType?: string
  targetId?: string
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 30) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (diffDays > 0) return `${diffDays}d`
  if (diffHours > 0) return `${diffHours}h`
  if (diffMinutes > 0) return `${diffMinutes}m`
  return 'now'
}

function CommentItem({ data, createdAt }: { data: unknown; createdAt: string }) {
  const item = data as ActivityItemData
  const preview = (item.body ?? '').slice(0, 200) + ((item.body?.length ?? 0) > 200 ? '...' : '')

  const href = item.targetType && item.targetId
    ? `/${item.targetType === 'newsroom' ? 'newsroom' : 'changelog'}/${item.targetId}`
    : undefined

  const content = (
    <div className="border-b border-border px-1 py-4 transition-colors hover:bg-surface/50">
      <div className="flex items-start gap-3">
        <MessageCircle size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-relaxed text-foreground">{preview || 'No content'}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {item.targetType && <span className="capitalize">{item.targetType}</span>}
            <span>{formatRelativeTime(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )

  if (href) return <Link to={href} className="block">{content}</Link>
  return content
}

function PostItem({ post }: { post: { slug: string; title: string; resume?: string; coverImage?: string; publishedAt: string } }) {
  return (
    <Link to={`/newsroom/${post.slug}`} className="block border-b border-border px-1 py-4 transition-colors hover:bg-surface/50">
      <div className="flex items-start gap-3">
        <FileText size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-foreground">{post.title}</p>
          {post.resume && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.resume}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(post.publishedAt)}</p>
        </div>
        {post.coverImage && (
          <img src={post.coverImage} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
        )}
      </div>
    </Link>
  )
}

export default function ProfileActivity({ username, userId }: ProfileActivityProps) {
  const [activeTab, setActiveTab] = useState<TabType>('posts')
  const { data: profile } = useUserProfile(username)
  const { data: activityData, isLoading: activityLoading } = useUserActivity(username, { type: activeTab === 'posts' ? undefined : activeTab })
  const { data: postsData, isPending: postsLoading } = useNewsroomPosts({ author: userId, limit: 20 })

  if (profile && profile.stats === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Lock size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">This user&apos;s activity is private</p>
      </div>
    )
  }

  const isLoading = activeTab === 'posts' ? postsLoading : activityLoading
  const posts = postsData?.posts ?? []

  return (
    <div>
      {/* Twitter-style underline tabs */}
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

      {/* Content */}
      <div>
        {isLoading ? (
          <div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-b border-border px-1 py-4">
                <div className="flex gap-3">
                  <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-surface" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-surface" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
                    <div className="h-3 w-20 animate-pulse rounded bg-surface" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'posts' ? (
          posts.length > 0 ? (
            <div>
              {posts.map((post) => (
                <PostItem key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No articles yet</p>
          )
        ) : activityData && activityData.items.length > 0 ? (
          <div>
            {activityData.items.map((item, index) => (
              <CommentItem
                key={`${item.type}-${item.createdAt}-${index}`}
                data={item.data}
                createdAt={item.createdAt}
              />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No {activeTab} yet
          </p>
        )}
      </div>
    </div>
  )
}
