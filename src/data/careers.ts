export const careersHero = {
  badge: 'Careers',
  title: 'Our mission is to build the CRM for the next generation.',
  subtitle: "We're redefining CRM — shipping powerful, groundbreaking features at every turn. Join us to revolutionize the world's largest software category.",
}

export interface Value {
  title: string
  description: string
}

export const values: Value[] = [
  { title: 'Ship with urgency', description: 'We move fast and ship often. Speed is a feature, and we treat it like one.' },
  { title: 'Raise the bar', description: 'We hold ourselves to the highest standards. Good enough is never good enough.' },
  { title: 'Think from first principles', description: "We don't copy — we reason from the ground up to find the best solution." },
  { title: 'Own the outcome', description: 'We take responsibility end-to-end. If something needs doing, we do it.' },
  { title: 'Be direct', description: 'We say what we mean and mean what we say. Honesty accelerates everything.' },
  { title: 'Build for builders', description: 'We build tools that empower ambitious teams to do their best work.' },
]

export interface JobListing {
  title: string
  department: string
  location: string
  type: string
}

export const jobListings: JobListing[] = [
  { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'London, UK', type: 'Full-time' },
  { title: 'Senior Backend Engineer', department: 'Engineering', location: 'London, UK', type: 'Full-time' },
  { title: 'Product Designer', department: 'Design', location: 'London, UK', type: 'Full-time' },
  { title: 'Solutions Engineer', department: 'Sales', location: 'New York, US', type: 'Full-time' },
  { title: 'Account Executive', department: 'Sales', location: 'New York, US', type: 'Full-time' },
  { title: 'Customer Success Manager', department: 'Customer Success', location: 'London, UK', type: 'Full-time' },
  { title: 'Data Engineer', department: 'Engineering', location: 'Remote, Europe', type: 'Full-time' },
  { title: 'Technical Writer', department: 'Product', location: 'Remote, US', type: 'Full-time' },
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
