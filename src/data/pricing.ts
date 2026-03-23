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

export const faqItems: FaqItem[] = [
  { question: 'Which plan is right for me?', answer: 'The Free plan is perfect for individuals getting started. Plus is ideal for small teams, Pro for growing teams that need advanced features like Call Intelligence, and Enterprise for organizations with specific security and compliance needs.' },
  { question: 'Does Oxy have a free trial?', answer: 'Yes! All paid plans come with a 14-day free trial of Pro. No credit card required. You can explore all Pro features before making a decision.' },
  { question: 'How does billing work?', answer: 'You can choose monthly or annual billing. Annual billing saves you 20% compared to monthly. You can upgrade, downgrade, or cancel at any time.' },
  { question: 'What are AI credits?', answer: 'AI credits power Ask Oxy and other AI features. Each plan includes a set number of credits per seat per month. Credits reset monthly and do not roll over.' },
  { question: 'Can I change plans later?', answer: 'Absolutely. You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the end of your billing period.' },
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and can arrange invoice-based billing for Enterprise plans.' },
]
