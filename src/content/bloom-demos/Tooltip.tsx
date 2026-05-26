import { useState } from 'react'
import * as Tooltip from '@oxyhq/bloom/tooltip'
import { PrimaryButton } from '@oxyhq/bloom/button'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Floating hint anchored to a target element, controlled visibility.',
}

export default function TooltipDemo() {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex items-center justify-center p-6">
      <Tooltip.Outer visible={visible} onVisibleChange={setVisible} position="top">
        <Tooltip.Target>
          <span
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onBlur={() => setVisible(false)}
          >
            <PrimaryButton onPress={() => setVisible((v) => !v)}>Hover me</PrimaryButton>
          </span>
        </Tooltip.Target>
        <Tooltip.Content label="Helpful tooltip">
          <Tooltip.TextBubble>Helpful tooltip</Tooltip.TextBubble>
        </Tooltip.Content>
      </Tooltip.Outer>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const position = values.position === 'bottom' ? 'bottom' : 'top'
  const label = typeof values.label === 'string' ? values.label : 'Tooltip'
  const initial = values.visible === true
  const [visible, setVisible] = useState(initial)
  const [lastInitial, setLastInitial] = useState(initial)
  if (initial !== lastInitial) {
    setLastInitial(initial)
    setVisible(initial)
  }
  return (
    <Tooltip.Outer visible={visible} onVisibleChange={setVisible} position={position}>
      <Tooltip.Target>
        <span
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          onFocus={() => setVisible(true)}
          onBlur={() => setVisible(false)}
        >
          <PrimaryButton onPress={() => setVisible((v) => !v)}>Hover target</PrimaryButton>
        </span>
      </Tooltip.Target>
      <Tooltip.Content label={label}>
        <Tooltip.TextBubble>{label}</Tooltip.TextBubble>
      </Tooltip.Content>
    </Tooltip.Outer>
  )
}
