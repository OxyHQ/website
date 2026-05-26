import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  { name: 'label', kind: 'text', default: 'Label' },
  { name: 'value', kind: 'text', default: '' },
  { name: 'placeholder', kind: 'text', default: 'Type here…' },
  { name: 'isInvalid', kind: 'boolean', default: false },
]
