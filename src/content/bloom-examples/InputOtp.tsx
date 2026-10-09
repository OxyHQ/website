import { useState } from 'react'
import { InputOtp } from '@oxy.so/bloom/input-otp'

export default function InputOtpExample() {
  const [value,setValue]=useState("123")
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <InputOtp value={value} onChange={setValue} />
    </div>
  )
}
