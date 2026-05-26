import { useState } from 'react'
import { Checkbox } from '@oxyhq/bloom/checkbox'
import type { CheckboxSize } from '@oxyhq/bloom/checkbox'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Multi-select control with optional label and indeterminate state.',
}

export default function CheckboxDemo() {
  const [terms, setTerms] = useState(false)
  const [marketing, setMarketing] = useState(true)
  return (
    <div className="flex flex-col gap-3">
      <Checkbox
        checked={terms}
        onCheckedChange={setTerms}
        label="I agree to the terms"
        description="By checking this box you accept the platform terms of service."
      />
      <Checkbox
        checked={marketing}
        onCheckedChange={setMarketing}
        label="Receive product updates"
      />
      <Checkbox
        checked={false}
        onCheckedChange={() => undefined}
        label="Disabled option"
        disabled
      />
      <Checkbox
        checked={false}
        indeterminate
        onCheckedChange={() => undefined}
        label="Indeterminate"
      />
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const initial = values.checked === true
  const label = typeof values.label === 'string' ? values.label : ''
  const description = typeof values.description === 'string' ? values.description : ''
  const size = values.size as CheckboxSize
  const disabled = values.disabled === true
  const indeterminate = values.indeterminate === true
  const [checked, setChecked] = useState(initial)
  const [lastInitial, setLastInitial] = useState(initial)
  if (initial !== lastInitial) {
    setLastInitial(initial)
    setChecked(initial)
  }
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={setChecked}
      label={label || undefined}
      description={description || undefined}
      size={size}
      disabled={disabled}
      indeterminate={indeterminate}
    />
  )
}
