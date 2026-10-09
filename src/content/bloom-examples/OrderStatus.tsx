import { OrderStatusBar } from '@oxy.so/bloom/order-status'

export default function OrderStatusExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <OrderStatusBar status="On the way" />
    </div>
  )
}
