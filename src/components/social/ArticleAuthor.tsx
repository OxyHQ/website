import { Link } from 'react-router-dom'
import { Avatar } from '@oxyhq/bloom/avatar'
import { useUserById } from '../../api/hooks'

interface ArticleAuthorsProps {
  userIds: string[]
}

function AuthorChip({ userId }: { userId: string }) {
  const { data: user } = useUserById(userId)

  if (!user) return null

  const displayName = user.name.displayName

  return (
    <Link to={`/u/${user.username}`} className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80">
      <Avatar source={user.avatar} size={20} variant="thumb" placeholderColor={user.color} />
      <span className="text-sm font-medium text-foreground">{displayName}</span>
    </Link>
  )
}

// Each AuthorChip fetches one user independently. A future POST /users/by-ids
// batch route with a service token would consolidate N calls into one here.
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
