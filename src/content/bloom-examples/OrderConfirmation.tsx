import { OrderConfirmation } from '@oxy.so/bloom/order-confirmation'

export default function OrderConfirmationExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <OrderConfirmation title="Order confirmed" />
    </div>
  )
}
