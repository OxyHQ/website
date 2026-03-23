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
    features: ['Real-time contact syncing', 'Automatic data enrichment', 'Up to 3 seats'],
  },
  {
    name: 'Plus',
    price: { monthly: 36, annual: 29 },
    description: 'For small teams collaborating',
    cta: 'Continue with Plus',
    ctaHref: '#',
    features: ['Private lists', 'Enhanced email sending', 'No seat limits'],
  },
  {
    name: 'Pro',
    price: { monthly: 86, annual: 69 },
    description: 'For growing teams scaling up',
    cta: 'Continue with Pro',
    ctaHref: '#',
    highlighted: true,
    features: ['Call Intelligence & sequences', 'Advanced permissions', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'For enterprises needing control',
    cta: 'Talk to sales',
    ctaHref: '#',
    features: ['Unlimited objects', 'Unlimited teams', 'Advanced security & admin'],
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
      { name: 'Add workspace credits', values: ['\u00A0', '\u00A0', '\u00A0', '\u00A0'] },
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
  { question: 'Is Oxy free to use?', answer: 'Yes, Oxy has a free plan that includes real-time contact syncing, automatic data enrichment, and up to 3 seats. No credit card required to get started.' },
  { question: 'How do credits work?', answer: 'Credits power AI features across the platform. Each plan includes seat credits (per user) and workspace credits (shared). Credits reset monthly and do not roll over. You can purchase additional workspace credits on paid plans.' },
  { question: 'Do you offer discounts?', answer: 'Yes! Annual billing saves you 20% compared to monthly. We also offer special pricing for startups and nonprofits. Contact our sales team for details.' },
  { question: 'What are my payment options?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and can arrange invoice-based billing for Enterprise plans.' },
]
