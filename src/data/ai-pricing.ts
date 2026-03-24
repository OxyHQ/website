export interface PricingPlan {
  name: string
  tagline: string
  price: string
  priceNote?: string
  bgColor: string
  dotColor: string
  borderColor: string
  accentColor: string
  dotShape: 'circle' | 'square' | 'star'
  features: Array<{ label: string; extra?: string }>
  description?: string
  cta: string
  ctaHref: string
}

export const plans: PricingPlan[] = [
  {
    name: 'Starter',
    tagline: 'For everyone',
    price: '$0',
    priceNote: '/ month',
    bgColor: 'bg-[#1a4a3a]',
    dotColor: 'bg-[#22c55e]',
    borderColor: 'border-[#22c55e]/20',
    accentColor: 'text-[#22c55e]',
    dotShape: 'circle',
    features: [
      { label: '1 GB storage', extra: '+ $4/GB' },
      { label: '10k scores', extra: '+ $2.50/1k' },
      { label: '14 days retention' },
      { label: 'Unlimited users, projects, datasets, playgrounds, and experiments' },
    ],
    cta: 'Get started',
    ctaHref: '/signup',
  },
  {
    name: 'Pro',
    tagline: 'For growing teams',
    price: '$249',
    priceNote: '/ month',
    bgColor: 'bg-[#9f1239]',
    dotColor: 'bg-[#ec4899]',
    borderColor: 'border-[#ec4899]/20',
    accentColor: 'text-[#ec4899]',
    dotShape: 'square',
    features: [
      { label: '5 GB storage', extra: '+ $3/GB' },
      { label: '50k scores', extra: '+ $1.50/1k' },
      { label: '30 days retention' },
      { label: 'Custom topics, charts, environments, and priority support' },
    ],
    cta: 'Get Pro',
    ctaHref: '/signup',
  },
  {
    name: 'Enterprise',
    tagline: 'For teams at scale',
    price: 'Custom pricing',
    bgColor: 'bg-[#2563eb]',
    dotColor: 'bg-transparent',
    borderColor: 'border-white/20',
    accentColor: 'text-white',
    dotShape: 'star',
    description: 'Custom data retention and export, RBAC, and premium support with on-prem or hosted deployment for high volume or privacy-sensitive workloads.',
    features: [],
    cta: 'Contact sales',
    ctaHref: '/contact',
  },
]

export interface ComparisonCategory {
  title: string
  description: string
  rows: ComparisonRow[]
}

export interface ComparisonRow {
  label: string
  starter: string
  pro: string
  enterprise: string
}

// ✓ = checkmark, — = dash, text = literal value
export const comparisonData: ComparisonCategory[] = [
  {
    title: 'Core platform',
    description: 'Tracing, evaluation, and storage infrastructure for your AI stack.',
    rows: [
      { label: 'Platform fee', starter: '$0 / month', pro: '$249 / month', enterprise: 'Custom' },
      { label: 'Processed data', starter: '1 GB / month included\nthen +$4/GB', pro: '5 GB / month included\nthen +$3/GB', enterprise: 'Custom' },
      { label: 'Scores', starter: '10K / month included\nthen $2.50 per 1,000', pro: '50K / month included\nthen $1.50 per 1,000', enterprise: 'Custom' },
      { label: 'Users', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Projects', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Playgrounds', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Experiments', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Datasets', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Human review scores', starter: '1 per project', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Loop agent', starter: '✓', pro: '✓', enterprise: '✓' },
      { label: 'Custom topics', starter: '—', pro: '✓', enterprise: '✓' },
      { label: 'Playground annotations', starter: '—', pro: '✓', enterprise: '✓' },
    ],
  },
  {
    title: 'Customization',
    description: 'Dashboards, custom charts, and views to understand your system in production.',
    rows: [
      { label: 'Saved table views', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Custom columns', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Custom trace views', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { label: 'Custom charts', starter: '—', pro: '✓', enterprise: '✓' },
      { label: 'Environments', starter: '—', pro: '✓', enterprise: '✓' },
    ],
  },
  {
    title: 'Data retention and export',
    description: 'Control how long your data is stored and how it leaves the platform.',
    rows: [
      { label: 'Default retention', starter: '14 days', pro: '30 days', enterprise: 'Custom' },
      { label: 'Custom policies', starter: '—', pro: '—', enterprise: '✓' },
      { label: 'S3 data export', starter: '—', pro: '—', enterprise: '✓' },
    ],
  },
  {
    title: 'Security and compliance',
    description: 'Enterprise-grade access controls, authentication, and compliance agreements.',
    rows: [
      { label: 'OAuth sign-in', starter: '✓', pro: '✓', enterprise: '✓' },
      { label: 'Multi-factor authentication (MFA)', starter: '✓', pro: '✓', enterprise: '✓' },
      { label: 'SOC 2 Type II compliance', starter: '✓', pro: '✓', enterprise: '✓' },
      { label: 'SAML single sign-on (SSO)', starter: '—', pro: '—', enterprise: '✓' },
      { label: 'Role-based access control (RBAC)', starter: '—', pro: 'Basic roles', enterprise: 'Custom' },
      { label: 'Data processing agreement (DPA)', starter: '—', pro: 'Click-through', enterprise: 'Custom' },
      { label: 'Business associate agreement (BAA)', starter: '—', pro: '—', enterprise: '✓' },
      { label: 'Uptime service level agreement (SLA)', starter: '—', pro: '—', enterprise: '✓' },
    ],
  },
  {
    title: 'Support',
    description: 'We genuinely care about your success.',
    rows: [
      { label: 'Community support', starter: '✓', pro: '✓', enterprise: '✓' },
      { label: 'Priority support', starter: '—', pro: '✓', enterprise: '✓' },
      { label: 'Shared Slack channel', starter: '—', pro: '—', enterprise: '✓' },
      { label: 'Dedicated account manager', starter: '—', pro: '—', enterprise: '✓' },
    ],
  },
]

export const sidebarLabels = ['Processed data', 'Scores', 'Data retention', 'Features']
