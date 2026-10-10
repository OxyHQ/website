import { PaymentMethodRow } from '@oxy.so/bloom/payment-method';

export default function PaymentMethodExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <PaymentMethodRow scheme="Aurora" masked="•••• 4242" />
    </div>
  );
}
