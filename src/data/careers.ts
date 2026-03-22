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

export const jobDepartments: JobDepartment[] = [
  {
    name: 'Engineering', id: 'engineering',
    jobs: [
      { title: 'Engineering Lead', location: 'London [Hybrid]', href: '#' },
      { title: 'Engineering Lead', location: 'Poland, Portugal, Ireland, Germany [Remote]', href: '#' },
      { title: 'Platform Engineer', location: 'London, United Kingdom [Hybrid]', href: '#' },
      { title: 'Platform Engineer', location: 'Poland, Portugal, Ireland, Germany [Remote]', href: '#' },
      { title: 'Product Engineer', location: 'London, United Kingdom [Hybrid]', href: '#' },
      { title: 'Product Engineer', location: 'Poland, Portugal, Ireland, Germany [Remote]', href: '#' },
      { title: 'Security Operations Analyst', location: 'United Kingdom [Hybrid]', href: '#' },
      { title: 'IT Engineer (Fixed-Term Contract)', location: 'London [Remote]', href: '#' },
    ],
  },
  {
    name: 'GTM', id: 'gtm',
    jobs: [
      { title: 'Account Executive', location: 'London [Hybrid]', href: '#' },
      { title: 'Account Executive', location: 'United States [Hybrid]', href: '#' },
      { title: 'Customer Success Manager', location: 'London [Hybrid]', href: '#' },
      { title: 'Customer Success Manager', location: 'New York [Hybrid]', href: '#' },
      { title: 'Customer Success Manager', location: 'San Francisco [Hybrid]', href: '#' },
      { title: 'Sales Manager', location: 'London [Hybrid]', href: '#' },
      { title: 'Sales Manager', location: 'United States [Hybrid]', href: '#' },
      { title: 'SDR Manager', location: 'New York [Hybrid]', href: '#' },
      { title: 'SDR Manager', location: 'San Francisco [Hybrid]', href: '#' },
    ],
  },
  {
    name: 'Marketing', id: 'marketing',
    jobs: [
      { title: 'Product Marketing Lead', location: 'London [Hybrid]', href: '#' },
    ],
  },
  {
    name: 'Operations', id: 'operations',
    jobs: [
      { title: 'Revenue Operations Lead', location: 'London [Hybrid]', href: '#' },
    ],
  },
  {
    name: 'Product', id: 'product',
    jobs: [
      { title: 'Product Partnerships', location: 'San Francisco [Hybrid]', href: '#' },
      { title: 'Product Manager', location: 'Europe and United Kingdom [Remote]', href: '#' },
    ],
  },
  {
    name: 'Open Applications', id: 'open-applications',
    jobs: [
      { title: 'Open Application', location: 'London [Hybrid]', href: '#' },
    ],
  },
]

export interface SocialCard {
  title: string
  description: string
  href: string
  iconType: 'linkedin' | 'x' | 'dribbble' | 'youtube'
}

export const socialCards: SocialCard[] = [
  { title: 'LinkedIn', description: 'Keep up to date with what the team is building.', href: '#', iconType: 'linkedin' },
  { title: 'X', description: 'Follow us for product updates and announcements.', href: '#', iconType: 'x' },
  { title: 'Dribbble', description: 'See our latest design work and explorations.', href: '#', iconType: 'dribbble' },
  { title: 'YouTube', description: 'Watch product demos and behind-the-scenes.', href: '#', iconType: 'youtube' },
]
