import { useState } from 'react'
import { RatingInput } from '@oxy.so/bloom/rating'

export default function RatingExample() {
  const [value,setValue]=useState<number|null>(4)
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <RatingInput value={value} onChange={setValue} />
    </div>
  )
}
