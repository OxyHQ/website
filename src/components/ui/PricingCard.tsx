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
          ? 'border-primary/40 bg-surface'
          : 'border-border bg-surface'
      }`}
    >
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {tier.name}
      </h3>
      <p className="mt-3 text-heading-md text-foreground">
        {tier.credits}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{tier.creditLabel}</p>
      <Button variant={tier.highlighted ? 'primary' : 'outline'} size="md" className="mt-6 w-full">
        Get started
      </Button>
    </div>
  )
}
