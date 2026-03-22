import type { PricingTier } from '../../data/content'
import Button from './Button'

interface PricingCardProps {
  tier: PricingTier
}

export default function PricingCard({ tier }: PricingCardProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border p-8 text-center ${
        tier.highlighted
          ? 'border-[var(--color-blue-400)]/40 bg-[var(--color-surface-subtle)]'
          : 'border-[var(--color-subtle-stroke)] bg-[var(--color-secondary-bg)]'
      }`}
    >
      <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--color-accent-fg)]">
        {tier.name}
      </h3>
      <p className="mt-3 text-heading-md text-[var(--color-primary-fg)]">
        {tier.credits}
      </p>
      <p className="mt-1 text-sm text-[var(--color-tertiary-fg)]">{tier.creditLabel}</p>
      <Button variant={tier.highlighted ? 'primary' : 'outline'} size="md" className="mt-6 w-full">
        Get started
      </Button>
    </div>
  )
}
