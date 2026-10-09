import { BookingCard } from '@oxy.so/bloom/booking'

export default function BookingExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <BookingCard guests="2 guests" price="$120" />
    </div>
  )
}
