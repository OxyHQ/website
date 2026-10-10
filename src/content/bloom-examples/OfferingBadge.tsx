import { OfferingBadge } from '@oxy.so/bloom/offering-badge';

export default function OfferingBadgeExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="flex flex-wrap gap-3">
        <OfferingBadge offering="long_term_rent" />
        <OfferingBadge offering="sale" />
        <OfferingBadge offering="exchange" />
      </div>
    </div>
  );
}
