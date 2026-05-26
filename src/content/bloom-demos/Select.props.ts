import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  {
    name: 'value',
    kind: 'select',
    options: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  { name: 'label', kind: 'text', default: 'Priority' },
  { name: 'disabled', kind: 'boolean', default: false },
]
