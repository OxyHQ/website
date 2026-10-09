import { useState } from 'react'
import { Textarea } from '@oxy.so/bloom/textarea'

export default function TextareaExample() {
  const [value,setValue]=useState("")
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Textarea value={value} onChangeText={setValue} placeholder="Write your thoughts…" />
    </div>
  )
}
