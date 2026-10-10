import type { PlaygroundProp } from './_playground';

export const props: PlaygroundProp[] = [
  { name: 'children', kind: 'text', default: 'Chip' },
  {
    name: 'appearance',
    kind: 'select',
    options: ['solid', 'subtle', 'outline', 'plain'],
    default: 'subtle',
  },
  {
    name: 'tone',
    kind: 'select',
    options: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'],
    default: 'neutral',
  },
  {
    name: 'size',
    kind: 'select',
    options: ['xs', 'sm', 'md', 'lg'],
    default: 'md',
  },
  { name: 'checked', kind: 'boolean', default: false },
  { name: 'disabled', kind: 'boolean', default: false },
];
