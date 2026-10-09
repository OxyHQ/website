import { PaymentStatusBlock } from '@oxy.so/bloom/payment-status'

export default function PaymentStatusExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <PaymentStatusBlock state="paid" />
    </div>
  )
}
