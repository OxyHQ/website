import type { PlaygroundProp } from './_playground';

export const props: PlaygroundProp[] = [
  {
    name: 'appearance',
    kind: 'select',
    options: ['solid', 'subtle', 'outline', 'plain'],
    default: 'solid',
  },
  { name: 'title', kind: 'text', default: 'Card title' },
  { name: 'description', kind: 'text', default: 'Short description goes here.' },
  { name: 'body', kind: 'text', default: 'Card body content.' },
];
