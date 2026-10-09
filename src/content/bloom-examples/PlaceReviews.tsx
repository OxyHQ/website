import { PlaceReviewCard } from '@oxy.so/bloom/place-reviews'

export default function PlaceReviewsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <PlaceReviewCard authorLabel="Alex Rivera" rating={5} text="A calm space, warm welcome and a lovely garden." />
    </div>
  )
}
