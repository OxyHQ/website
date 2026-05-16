export interface PricingPlan {
  _id?: string
  name: string
  price: { monthly: number; annual: number } | null // null = custom
  description: string
  cta: string
  ctaHref: string
  highlighted?: boolean
  features: string[]
}

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

/**
 * Static fallback used by the legacy compare-table. The live page should
 * source pricing from the CMS via `usePricing()`. Until real ecosystem
 * pricing copy is in the CMS, this matrix describes generic platform
 * tiers (not CRM-specific concepts).
 */
export const featureCategories: FeatureCategory[] = [
  {
    name: 'Workspaces & members',
    features: [
      { name: 'Workspaces', values: ['1', 'Up to 3', 'Up to 10', 'Unlimited'] },
      { name: 'Members per workspace', values: ['Up to 3', 'Up to 10', 'Unlimited', 'Unlimited'] },
      { name: 'Guest collaborators', values: ['—', '✓', '✓', '✓'] },
    ],
  },
  {
    name: 'Apps included',
    features: [
      { name: 'Mention, Inbox, Homiio', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Codea', values: ['Community', 'Community', 'Pro', 'Pro'] },
      { name: 'Oxy AI (Alia) credits', values: ['Trial', 'Standard', 'Pro', 'Custom'] },
      { name: 'Oxy CRM', values: ['—', 'Up to 3 seats', 'Unlimited seats', 'Unlimited seats'] },
      { name: 'OxyOS support', values: ['Community', 'Community', 'Priority', 'Priority'] },
    ],
  },
  {
    name: 'AI usage',
    features: [
      { name: 'Agent runs per month', values: ['Limited', 'Standard', 'High', 'Custom'] },
      { name: 'Custom agents (App SDK)', values: ['—', '—', '✓', '✓'] },
      { name: 'Bring your own model', values: ['—', '—', '✓', '✓'] },
    ],
  },
  {
    name: 'Storage & integrations',
    features: [
      { name: 'Storage', values: ['Free tier', 'Standard', 'High', 'Custom'] },
      { name: 'Public REST API', values: ['Read-only', '✓', '✓', '✓'] },
      { name: 'Webhooks', values: ['—', '—', '✓', '✓'] },
      { name: 'Custom integrations', values: ['—', '—', '✓', '✓'] },
    ],
  },
  {
    name: 'Security & admin',
    features: [
      { name: 'Two-factor authentication', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Roles & permissions', values: ['Basic', 'Basic', 'Advanced', 'Custom'] },
      { name: 'SAML SSO', values: ['—', '—', '—', '✓'] },
      { name: 'Audit logs', values: ['—', '—', '—', '✓'] },
      { name: 'Data export', values: ['✓', '✓', '✓', '✓'] },
      { name: 'GDPR tools', values: ['✓', '✓', '✓', '✓'] },
    ],
  },
  {
    name: 'Support',
    features: [
      { name: 'Community help', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Email support', values: ['✓', '✓', '✓', '✓'] },
      { name: 'Priority support', values: ['—', '—', '✓', '✓'] },
      { name: 'Dedicated contact', values: ['—', '—', '—', '✓'] },
      { name: 'Custom SLA', values: ['—', '—', '—', '✓'] },
      { name: 'Onboarding', values: ['Self-serve', 'Self-serve', 'Guided', 'Dedicated'] },
    ],
  },
]

export const faqItems: FaqItem[] = [
  {
    question: 'Which plan is right for me?',
    answer:
      'The Free plan is perfect for individuals getting started across the Oxy ecosystem. Plus is ideal for small teams, Pro for growing teams that need higher limits and custom agents, and Enterprise for organizations with specific security or compliance needs.',
  },
  {
    question: 'Is Oxy free to use?',
    answer:
      'Yes. Most Oxy apps are free and open source — you can self-host or use our hosted Free tier with no credit card. Paid plans cover hosting, support, higher usage limits, and team features.',
  },
  {
    question: 'How does AI usage work?',
    answer:
      'Each plan includes a monthly allowance of agent runs for Oxy AI (Alia). Heavier workloads can purchase additional usage or bring their own model on Pro and Enterprise plans.',
  },
  {
    question: 'Do you offer discounts?',
    answer:
      'Yes. Annual billing saves on every paid plan. We also offer special pricing for non-profits, students, and open-source contributors — get in touch.',
  },
  {
    question: 'What are my payment options?',
    answer:
      'We accept major credit cards and can arrange invoice-based billing for Enterprise plans. FairCoin and other crypto payment options are coming.',
  },
]
