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
    options: ['xs', 'sm', 'md', 'lg'],
    default: 'md',
  },
  {
    name: 'tone',
    kind: 'select',
    options: ['accent', 'neutral', 'success', 'warning', 'danger', 'info'],
    default: 'accent',
  },
  { name: 'text', kind: 'text', default: 'Loading…' },
]
