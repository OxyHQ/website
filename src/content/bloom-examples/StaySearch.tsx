import { useState } from 'react'
import { DateFlexibilityChips } from '@oxy.so/bloom/stay-search'

export default function StaySearchExample() {
  const [value,setValue]=useState("exact")
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <DateFlexibilityChips value={value} onChange={setValue} />
    </div>
  )
}
