import { CheckoutSummary, CheckoutSummaryRow } from '@oxy.so/bloom/checkout-summary';

export default function CheckoutSummaryExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <CheckoutSummary>
        <CheckoutSummaryRow label="Subtotal" value="$48.00" />
        <CheckoutSummaryRow label="Delivery" value="$4.00" />
        <CheckoutSummaryRow label="Total" value="$52.00" />
      </CheckoutSummary>
    </div>
  );
}
