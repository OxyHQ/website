import { useState } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipTextBubble } from '@oxy.so/bloom/tooltip'
import { Button } from '@oxy.so/bloom/button'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Floating hint anchored to a target element, controlled visibility.',
}

export default function TooltipDemo() {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex items-center justify-center p-6">
      <Tooltip visible={visible} onVisibleChange={setVisible} position="top">
        <TooltipTrigger>
          <span
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onBlur={() => setVisible(false)}
          >
            <Button appearance="solid" tone="accent" onPress={() => setVisible((v) => !v)}>Hover me</Button>
          </span>
        </TooltipTrigger>
        <TooltipContent label="Helpful tooltip">
          <TooltipTextBubble>Helpful tooltip</TooltipTextBubble>
        </TooltipContent>
      </Tooltip>
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
    <Tooltip visible={visible} onVisibleChange={setVisible} position={position}>
      <TooltipTrigger>
        <span
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          onFocus={() => setVisible(true)}
          onBlur={() => setVisible(false)}
        >
          <Button appearance="solid" tone="accent" onPress={() => setVisible((v) => !v)}>Hover target</Button>
        </span>
      </TooltipTrigger>
      <TooltipContent label={label}>
        <TooltipTextBubble>{label}</TooltipTextBubble>
      </TooltipContent>
    </Tooltip>
  )
}
