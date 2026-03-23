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
      { title: 'Engineering Lead', location: 'London [Hybrid]', href: '/careers/engineering-lead-london-hybrid' },
      { title: 'Engineering Lead', location: 'Poland, Portugal, Ireland, Germany [Remote]', href: '/careers/engineering-lead-europe-remote' },
      { title: 'Platform Engineer', location: 'London, United Kingdom [Hybrid]', href: '/careers/platform-engineer-london-hybrid' },
      { title: 'Platform Engineer', location: 'Poland, Portugal, Ireland, Germany [Remote]', href: '/careers/platform-engineer-europe-remote' },
      { title: 'Product Engineer', location: 'London, United Kingdom [Hybrid]', href: '/careers/product-engineer-london-hybrid' },
      { title: 'Product Engineer', location: 'Poland, Portugal, Ireland, Germany [Remote]', href: '/careers/product-engineer-europe-remote' },
      { title: 'Security Operations Analyst', location: 'United Kingdom [Hybrid]', href: '/careers/security-operations-analyst-uk-hybrid' },
      { title: 'IT Engineer (Fixed-Term Contract)', location: 'London [Remote]', href: '/careers/it-engineer-london-remote' },
    ],
  },
  {
    name: 'GTM', id: 'gtm',
    jobs: [
      { title: 'Account Executive', location: 'London [Hybrid]', href: '/careers/account-executive-london-hybrid' },
      { title: 'Account Executive', location: 'United States [Hybrid]', href: '/careers/account-executive-us-hybrid' },
      { title: 'Customer Success Manager', location: 'London [Hybrid]', href: '/careers/customer-success-manager-london-hybrid' },
      { title: 'Customer Success Manager', location: 'New York [Hybrid]', href: '/careers/customer-success-manager-ny-hybrid' },
      { title: 'Customer Success Manager', location: 'San Francisco [Hybrid]', href: '/careers/customer-success-manager-sf-hybrid' },
      { title: 'Sales Manager', location: 'London [Hybrid]', href: '/careers/sales-manager-london-hybrid' },
      { title: 'Sales Manager', location: 'United States [Hybrid]', href: '/careers/sales-manager-us-hybrid' },
      { title: 'SDR Manager', location: 'New York [Hybrid]', href: '/careers/sdr-manager-ny-hybrid' },
      { title: 'SDR Manager', location: 'San Francisco [Hybrid]', href: '/careers/sdr-manager-sf-hybrid' },
    ],
  },
  {
    name: 'Marketing', id: 'marketing',
    jobs: [
      { title: 'Product Marketing Lead', location: 'London [Hybrid]', href: '/careers/product-marketing-lead-london-hybrid' },
    ],
  },
  {
    name: 'Operations', id: 'operations',
    jobs: [
      { title: 'Revenue Operations Lead', location: 'London [Hybrid]', href: '/careers/revenue-operations-lead-london-hybrid' },
    ],
  },
  {
    name: 'Product', id: 'product',
    jobs: [
      { title: 'Product Partnerships', location: 'San Francisco [Hybrid]', href: '/careers/product-partnerships-sf-hybrid' },
      { title: 'Product Manager', location: 'Europe and United Kingdom [Remote]', href: '/careers/product-manager-europe-remote' },
    ],
  },
  {
    name: 'Open Applications', id: 'open-applications',
    jobs: [
      { title: 'Open Application', location: 'London [Hybrid]', href: '/careers/open-application-london-hybrid' },
    ],
  },
]

export type DescriptionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }

export interface JobDetail {
  slug: string
  title: string
  subtitle: string
  department: string
  location: string
  compensation: string
  engagement: string
  description: DescriptionBlock[]
}

