import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  { name: 'name', kind: 'text', default: 'Ada Lovelace' },
  { name: 'size', kind: 'number', default: 56, min: 16, max: 160, step: 4 },
  {
    name: 'shape',
    kind: 'select',
    options: ['circle', 'squircle'],
    default: 'circle',
  },
  { name: 'verified', kind: 'boolean', default: false },
  { name: 'source', kind: 'text', default: '' },
]
