import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  {
    name: 'type',
    kind: 'select',
    options: ['single', 'multiple'],
    default: 'single',
  },
  { name: 'firstLabel', kind: 'text', default: 'Section one' },
  { name: 'firstBody', kind: 'text', default: 'Body of section one.' },
  { name: 'secondLabel', kind: 'text', default: 'Section two' },
  { name: 'secondBody', kind: 'text', default: 'Body of section two.' },
]
