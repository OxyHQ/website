import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  {
    name: 'appearance',
    kind: 'select',
    options: ['solid', 'subtle', 'outline', 'plain'],
    default: 'solid',
  },
  {
    name: 'tone',
    kind: 'select',
    options: ['accent', 'neutral', 'danger', 'success', 'warning', 'info'],
    default: 'accent',
  },
  {
    name: 'size',
    kind: 'select',
    options: ['xs', 'sm', 'md', 'lg'],
    default: 'md',
  },
  { name: 'disabled', kind: 'boolean', default: false },
  { name: 'children', kind: 'text', default: 'Click me' },
]
