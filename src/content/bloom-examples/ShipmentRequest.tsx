import { useState } from 'react'
import { ShipmentLoadPicker } from '@oxy.so/bloom/shipment-request'

export default function ShipmentRequestExample() {
  const [value,setValue]=useState<import("@oxy.so/bloom/shipment-request").ShipmentLoad>({kind:"parcel",size:"small",weight:"2",quantity:1})
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><ShipmentLoadPicker value={value} onValueChange={setValue} /></div>)
}
