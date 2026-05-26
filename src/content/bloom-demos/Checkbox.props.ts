import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  { name: 'checked', kind: 'boolean', default: false },
  { name: 'label', kind: 'text', default: 'I agree to the terms' },
  { name: 'description', kind: 'text', default: '' },
  {
    name: 'size',
    kind: 'select',
    options: ['small', 'medium', 'large'],
    default: 'medium',
  },
  { name: 'disabled', kind: 'boolean', default: false },
  { name: 'indeterminate', kind: 'boolean', default: false },
]
