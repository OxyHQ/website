import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  {
    name: 'variant',
    kind: 'select',
    options: ['underline', 'filled', 'outlined'],
    default: 'underline',
  },
  {
    name: 'value',
    kind: 'select',
    options: ['overview', 'activity', 'settings'],
    default: 'overview',
  },
]
