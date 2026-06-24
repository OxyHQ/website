import { useState } from 'react'
import { Select, SelectTrigger, SelectValue, SelectIcon, SelectContent, SelectItem, SelectItemText, SelectItemIndicator } from '@oxyhq/bloom/select'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Dropdown picker backed by a controlled value and item list.',
}

interface Item {
  value: string
  label: string
}

const items: Item[] = [
  { value: 'low', label: 'Low priority' },
  { value: 'medium', label: 'Medium priority' },
  { value: 'high', label: 'High priority' },
  { value: 'critical', label: 'Critical' },
]

export default function SelectDemo() {
  const [value, setValue] = useState('medium')
  return (
    <div className="w-full max-w-xs">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger label="Priority">
          <SelectValue placeholder="Select priority">
            {(selected) =>
              selected && typeof selected === 'object' && 'label' in selected
                ? (selected as Item).label
                : 'Select priority'
            }
          </SelectValue>
          <SelectIcon />
        </SelectTrigger>
        <SelectContent
          items={items}
          label="Priority"
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemText>{item.label}</SelectItemText>
              <SelectItemIndicator />
            </SelectItem>
          )}
        />
      </Select>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const initial = typeof values.value === 'string' ? values.value : 'medium'
  const label = typeof values.label === 'string' ? values.label : 'Priority'
  const disabled = values.disabled === true
  const [value, setValue] = useState(initial)
  const [lastInitial, setLastInitial] = useState(initial)
  if (initial !== lastInitial) {
    setLastInitial(initial)
    setValue(initial)
  }
  return (
    <div style={{ width: 240 }}>
      <Select value={value} onValueChange={setValue} disabled={disabled}>
        <SelectTrigger label={label}>
          <SelectValue placeholder={label}>
            {(selected) =>
              selected && typeof selected === 'object' && 'label' in selected
                ? (selected as Item).label
                : label
            }
          </SelectValue>
          <SelectIcon />
        </SelectTrigger>
        <SelectContent
          items={items}
          label={label}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemText>{item.label}</SelectItemText>
              <SelectItemIndicator />
            </SelectItem>
          )}
        />
      </Select>
    </div>
  )
}
