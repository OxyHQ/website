import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  { name: 'value', kind: 'boolean', default: true },
  {
    name: 'size',
    kind: 'select',
    options: ['default', 'sm'],
    default: 'default',
  },
  { name: 'disabled', kind: 'boolean', default: false },
]
