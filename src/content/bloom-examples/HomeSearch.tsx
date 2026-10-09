import { useState } from 'react'
import { BudgetPicker } from '@oxy.so/bloom/home-search'

export default function HomeSearchExample() {
  const [value,setValue]=useState<[number|null,number|null]>([500,1500])
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <BudgetPicker value={value} onValueChange={setValue} />
    </div>
  )
}
