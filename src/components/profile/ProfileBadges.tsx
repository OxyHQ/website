import { useId, useState } from 'react'
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
import { Chip, resolveChipHueColors, type ChipHue } from '@oxy.so/bloom/chip'
import { useTheme } from '@oxy.so/bloom/theme'
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '@oxy.so/bloom/tooltip'
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

/**
 * The badge definitions carry a hex colour for the admin catalogue; on the
 * public profile each badge takes the Bloom data hue nearest to it instead, so
 * the pill follows the theme (the team badge's black vanished in dark mode).
 */
const HUE_MAP: Record<string, ChipHue> = {
  early_adopter: 'yellow',
  first_comment: 'blue',
  prolific_commenter: 'purple',
  top_voter: 'lime',
  bug_hunter: 'rose',
  team_member: 'gray',
}

interface ProfileBadgesProps {
  badges: Array<{ badgeId: string; awardedAt: string }>
}

function BadgePill({ badgeId, definition, Icon }: { badgeId: string; definition: BadgeDefinition; Icon: LucideIcon }) {
  const theme = useTheme()
  const descriptionId = useId()
  const [visible, setVisible] = useState(false)
  const hue = HUE_MAP[badgeId] ?? 'neutral'
  const show = () => setVisible(true)
  const hide = () => setVisible(false)

  return (
    <Tooltip visible={visible} onVisibleChange={setVisible} position="top">
      <TooltipTrigger>
        {/* The pill is static, so this wrapper is what makes the description
         * reachable by keyboard and announces it without the bubble. */}
        <span
          tabIndex={0}
          aria-describedby={descriptionId}
          onMouseEnter={show}
          onMouseLeave={hide}
          onFocus={show}
          onBlur={hide}
          className="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Chip
            size="large"
            hue={hue}
            startIcon={<Icon aria-hidden size={14} color={resolveChipHueColors(theme, hue).foreground} />}
          >
            {definition.name}
          </Chip>
          <span id={descriptionId} className="sr-only">{definition.description}</span>
        </span>
      </TooltipTrigger>
      <TooltipTextBubble>{definition.description}</TooltipTextBubble>
    </Tooltip>
  )
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

        return <BadgePill key={`${badgeId}-${awardedAt}`} badgeId={badgeId} definition={definition} Icon={Icon} />
      })}
    </div>
  )
}
