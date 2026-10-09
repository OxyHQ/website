import { AddressRow } from '@oxy.so/bloom/address'

export default function AddressExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <AddressRow title="Home" subtitle="12 Garden Street, Barcelona" />
    </div>
  )
}
