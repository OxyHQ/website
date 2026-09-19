import { useState } from 'react'
import { Slider } from '@oxy.so/bloom/slider'
import type { PlaygroundValues } from './_playground'
export const meta = { description: 'Choose a value with keyboard, pointer or touch.' }
export default function SliderDemo() {
  return <Playground values={{ disabled: false }} />
}
export function Playground({ values }: { values: PlaygroundValues }) {
  const [value, setValue] = useState(40)
  return (
    <div className="w-full max-w-xs space-y-5">
      <p className="text-sm">Volume · {value}%</p>
      <Slider
        value={value}
        onValueChange={setValue}
        min={0}
        max={100}
        step={5}
        disabled={values.disabled === true}
        accessibilityLabel="Volume"
      />
    </div>
  )
}
