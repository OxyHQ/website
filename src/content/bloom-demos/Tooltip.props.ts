import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  {
    name: 'position',
    kind: 'select',
    options: ['top', 'bottom'],
    default: 'top',
  },
  { name: 'visible', kind: 'boolean', default: true },
  { name: 'label', kind: 'text', default: 'Helpful tooltip' },
]
