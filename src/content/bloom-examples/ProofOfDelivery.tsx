import { SignaturePad } from '@oxy.so/bloom/proof-of-delivery'

export default function ProofOfDeliveryExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <SignaturePad />
    </div>
  )
}
