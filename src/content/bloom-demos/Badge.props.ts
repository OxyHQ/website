import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  { name: 'content', kind: 'text', default: 'New' },
  {
    name: 'variant',
    kind: 'select',
    options: ['solid', 'subtle', 'outlined'],
    default: 'solid',
  },
  {
    name: 'color',
    kind: 'select',
    options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
    default: 'primary',
  },
  {
    name: 'size',
    kind: 'select',
    options: ['small', 'medium', 'large'],
    default: 'medium',
  },
  { name: 'dot', kind: 'boolean', default: false },
]
