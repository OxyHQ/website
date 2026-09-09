export type ActivityCategory = 'identity' | 'ai' | 'communication' | 'platform'

export const ACTIVITY_CATEGORIES: Array<{
  id: ActivityCategory
  label: string
  color: string
}> = [
  { id: 'identity', label: 'Users', color: 'var(--chart-5)' },
  { id: 'ai', label: 'AI', color: 'var(--chart-2)' },
  { id: 'communication', label: 'Messages', color: 'var(--chart-4)' },
  { id: 'platform', label: 'Platform', color: 'var(--chart-1)' },
]

const CATEGORY_BY_SERVICE: Record<string, ActivityCategory> = {
  accounts: 'identity', auth: 'identity', me: 'identity', profiles: 'identity', users: 'identity',
  ai: 'ai', kaana: 'ai', models: 'ai',
  mail: 'communication', messages: 'communication', notifications: 'communication',
}

export function activityCategory(service?: string): ActivityCategory {
  return CATEGORY_BY_SERVICE[service?.toLowerCase() ?? ''] ?? 'platform'
}

export function activityCategoryColor(service?: string): string {
  const category = activityCategory(service)
  return ACTIVITY_CATEGORIES.find((item) => item.id === category)?.color ?? 'var(--chart-1)'
}
