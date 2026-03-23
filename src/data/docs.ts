export interface DocsSidebarItem {
  label: string;
  href: string;
  children?: DocsSidebarItem[];
}

export interface DocsSidebarSection {
  title: string;
  items: DocsSidebarItem[];
}

export const docsSidebar: DocsSidebarSection[] = [
  {
    title: 'Get started',
    items: [
      { label: 'Overview', href: '/developers/docs' },
      { label: 'Quickstart', href: '#' },
      { label: 'Development', href: '#' },
      { label: 'Authentication', href: '#' },
    ],
  },
  {
    title: 'App SDK',
    items: [
      { label: 'Creating an app', href: '#' },
      { label: 'UI components', href: '#' },
      { label: 'Server functions', href: '#' },
      { label: 'Publishing', href: '#' },
    ],
  },
  {
    title: 'REST API',
    items: [
      { label: 'Overview', href: '#' },
      { label: 'Objects', href: '#' },
      { label: 'Records', href: '#' },
      { label: 'Lists', href: '#' },
      { label: 'Attributes', href: '#' },
      { label: 'Notes', href: '#' },
      { label: 'Tasks', href: '#' },
      { label: 'Webhooks', href: '#' },
    ],
  },
  {
    title: 'MCP',
    items: [
      { label: 'Overview', href: '#' },
      { label: 'Configuration', href: '#' },
      { label: 'Tools reference', href: '#' },
    ],
  },
];

export interface DocsCard {
  title: string;
  description: string;
  href: string;
  icon: 'react' | 'server' | 'sparkles';
}

export const docsCards: DocsCard[] = [
  {
    title: 'App SDK',
    description:
      'Build Typescript React applications within the Oxy interface and run server functions with access to our REST API.',
    href: '#',
    icon: 'react',
  },
  {
    title: 'REST API',
    description:
      'Build apps that read and write information to and from Oxy workspaces. Subscribe to events in realtime using webhooks.',
    href: '#',
    icon: 'server',
  },
  {
    title: 'MCP',
    description:
      'Manage Oxy via AI. Connect Claude, ChatGPT or your AI tool of choice to search, update and manage your Oxy workspace.',
    href: '#',
    icon: 'sparkles',
  },
];
