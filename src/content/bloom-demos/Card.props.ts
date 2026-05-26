import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  {
    name: 'variant',
    kind: 'select',
    options: ['elevated', 'outlined', 'filled'],
    default: 'elevated',
  },
  { name: 'title', kind: 'text', default: 'Card title' },
  { name: 'description', kind: 'text', default: 'Short description goes here.' },
  { name: 'body', kind: 'text', default: 'Card body content.' },
]
