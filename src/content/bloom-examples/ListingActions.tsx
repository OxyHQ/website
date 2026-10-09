import { ActionBar } from '@oxy.so/bloom/listing-actions'

export default function ListingActionsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ActionBar primaryLabel="Contact host" price="$950 / month" />
    </div>
  )
}
