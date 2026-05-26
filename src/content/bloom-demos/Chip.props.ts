import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  { name: 'children', kind: 'text', default: 'Chip' },
  {
    name: 'variant',
    kind: 'select',
    options: ['solid', 'outlined', 'soft'],
    default: 'solid',
  },
  {
    name: 'color',
    kind: 'select',
    options: ['default', 'primary', 'success', 'warning', 'error'],
    default: 'default',
  },
  {
    name: 'size',
    kind: 'select',
    options: ['small', 'medium', 'large'],
    default: 'medium',
  },
  { name: 'selected', kind: 'boolean', default: false },
  { name: 'disabled', kind: 'boolean', default: false },
]
