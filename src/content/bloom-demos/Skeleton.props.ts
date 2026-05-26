import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  { name: 'lines', kind: 'number', default: 3, min: 1, max: 8, step: 1 },
  { name: 'lineHeight', kind: 'number', default: 14, min: 4, max: 32, step: 1 },
  { name: 'avatar', kind: 'boolean', default: true },
]
