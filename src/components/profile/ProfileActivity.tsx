import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Lightbulb, Lock } from 'lucide-react'
import { useUserActivity, useUserProfile } from '../../api/hooks'

interface ProfileActivityProps {
  username: string
}

type TabType = 'comment' | 'feature_request'

const TABS: Array<{ value: TabType; label: string; icon: typeof MessageCircle }> = [
  { value: 'comment', label: 'Comments', icon: MessageCircle },
  { value: 'feature_request', label: 'Feature Requests', icon: Lightbulb },
]

interface ActivityItemData {
  _id?: string
  body?: string
  title?: string
  slug?: string
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

  if (diffDays > 30) return date.toLocaleDateString()
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMinutes > 0) return `${diffMinutes}m ago`
  return 'just now'
}

function ActivityItem({ type, data, createdAt }: { type: string; data: unknown; createdAt: string }) {
  const item = data as ActivityItemData
  const isComment = type === 'comment'
  const Icon = isComment ? MessageCircle : Lightbulb

  const preview = isComment
    ? (item.body ?? '').slice(0, 120) + ((item.body?.length ?? 0) > 120 ? '...' : '')
    : item.title ?? ''

  const href = isComment && item.targetType && item.targetId
    ? `/${item.targetType}/${item.targetId}`
    : item.slug
      ? `/feature-requests/${item.slug}`
      : undefined

  const content = (
    <div className="flex gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface">
      <div className="mt-0.5 shrink-0 text-muted-foreground">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{preview || 'No content'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(createdAt)}</p>
      </div>
    </div>
  )

  if (href) {
    return <Link to={href} className="block">{content}</Link>
  }
  return content
}

export default function ProfileActivity({ username }: ProfileActivityProps) {
  const [activeTab, setActiveTab] = useState<TabType>('comment')
  const { data: profile } = useUserProfile(username)
  const { data: activityData, isLoading } = useUserActivity(username, { type: activeTab })

  // If stats are null, activity is private
  if (profile && profile.stats === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Lock size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Activity is private</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab buttons */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity items */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface/50" />
          ))}
        </div>
      ) : activityData && activityData.items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {activityData.items.map((item, index) => (
            <ActivityItem
              key={`${item.type}-${item.createdAt}-${index}`}
              type={item.type}
              data={item.data}
              createdAt={item.createdAt}
            />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No {activeTab === 'comment' ? 'comments' : 'feature requests'} yet
        </p>
      )}
    </div>
  )
}
