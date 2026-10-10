import type { PlaygroundProp } from './_playground';

export const props: PlaygroundProp[] = [
  { name: 'checked', kind: 'boolean', default: true },
  {
    name: 'size',
    kind: 'select',
    options: ['sm', 'md'],
    default: 'md',
  },
  { name: 'disabled', kind: 'boolean', default: false },
];
