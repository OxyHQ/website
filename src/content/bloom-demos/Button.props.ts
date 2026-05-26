import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  {
    name: 'variant',
    kind: 'select',
    options: ['primary', 'secondary', 'inverse', 'icon', 'ghost', 'text'],
    default: 'primary',
  },
  {
    name: 'size',
    kind: 'select',
    options: ['small', 'medium', 'large'],
    default: 'medium',
  },
  { name: 'disabled', kind: 'boolean', default: false },
  { name: 'children', kind: 'text', default: 'Click me' },
]
