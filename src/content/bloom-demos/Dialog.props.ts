import type { PlaygroundProp } from './_playground'

export const props: PlaygroundProp[] = [
  { name: 'title', kind: 'text', default: 'Confirm action' },
  {
    name: 'description',
    kind: 'text',
    default: "This will remove the selected item.",
  },
  { name: 'confirmLabel', kind: 'text', default: 'Delete' },
  { name: 'cancelLabel', kind: 'text', default: 'Cancel' },
]