export const jobDetails: JobDetail[] = [
  {
    slug: 'engineering-lead-london-hybrid',
    title: 'Engineering Lead',
    subtitle: 'Lead a team building the future of CRM',
    department: 'Engineering',
    location: 'London [Hybrid]',
    compensation: '\u00a3120K \u2013 \u00a3150K \u00b7 Offers Equity',
    engagement: 'Full-time',
    description: [
      { type: 'paragraph', text: '<strong class="font-semibold">Oxy is the CRM built for the AI era.</strong> Designed for the most ambitious go-to-market teams, it gives companies the power to understand every customer, automate at scale, and build their go-to-market motion exactly as they need.' },
      { type: 'paragraph', text: 'We hire builders who thrive on complex technical challenges, hold themselves to a high bar, and genuinely care about delighting the people who use what they build. The team here brings sharp judgement, real craft, and the drive to do exceptional work.' },
      { type: 'paragraph', text: 'If you want to do the best work of your career, this is the right place.' },
      { type: 'heading', text: 'About the role' },
      { type: 'paragraph', text: 'Our Engineering team tackles the toughest challenges, so our users never have to. Real-time infrastructure, AI-native architecture, and a frontend that feels effortless \u2014 all powered by a team that moves fast, thinks rigorously, and holds an exceptionally high bar for quality.' },
      { type: 'paragraph', text: 'We\u2019re looking for an Engineering Lead who can drive technical excellence across a team of 4\u20136 engineers while staying deeply hands-on with code.' },
      { type: 'heading', text: 'What you\u2019ll do' },
      { type: 'list', items: [
        'Lead a team of 4\u20136 engineers building core CRM infrastructure and product features.',
        'Drive technical architecture decisions for real-time data pipelines and AI-native systems.',
        'Mentor engineers, run code reviews, and raise the quality bar across the team.',
        'Collaborate closely with Product and Design to ship user-facing features on tight timelines.',
        'Contribute directly to the codebase \u2014 this is a hands-on leadership role.',
      ] },
      { type: 'heading', text: 'What you\u2019ll bring' },
      { type: 'list', items: [
        'Strong expertise in TypeScript, Node.js, and modern frontend frameworks (React preferred).',
        '5+ years of software engineering experience with at least 1 year in a leadership or tech lead role.',
        'Experience building and scaling distributed systems or data-intensive applications.',
        'A track record of shipping high-quality products and mentoring other engineers.',
        'An ability to communicate technical ideas clearly to cross-functional stakeholders.',
      ] },
      { type: 'heading', text: 'What we offer' },
      { type: 'list', items: [
        'Competitive salary of \u00a3120,000 to \u00a3150,000',
        'Equity in an early-stage tech company on an incredible trajectory',
        '25 days holiday plus local public holidays',
        'Apple hardware',
        'Private medical insurance',
        'Enhanced family leave',
        'Team off-sites in great locations',
      ] },
    ],
  },
  {
    slug: 'product-engineer-london-hybrid',
    title: 'Product Engineer',
    subtitle: 'Deliver cutting-edge user experiences',
    department: 'Engineering',
    location: 'London, United Kingdom [Hybrid]',
    compensation: '\u00a380K \u2013 \u00a395K \u00b7 Offers Equity',
    engagement: 'Full-time',
    description: [
      { type: 'paragraph', text: '<strong class="font-semibold">Oxy is the CRM built for the AI era.</strong> Designed for the most ambitious go-to-market teams, it gives companies the power to understand every customer, automate at scale, and build their go-to-market motion exactly as they need.' },
      { type: 'paragraph', text: 'We hire builders who thrive on complex technical challenges, hold themselves to a high bar, and genuinely care about delighting the people who use what they build. The team here brings sharp judgement, real craft, and the drive to do exceptional work.' },
      { type: 'paragraph', text: 'If you want to do the best work of your career, this is the right place.' },
      { type: 'heading', text: 'About the role' },
      { type: 'paragraph', text: 'Our Engineering team tackles the toughest challenges, so our users never have to. Real-time infrastructure, AI-native architecture, and a frontend that feels effortless \u2014 all powered by a team that moves fast, thinks rigorously, and holds an exceptionally high bar for quality.' },
      { type: 'paragraph', text: 'We\u2019re looking for a Product Engineer who cares deeply about building beautiful, performant systems \u2014 and wants to help reinvent how millions of people work.' },
      { type: 'heading', text: 'What you\u2019ll do' },
      { type: 'list', items: [
        'Use your strong expertise in JavaScript/TypeScript to implement product features in our Node.js backend and React frontend.',
        'Be part of the teams that deliver cutting-edge user experiences in a high-performance, data-rich application.',
        'Learn and grow from some of the best technical talent working in the industry today.',
        'Represent Oxy\u2019s Product & Engineering values both internally and externally.',
      ] },
      { type: 'heading', text: 'What you\u2019ll bring' },
      { type: 'list', items: [
        'Expertise with JavaScript/TypeScript.',
        'A track record of independent delivery, solving real customer or product problems as part of a team.',
        'A proactive, self-motivated problem solving attitude, with a strong passion for learning new skills.',
        'A good understanding of how excellent technical work can create great user experiences.',
        'An ability to communicate technical ideas to the wider team and influence stakeholders across Engineering, Product and Design.',
      ] },
      { type: 'heading', text: 'What we offer' },
      { type: 'list', items: [
        'Competitive salary of \u00a380,000 to \u00a395,000',
        'Equity in an early-stage tech company on an incredible trajectory',
        '25 days holiday plus local public holidays',
        'Apple hardware',
        'Private medical insurance',
        'Enhanced family leave',
        'Team off-sites in great locations',
      ] },
    ],
  },
  {
    slug: 'account-executive-london-hybrid',
    title: 'Account Executive',
    subtitle: 'Drive revenue growth with enterprise customers',
    department: 'GTM',
    location: 'London [Hybrid]',
    compensation: '\u00a360K \u2013 \u00a375K OTE \u00a3100K \u2013 \u00a3130K \u00b7 Offers Equity',
    engagement: 'Full-time',
    description: [
      { type: 'paragraph', text: '<strong class="font-semibold">Oxy is the CRM built for the AI era.</strong> We\u2019re looking for hungry, ambitious Account Executives who want to be part of a rocketship journey selling a product that customers genuinely love.' },
      { type: 'paragraph', text: 'You\u2019ll work closely with our SDR team, Solutions Engineers, and Customer Success to drive new business and expand within existing accounts.' },
      { type: 'heading', text: 'About the role' },
      { type: 'paragraph', text: 'As an Account Executive, you\u2019ll own the full sales cycle from qualified opportunity to close. You\u2019ll sell into mid-market and enterprise accounts, working with stakeholders across Revenue, Operations, and executive leadership.' },
      { type: 'heading', text: 'What you\u2019ll do' },
      { type: 'list', items: [
        'Own and manage a pipeline of mid-market and enterprise opportunities.',
        'Run compelling product demos tailored to each prospect\u2019s unique needs.',
        'Navigate complex, multi-stakeholder deals and drive them to close.',
        'Collaborate with Product to relay customer feedback and shape the roadmap.',
        'Consistently exceed quarterly and annual revenue targets.',
      ] },
      { type: 'heading', text: 'What you\u2019ll bring' },
      { type: 'list', items: [
        '3+ years of closing experience in B2B SaaS sales.',
        'Experience selling to mid-market or enterprise accounts with deal sizes of \u00a330K+ ARR.',
        'Strong consultative selling skills and an ability to articulate complex value propositions.',
        'A competitive, resilient, and coachable mindset.',
        'Excellent communication and presentation skills.',
      ] },
      { type: 'heading', text: 'What we offer' },
      { type: 'list', items: [
        'Competitive base salary with uncapped commission',
        'Equity in an early-stage tech company on an incredible trajectory',
        '25 days holiday plus local public holidays',
        'Apple hardware',
        'Private medical insurance',
        'Enhanced family leave',
        'Team off-sites in great locations',
      ] },
    ],
  },
  {
    slug: 'product-marketing-lead-london-hybrid',
    title: 'Product Marketing Lead',
    subtitle: 'Shape how the world sees Oxy',
    department: 'Marketing',
    location: 'London [Hybrid]',
    compensation: '\u00a390K \u2013 \u00a3115K \u00b7 Offers Equity',
    engagement: 'Full-time',
    description: [
      { type: 'paragraph', text: '<strong class="font-semibold">Oxy is the CRM built for the AI era.</strong> We\u2019re looking for a Product Marketing Lead to own our go-to-market strategy and be the connective tissue between Product, Sales, and the market.' },
      { type: 'paragraph', text: 'This is a foundational hire. You\u2019ll define our positioning, craft our messaging, and launch features that get customers excited.' },
      { type: 'heading', text: 'About the role' },
      { type: 'paragraph', text: 'You\u2019ll be the voice of the customer internally and the voice of the product externally. Working at the intersection of product, sales, and marketing, you\u2019ll drive launches, competitive intelligence, and enablement.' },
      { type: 'heading', text: 'What you\u2019ll do' },
      { type: 'list', items: [
        'Define and evolve Oxy\u2019s product positioning and messaging across all audiences.',
        'Lead go-to-market strategy for major feature launches and product releases.',
        'Create sales enablement materials, battlecards, and competitive intelligence.',
        'Conduct customer research to deeply understand our ICP and buyer personas.',
        'Partner with Content, Demand Gen, and Product to drive pipeline and awareness.',
      ] },
      { type: 'heading', text: 'What you\u2019ll bring' },
      { type: 'list', items: [
        '5+ years of product marketing experience in B2B SaaS, ideally in CRM, sales tech, or data infrastructure.',
        'Strong writing skills and an eye for compelling narratives.',
        'Experience working cross-functionally with Product, Sales, and Engineering teams.',
        'A data-driven approach to measuring impact and iterating on strategy.',
        'Comfort operating in a fast-paced, ambiguous startup environment.',
      ] },
      { type: 'heading', text: 'What we offer' },
      { type: 'list', items: [
        'Competitive salary of \u00a390,000 to \u00a3115,000',
        'Equity in an early-stage tech company on an incredible trajectory',
        '25 days holiday plus local public holidays',
        'Apple hardware',
        'Private medical insurance',
        'Enhanced family leave',
        'Team off-sites in great locations',
      ] },
    ],
  },
  {
    slug: 'product-manager-europe-remote',
    title: 'Product Manager',
    subtitle: 'Define the future of AI-native CRM',
    department: 'Product',
    location: 'Europe and United Kingdom [Remote]',
    compensation: '\u00a390K \u2013 \u00a3120K \u00b7 Offers Equity',
    engagement: 'Full-time',
    description: [
      { type: 'paragraph', text: '<strong class="font-semibold">Oxy is the CRM built for the AI era.</strong> We\u2019re hiring a Product Manager to own key parts of our product roadmap and drive the strategy and execution of features that millions of users rely on every day.' },
      { type: 'paragraph', text: 'You\u2019ll work embedded with an engineering team and partner closely with Design to ship products that are powerful yet delightfully simple.' },
      { type: 'heading', text: 'About the role' },
      { type: 'paragraph', text: 'As a Product Manager at Oxy, you\u2019ll own a product area end to end \u2014 from discovery and research through to delivery and iteration. You\u2019ll balance user needs, business goals, and technical constraints to make great product decisions.' },
      { type: 'heading', text: 'What you\u2019ll do' },
      { type: 'list', items: [
        'Own the roadmap for a core product area, setting vision and priorities.',
        'Conduct user research, analyze data, and synthesize insights to inform decisions.',
        'Write clear specs and work closely with Engineering and Design to ship on time.',
        'Define success metrics and iterate based on quantitative and qualitative feedback.',
        'Communicate product strategy and progress to leadership and cross-functional partners.',
      ] },
      { type: 'heading', text: 'What you\u2019ll bring' },
      { type: 'list', items: [
        '4+ years of product management experience in B2B SaaS.',
        'Strong analytical skills and comfort with data-driven decision making.',
        'Excellent written and verbal communication skills.',
        'Experience working with engineering teams in an agile environment.',
        'A genuine passion for building products that users love.',
      ] },
      { type: 'heading', text: 'What we offer' },
      { type: 'list', items: [
        'Competitive salary of \u00a390,000 to \u00a3120,000',
        'Equity in an early-stage tech company on an incredible trajectory',
        '25 days holiday plus local public holidays',
        'Apple hardware',
        'Private medical insurance',
        'Enhanced family leave',
        'Team off-sites in great locations',
      ] },
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
  { title: 'LinkedIn', description: 'Keep up to date with what the team is building.', href: 'https://www.linkedin.com/company/oxyhq/', iconType: 'linkedin' },
  { title: 'X', description: 'Follow us for product updates and announcements.', href: '#', iconType: 'x' },
  { title: 'Dribbble', description: 'See our latest design work and explorations.', href: '#', iconType: 'dribbble' },
  { title: 'YouTube', description: 'Watch product demos and behind-the-scenes.', href: '#', iconType: 'youtube' },
]
