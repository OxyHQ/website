import { Link } from 'react-router-dom'
import { Avatar } from '@oxyhq/bloom/avatar'
import { useUserById } from '../../api/hooks'

interface ArticleAuthorsProps {
  userIds: string[]
}

function AuthorChip({ userId }: { userId: string }) {
  const { data: user } = useUserById(userId)

  if (!user) return null

  const displayName = [user.name.first, user.name.last].filter(Boolean).join(' ') || user.username

  return (
    <Link to={`/u/${user.username}`} className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80">
      <Avatar source={user.avatar} size={20} placeholderColor={user.color} />
      <span className="text-sm font-medium text-foreground">{displayName}</span>
    </Link>
  )
}

export default function ArticleAuthors({ userIds }: ArticleAuthorsProps) {
  if (!userIds.length) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {userIds.map((id) => (
        <AuthorChip key={id} userId={id} />
      ))}
    </div>
  )
}
