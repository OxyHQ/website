import { useState } from 'react';
import { DeliverySlotOption } from '@oxy.so/bloom/delivery-slot';

export default function DeliverySlotExample() {
  const [selected, setSelected] = useState(true);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <DeliverySlotOption
        label="Tomorrow, 9:00–12:00"
        selected={selected}
        onPress={() => setSelected(!selected)}
      />
    </div>
  );
}
