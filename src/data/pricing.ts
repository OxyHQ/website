export interface PricingPlan {
  name: string
  price: { monthly: number; annual: number } | null // null = custom
  description: string
  cta: string
  ctaHref: string
  highlighted?: boolean
  features: string[]
}

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'For individuals getting started',
    cta: 'Start for free',
    ctaHref: '#',
    features: ['Up to 3 seats', '500 AI credits/seat/mo', 'Standard objects & lists', 'Basic reporting'],
  },
  {
    name: 'Plus',
    price: { monthly: 36, annual: 29 },
    description: 'For small teams collaborating',
    cta: 'Continue with Plus',
    ctaHref: '#',
    features: ['Unlimited seats', '1,000 AI credits/seat/mo', 'Custom objects & attributes', 'Automations', 'Advanced enrichment'],
  },
  {
    name: 'Pro',
    price: { monthly: 86, annual: 69 },
    description: 'For growing teams scaling up',
    cta: 'Continue with Pro',
    ctaHref: '#',
    highlighted: true,
    features: ['Call Intelligence & sequences', '2,500 AI credits/seat/mo', 'Advanced reporting', 'Sandbox environment', 'API access'],
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'For organizations with advanced needs',
    cta: 'Contact sales',
    ctaHref: '#',
    features: ['Custom AI credits', 'SAML SSO', 'Audit logs', 'Custom roles & permissions', 'Dedicated support', 'SLA'],
  },
]

export interface FaqItem {
  question: string
  answer: string
}

export interface FeatureRow {
  name: string
  values: [string, string, string, string] // Free, Plus, Pro, Enterprise
}

export interface FeatureCategory {
  name: string
  features: FeatureRow[]
}

export const featureCategories: FeatureCategory[] = [
  {
    name: 'Credits',
    features: [
      { name: 'Seat credits', values: ['100 per user/mo', '500 per user/mo', '1,000 per user/mo', '2,500 per user/mo'] },
      { name: 'Workspace credits', values: ['250 per workspace/mo', '1,500 per workspace/mo', '10,000 per workspace/mo', 'Custom'] },
      { name: 'Add workspace credits', values: ['—', '$0.10 per credit', '$0.08 per credit', 'Custom'] },
    ],
  },
  {
    name: 'Workspace',
    features: [
      { name: 'Objects', values: ['Up to 3', 'Up to 5', 'Up to 12', 'Unlimited'] },
      { name: 'Records', values: ['50,000', '250,000', '1,000,000', 'Custom'] },
      { name: 'Record and entry templates', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Attributes', values: ['Standard', 'Standard + custom', 'Advanced', 'Advanced'] },
      { name: 'Lists', values: ['Up to 5', 'Up to 20', 'Unlimited', 'Unlimited'] },
      { name: 'Views', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Notes', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Tasks', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Webhooks', values: ['—', '—', '✓', '✓'] },
      { name: 'API access', values: ['—', '—', '✓', '✓'] },
      { name: 'Sandbox environment', values: ['—', '—', '✓', '✓'] },
    ],
  },
  {
    name: 'Automations',
    features: [
      { name: 'Workflows', values: ['Up to 3', 'Up to 20', 'Unlimited', 'Unlimited'] },
      { name: 'Sequences', values: ['—', '—', '✓', '✓'] },
      { name: 'Triggers', values: ['Basic', 'Advanced', 'Advanced', 'Advanced'] },
      { name: 'Actions', values: ['Basic', 'Advanced', 'Advanced', 'Advanced'] },
    ],
  },
  {
    name: 'Email and calendar',
    features: [
      { name: 'Email sync', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Calendar sync', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Email templates', values: ['Up to 5', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { name: 'Email scheduling', values: ['—', '✓', '✓', '✓'] },
      { name: 'Email tracking', values: ['—', '✓', '✓', '✓'] },
      { name: 'Bulk email', values: ['—', '—', '✓', '✓'] },
      { name: 'Custom email domains', values: ['—', '—', '✓', '✓'] },
    ],
  },
  {
    name: 'Enrichment',
    features: [
      { name: 'Standard enrichment', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Advanced enrichment', values: ['—', '✓', '✓', '✓'] },
      { name: 'Web research', values: ['—', '—', '✓', '✓'] },
    ],
  },
  {
    name: 'Reporting',
    features: [
      { name: 'Standard reports', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Custom reports', values: ['—', '✓', '✓', '✓'] },
      { name: 'Dashboards', values: ['—', 'Up to 3', 'Unlimited', 'Unlimited'] },
      { name: 'Scheduled reports', values: ['—', '—', '✓', '✓'] },
    ],
  },
  {
    name: 'Security and admin',
    features: [
      { name: 'Two-factor authentication', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Roles and permissions', values: ['Basic', 'Basic', 'Advanced', 'Custom'] },
      { name: 'SAML SSO', values: ['—', '—', '—', '✓'] },
      { name: 'Audit logs', values: ['—', '—', '—', '✓'] },
      { name: 'Data export', values: ['✓', '✓', '✓', '✓'] },
      { name: 'GDPR tools', values: ['✓', '✓', '✓', '✓'] },
    ],
  },
  {
    name: 'Support',
    features: [
      { name: 'Help center', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Email support', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Priority support', values: ['—', '—', '✓', '✓'] },
      { name: 'Dedicated CSM', values: ['—', '—', '—', '✓'] },
      { name: 'Custom SLA', values: ['—', '—', '—', '✓'] },
      { name: 'Onboarding', values: ['Self-serve', 'Self-serve', 'Guided', 'Dedicated'] },
    ],
  },
]

export const faqItems: FaqItem[] = [
  { question: 'Which plan is right for me?', answer: 'The Free plan is perfect for individuals getting started. Plus is ideal for small teams, Pro for growing teams that need advanced features like Call Intelligence, and Enterprise for organizations with specific security and compliance needs.' },
  { question: 'Does Oxy have a free trial?', answer: 'Yes! All paid plans come with a 14-day free trial of Pro. No credit card required. You can explore all Pro features before making a decision.' },
  { question: 'How does billing work?', answer: 'You can choose monthly or annual billing. Annual billing saves you 20% compared to monthly. You can upgrade, downgrade, or cancel at any time.' },
  { question: 'What are AI credits?', answer: 'AI credits power Ask Oxy and other AI features. Each plan includes a set number of credits per seat per month. Credits reset monthly and do not roll over.' },
  { question: 'Can I change plans later?', answer: 'Absolutely. You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the end of your billing period.' },
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and can arrange invoice-based billing for Enterprise plans.' },
]
