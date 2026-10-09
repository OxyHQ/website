import { useState } from 'react'
import { RadioGroup } from '@oxy.so/bloom/radio'

export default function RadioExample() {
  const [value,setValue]=useState("personal")
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <RadioGroup options={[{value:"personal",label:"Personal"},{value:"team",label:"Team"}]} value={value} onValueChange={setValue} />
    </div>
  )
}
