export interface BadgeDefinition {
  name: string
  description: string
  icon: string
  color: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  early_adopter: {
    name: 'Early Adopter',
    description: 'Joined the community in its early days',
    icon: 'rocket',
    color: '#FF6B35',
    rarity: 'rare',
  },
  first_comment: {
    name: 'First Comment',
    description: 'Posted their first comment',
    icon: 'message-circle',
    color: '#4285F4',
    rarity: 'common',
  },
  prolific_commenter: {
    name: 'Prolific Commenter',
    description: 'Posted 50+ comments',
    icon: 'messages-square',
    color: '#9C27B0',
    rarity: 'uncommon',
  },
  top_voter: {
    name: 'Top Voter',
    description: 'Voted on 25+ feature requests',
    icon: 'thumbs-up',
    color: '#34A853',
    rarity: 'uncommon',
  },
  idea_machine: {
    name: 'Idea Machine',
    description: 'Submitted 10+ feature requests',
    icon: 'lightbulb',
    color: '#FBBC04',
    rarity: 'rare',
  },
  bug_hunter: {
    name: 'Bug Hunter',
    description: 'Reported and helped fix a bug',
    icon: 'bug',
    color: '#EA4335',
    rarity: 'rare',
  },
  team_member: {
    name: 'Team Member',
    description: 'Part of the Oxy team',
    icon: 'shield',
    color: '#000000',
    rarity: 'legendary',
  },
}

export const BADGE_IDS = Object.keys(BADGE_DEFINITIONS)
