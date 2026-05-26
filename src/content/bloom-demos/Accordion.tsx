import { useState } from 'react'
import * as Accordion from '@oxyhq/bloom/accordion'
import type { PlaygroundValues } from './_playground'

type AccordionType = 'single' | 'multiple'

export const meta = {
  description: 'Collapsible content sections, single or multiple expanded items.',
}

export default function AccordionDemo() {
  const [open, setOpen] = useState<string | string[] | undefined>('first')
  return (
    <div className="w-full max-w-md">
      <Accordion.Accordion type="single" value={open} onValueChange={setOpen}>
        <Accordion.AccordionItem value="first">
          <Accordion.AccordionTrigger>What is Bloom?</Accordion.AccordionTrigger>
          <Accordion.AccordionContent>
            <p>Bloom is the shared UI component library across the Oxy ecosystem.</p>
          </Accordion.AccordionContent>
        </Accordion.AccordionItem>
        <Accordion.AccordionItem value="second">
          <Accordion.AccordionTrigger>Does it work on the web?</Accordion.AccordionTrigger>
          <Accordion.AccordionContent>
            <p>Yes — every component has a web-forked implementation tuned for React DOM.</p>
          </Accordion.AccordionContent>
        </Accordion.AccordionItem>
        <Accordion.AccordionItem value="third">
          <Accordion.AccordionTrigger>Can I theme it?</Accordion.AccordionTrigger>
          <Accordion.AccordionContent>
            <p>Wrap your app in BloomThemeProvider with a colorPreset and Bloom does the rest.</p>
          </Accordion.AccordionContent>
        </Accordion.AccordionItem>
      </Accordion.Accordion>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const type = values.type === 'multiple' ? 'multiple' : 'single'
  const firstLabel = typeof values.firstLabel === 'string' ? values.firstLabel : ''
  const firstBody = typeof values.firstBody === 'string' ? values.firstBody : ''
  const secondLabel = typeof values.secondLabel === 'string' ? values.secondLabel : ''
  const secondBody = typeof values.secondBody === 'string' ? values.secondBody : ''
  const [open, setOpen] = useState<string | string[] | undefined>(
    type === 'multiple' ? ['first'] : 'first',
  )
  const [lastType, setLastType] = useState<AccordionType>(type)
  if (type !== lastType) {
    setLastType(type)
    setOpen(type === 'multiple' ? ['first'] : 'first')
  }
  return (
    <div style={{ width: 360 }}>
      <Accordion.Accordion type={type} value={open} onValueChange={setOpen}>
        <Accordion.AccordionItem value="first">
          <Accordion.AccordionTrigger>{firstLabel}</Accordion.AccordionTrigger>
          <Accordion.AccordionContent>
            <p>{firstBody}</p>
          </Accordion.AccordionContent>
        </Accordion.AccordionItem>
        <Accordion.AccordionItem value="second">
          <Accordion.AccordionTrigger>{secondLabel}</Accordion.AccordionTrigger>
          <Accordion.AccordionContent>
            <p>{secondBody}</p>
          </Accordion.AccordionContent>
        </Accordion.AccordionItem>
      </Accordion.Accordion>
    </div>
  )
}
