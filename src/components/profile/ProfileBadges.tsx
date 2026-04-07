import {
  Rocket,
  MessageCircle,
  MessagesSquare,
  ThumbsUp,
  Lightbulb,
  Bug,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { BADGE_DEFINITIONS, type BadgeDefinition } from '../../data/badges'

const ICON_MAP: Record<string, LucideIcon> = {
  rocket: Rocket,
  'message-circle': MessageCircle,
  'messages-square': MessagesSquare,
  'thumbs-up': ThumbsUp,
  lightbulb: Lightbulb,
  bug: Bug,
  shield: Shield,
}

interface ProfileBadgesProps {
  badges: Array<{ badgeId: string; awardedAt: string }>
}

export default function ProfileBadges({ badges }: ProfileBadgesProps) {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No badges yet</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(({ badgeId, awardedAt }) => {
        const definition: BadgeDefinition | undefined = BADGE_DEFINITIONS[badgeId]
        if (!definition) return null

        const Icon = ICON_MAP[definition.icon]
        if (!Icon) return null

        return (
          <div
            key={`${badgeId}-${awardedAt}`}
            className="group relative flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground"
          >
            <Icon size={14} style={{ color: definition.color }} />
            <span>{definition.name}</span>

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {definition.description}
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
