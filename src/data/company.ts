/* ─────────────────────────────────────────────
   Company page — static content constants.
   Same pattern as codea.ts / inbox.ts / ai.ts.
   Content sourced from https://oxy.so/company
   ───────────────────────────────────────────── */

export interface CulturePerk {
  title: string
  href: string
}

export interface CompanyValue {
  title: string
  description: string
}

export interface TeamMember {
  name: string
  role: string
  description: string
  slug: string
}

export interface FAQItem {
  question: string
  answer: string
}

/* ── Hero ── */

export const companyHero = {
  badge: 'The Oxy Collective, Inc.',
  title: 'We build ethical technology that solves real problems, giving people the tools to shape their own futures, not just consume someone else\'s vision.',
  subtitle: 'Our north star: a world where technology creates opportunity for everyone, not just those who can afford it.',
}

/* ── Stats ── */

export const companyStats = [
  { value: 'Global', label: 'Impact', description: 'Serving communities worldwide' },
  { value: 'AI', label: 'Workflows', description: 'Automating what slows you down' },
  { value: 'Barcelona', label: 'ES', description: 'HQ + remote team worldwide' },
  { value: '26', label: 'Team members', description: 'And growing every month' },
]

/* ── Culture ── */

export const companyCulture = {
  heading: 'Culture',
  description: 'We believe great work happens when people feel trusted, supported, and free to challenge the status quo.',
}

export const culturePerks: CulturePerk[] = [
  { title: 'Pet-Friendly Community', href: '/company/culture/pet-friendly-community' },
  { title: 'Financial Awareness Together', href: '/company/culture/financial-awareness-together' },
  { title: 'Support for Family Time', href: '/company/culture/support-for-family-time' },
  { title: 'Continuous Learning Culture', href: '/company/culture/continuous-learning-culture' },
  { title: 'Access to Network Benefits', href: '/company/culture/access-to-network-benefits' },
  { title: 'Unlimited Time Off', href: '/company/culture/unlimited-time-off' },
  { title: 'Remote-First Mindset', href: '/company/culture/remote-first-mindset' },
  { title: 'Active Lifestyle Encouragement', href: '/company/culture/active-lifestyle-encouragement' },
  { title: 'Team Bonding Activities', href: '/company/culture/team-bonding-activities' },
  { title: 'Focus on Wellbeing', href: '/company/culture/focus-on-wellbeing' },
  { title: 'Community and Connection', href: '/company/culture/community-and-connection' },
  { title: 'Flexible Work Environment', href: '/company/culture/flexible-work-environment' },
]

/* ── Values ── */

export const companyValues: CompanyValue[] = [
  { title: 'Empathy', description: 'We put ourselves in the shoes of our customers to understand their needs.' },
  { title: 'Customer obsession', description: 'We are passionate about helping our customers succeed.' },
  { title: 'Innovative', description: 'We constantly seek out new and better ways to solve problems.' },
  { title: 'Collaboration', description: 'We work as a team to achieve our goals and celebrate our successes.' },
  { title: 'Transparency', description: 'We believe in communicating openly and honestly with everyone.' },
  { title: 'Diversity and inclusion', description: 'We believe in building a diverse and inclusive team.' },
]

/* ── Team ── */

export const teamMembers: TeamMember[] = [
  {
    name: 'Ton Soteras',
    role: 'Public Relations Officer',
    description: 'Responsible for talking, discussing, negotiating, and recruiting people who are interested in Oxy and FairCoin.',
    slug: 'ton',
  },
  {
    name: 'Juan C. Moslares Fuste',
    role: 'Chief Communications Officer (CCO)',
    description: 'Juan leads communication at Oxy, connecting our vision with the world through his experience in radio.',
    slug: 'juan-c-moslares-fuste',
  },
  {
    name: 'Alejandra Sanchez Garcia',
    role: 'Frontend Developer',
    description: 'Alejandra focuses on designing and developing user-friendly interfaces that align with Oxy\'s vision.',
    slug: 'alejandrasanchez',
  },
  {
    name: 'Desiree Moreno Corpas',
    role: 'Full-Stack Web Developer',
    description: 'Desiree is a Full-Stack Web Developer with expertise in JavaScript, PHP, React, and Agile methodologies.',
    slug: 'desiree',
  },
]

/* ── FAQ ── */

export const companyFAQ: FAQItem[] = [
  { question: 'Can I contribute to Oxy without being an employee?', answer: 'Absolutely. Oxy is open source and community-driven. You can contribute code, report bugs, write documentation, or join discussions on our GitHub and community channels.' },
  { question: 'How do I stay in the loop on what Oxy is building?', answer: 'Follow our engineering blog, subscribe to the changelog, and join our community on social media. We share updates regularly.' },
  { question: 'What\'s it actually like to work at Oxy?', answer: 'We are remote-first, async-friendly, and value autonomy. Our team members have unlimited time off, flexible schedules, and a culture built on trust.' },
  { question: 'What does Oxy\'s hiring process look like?', answer: 'Typically: application review, an introductory call, a technical or portfolio review, and a team conversation. We keep it straightforward and respectful of your time.' },
  { question: 'How do I apply for a role at Oxy?', answer: 'Visit our careers page to see open roles. You can apply directly or reach out to us if you don\'t see a perfect fit but want to connect.' },
  { question: 'Any tips for preparing for an Oxy interview?', answer: 'Be yourself. Familiarize yourself with our products and values. We care about how you think and communicate, not just technical skills.' },
  { question: 'Does Oxy offer internships?', answer: 'Yes, we offer internships for students and early-career professionals. Check our careers page for current openings.' },
]

/* ── Quick Links ── */

export const companyLinks = [
  { label: 'Careers', href: '/company/careers', description: 'Join our global team of builders' },
  { label: 'Newsroom', href: '/newsroom', description: 'Latest announcements and press' },
  { label: 'Engineering Blog', href: '/company/news', description: 'Technical deep dives from our team' },
  { label: 'Initiative', href: '/initiative', description: 'Our mission and community programs' },
  { label: 'Open Source', href: 'https://github.com/OxyHQ', description: 'Browse our public repositories' },
  { label: 'Partner Programs', href: '/partners', description: 'Collaborate and grow with Oxy' },
]
