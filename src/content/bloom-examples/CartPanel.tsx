import { useState } from 'react'
import { CartPanel } from '@oxy.so/bloom/cart-panel'
import { Button } from '@oxy.so/bloom/button'

export default function CartPanelExample() {
  const [quantity, setQuantity] = useState(1)
  const amount = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(28 * quantity)
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <CartPanel
        vendorName="The Oxy Store"
        lines={quantity ? [{ id: 'tote', name: 'Everyday tote', price: amount, quantity }] : []}
        onLineQuantityChange={(_, value) => setQuantity(value)}
        onLineRemove={() => setQuantity(0)}
        removeInStepper
        summary={{ lines: [], total: { label: 'Demo total', amount } }}
        emptyDescription="Add an example item to try the quantity controls."
      />
      {!quantity && <Button onPress={() => setQuantity(1)}>Add example item</Button>}
    </div>
  )
}
