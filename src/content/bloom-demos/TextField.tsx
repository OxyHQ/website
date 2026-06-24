import { useState } from 'react'
import { TextField, TextFieldInput } from '@oxyhq/bloom/text-field'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Labelled text input with focus / error chrome.',
}

export default function TextFieldDemo() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('alex@example.com')
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <TextField>
        <TextFieldInput label="Full name" value={name} onChangeText={setName} placeholder="Ada Lovelace" />
      </TextField>
      <TextField>
        <TextFieldInput label="Email" value={email} onChangeText={setEmail} />
      </TextField>
      <TextField isInvalid>
        <TextFieldInput label="Username" value="taken" onChangeText={() => undefined} isInvalid />
      </TextField>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const label = typeof values.label === 'string' ? values.label : 'Label'
  const value = typeof values.value === 'string' ? values.value : ''
  const placeholder = typeof values.placeholder === 'string' ? values.placeholder : undefined
  const isInvalid = values.isInvalid === true
  const [text, setText] = useState(value)
  // Reset internal state when the knob's "value" changes via derived state.
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setText(value)
  }
  return (
    <div style={{ width: 280 }}>
      <TextField isInvalid={isInvalid}>
        <TextFieldInput
          label={label}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          isInvalid={isInvalid}
        />
      </TextField>
    </div>
  )
}
