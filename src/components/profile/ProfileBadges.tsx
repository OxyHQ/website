import { useId, useState } from 'react'
import type { BloomIconComponent } from '@oxy.so/bloom/icons'
import { RiBugLine } from '@oxy.so/bloom/icons/RiBugLine'
import { RiChat3Line } from '@oxy.so/bloom/icons/RiChat3Line'
import { RiDiscussLine } from '@oxy.so/bloom/icons/RiDiscussLine'
import { RiLightbulbLine } from '@oxy.so/bloom/icons/RiLightbulbLine'
import { RiRocket2Line } from '@oxy.so/bloom/icons/RiRocket2Line'
import { RiShieldLine } from '@oxy.so/bloom/icons/RiShieldLine'
import { RiThumbUpLine } from '@oxy.so/bloom/icons/RiThumbUpLine'
import { Chip, resolveChipHueColors, type ChipHue } from '@oxy.so/bloom/chip'
import { useTheme } from '@oxy.so/bloom/theme'
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '@oxy.so/bloom/tooltip'
import { BADGE_DEFINITIONS, type BadgeDefinition } from '../../data/badges'

const ICON_MAP: Record<string, BloomIconComponent> = {
  rocket: RiRocket2Line,
  'message-circle': RiChat3Line,
  'messages-square': RiDiscussLine,
  'thumbs-up': RiThumbUpLine,
  lightbulb: RiLightbulbLine,
  bug: RiBugLine,
  shield: RiShieldLine,
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

function BadgePill({ badgeId, definition, Icon }: { badgeId: string; definition: BadgeDefinition; Icon: BloomIconComponent }) {
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
            startIcon={<Icon width={14} height={14} fill={resolveChipHueColors(theme, hue).foreground} />}
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
