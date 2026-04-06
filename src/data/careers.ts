export const careersHero = {
  badge: 'Careers',
  title: 'Our mission is to build the CRM for the next generation.',
  subtitle: "We're redefining CRM — shipping powerful, groundbreaking features at every turn. Join us to revolutionize the world's largest software category.",
}

export interface Value {
  title: string
  description: string
  emoji: string
}

export const values: Value[] = [
  { title: 'Build with love.', description: 'We believe in building with heart, creating something that not only works but feels thoughtfully crafted.', emoji: '\u2764\uFE0F' },
  { title: 'Context over control.', description: 'We build trust in individuals to make decisions and move forward without rigid hierarchy.', emoji: '\u{1F9ED}' },
  { title: 'Challenge ideas, not people.', description: 'We always keep the focus on challenging ideas, not the individuals behind them.', emoji: '\u{1F4A1}' },
  { title: 'Break it down, amp it up.', description: 'We encourage bold, creative ideas that go beyond the limits of what\u2019s achievable.', emoji: '\u{1F680}' },
]

export interface JobDepartment {
  name: string
  id: string
  jobs: { title: string; location: string; href: string }[]
}

export type DescriptionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }

export interface SocialCard {
  title: string
  description: string
  href: string
  iconType: 'linkedin' | 'x' | 'dribbble' | 'youtube'
}

export const socialCards: SocialCard[] = [
  { title: 'LinkedIn', description: 'Keep up to date with what the team is building.', href: 'https://www.linkedin.com/company/oxyhq/', iconType: 'linkedin' },
  { title: 'X', description: 'Follow us for product updates and announcements.', href: '#', iconType: 'x' },
  { title: 'Dribbble', description: 'See our latest design work and explorations.', href: '#', iconType: 'dribbble' },
  { title: 'YouTube', description: 'Watch product demos and behind-the-scenes.', href: '#', iconType: 'youtube' },
]
