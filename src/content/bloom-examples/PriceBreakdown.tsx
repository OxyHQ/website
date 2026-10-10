import { PriceSummaryLine } from '@oxy.so/bloom/price-breakdown';

export default function PriceBreakdownExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <>
        <PriceSummaryLine label="Subtotal" amount="$48.00" />
        <PriceSummaryLine label="Delivery" amount="$4.00" />
      </>
    </div>
  );
}
