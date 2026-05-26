import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  { name: 'thickness', kind: 'number', default: 1, min: 1, max: 8, step: 1 },
  { name: 'vertical', kind: 'boolean', default: false },
  { name: 'spacing', kind: 'number', default: 8, min: 0, max: 32, step: 1 },
]
