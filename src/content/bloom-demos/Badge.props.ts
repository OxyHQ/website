import type { PlaygroundProp } from './_playground';

export const props: PlaygroundProp[] = [
  { name: 'content', kind: 'text', default: 'New' },
  {
    name: 'appearance',
    kind: 'select',
    options: ['solid', 'subtle', 'outline', 'plain'],
    default: 'solid',
  },
  {
    name: 'tone',
    kind: 'select',
    options: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'],
    default: 'accent',
  },
  {
    name: 'size',
    kind: 'select',
    options: ['xs', 'sm', 'md', 'lg'],
    default: 'md',
  },
  { name: 'dot', kind: 'boolean', default: false },
];
