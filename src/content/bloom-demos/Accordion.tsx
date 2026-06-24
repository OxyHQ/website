import { useState } from 'react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@oxyhq/bloom/accordion'
import type { PlaygroundValues } from './_playground'

type AccordionType = 'single' | 'multiple'

export const meta = {
  description: 'Collapsible content sections, single or multiple expanded items.',
}

export default function AccordionDemo() {
  const [open, setOpen] = useState<string | string[] | undefined>('first')
  return (
    <div className="w-full max-w-md">
      <Accordion type="single" value={open} onValueChange={setOpen}>
        <AccordionItem value="first">
          <AccordionTrigger>What is Bloom?</AccordionTrigger>
          <AccordionContent>
            <p>Bloom is the shared UI component library across the Oxy ecosystem.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="second">
          <AccordionTrigger>Does it work on the web?</AccordionTrigger>
          <AccordionContent>
            <p>Yes — every component has a web-forked implementation tuned for React DOM.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="third">
          <AccordionTrigger>Can I theme it?</AccordionTrigger>
          <AccordionContent>
            <p>Wrap your app in BloomThemeProvider with a colorPreset and Bloom does the rest.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
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
      <Accordion type={type} value={open} onValueChange={setOpen}>
        <AccordionItem value="first">
          <AccordionTrigger>{firstLabel}</AccordionTrigger>
          <AccordionContent>
            <p>{firstBody}</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="second">
          <AccordionTrigger>{secondLabel}</AccordionTrigger>
          <AccordionContent>
            <p>{secondBody}</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
