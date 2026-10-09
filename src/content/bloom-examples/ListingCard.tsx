import { ListingCard } from '@oxy.so/bloom/listing-card'

export default function ListingCardExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ListingCard title="A bright place to call home" photos={["/images/pricing/oxy-one-hero.png"]} />
    </div>
  )
}
