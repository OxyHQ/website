import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  {
    name: 'variant',
    kind: 'select',
    options: ['spinner', 'inline'],
    default: 'spinner',
  },
  {
    name: 'size',
    kind: 'select',
    options: ['small', 'medium', 'large'],
    default: 'medium',
  },
  { name: 'text', kind: 'text', default: 'Loading…' },
]
