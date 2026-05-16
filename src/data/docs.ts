export interface DocsSidebarItem {
  label: string;
  href: string;
  children?: DocsSidebarItem[];
}

export interface DocsSidebarSection {
  title: string;
  items: DocsSidebarItem[];
}

// All "#" hrefs route to the docs overview until detail pages exist.
const DOCS_OVERVIEW = '/developers/docs'

export const docsSidebar: DocsSidebarSection[] = [
  {
    title: 'Get started',
    items: [
      { label: 'Overview', href: DOCS_OVERVIEW },
      { label: 'Quickstart', href: DOCS_OVERVIEW },
      { label: 'Development', href: DOCS_OVERVIEW },
      { label: 'Authentication', href: DOCS_OVERVIEW },
    ],
  },
  {
    title: 'App SDK',
    items: [
      { label: 'Creating an app', href: DOCS_OVERVIEW },
      { label: 'UI components', href: DOCS_OVERVIEW },
      { label: 'Server functions', href: DOCS_OVERVIEW },
      { label: 'Publishing', href: DOCS_OVERVIEW },
    ],
  },
  {
    title: 'REST API',
    items: [
      { label: 'Overview', href: DOCS_OVERVIEW },
      { label: 'Workspaces', href: DOCS_OVERVIEW },
      { label: 'Records', href: DOCS_OVERVIEW },
      { label: 'Collections', href: DOCS_OVERVIEW },
      { label: 'Fields', href: DOCS_OVERVIEW },
      { label: 'Notes', href: DOCS_OVERVIEW },
      { label: 'Tasks', href: DOCS_OVERVIEW },
      { label: 'Webhooks', href: DOCS_OVERVIEW },
    ],
  },
  {
    title: 'MCP',
    items: [
      { label: 'Overview', href: DOCS_OVERVIEW },
      { label: 'Configuration', href: DOCS_OVERVIEW },
      { label: 'Tools reference', href: DOCS_OVERVIEW },
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
    href: DOCS_OVERVIEW,
    icon: 'react',
  },
  {
    title: 'REST API',
    description:
      'Build apps that read and write information to and from Oxy workspaces. Subscribe to events in realtime using webhooks.',
    href: DOCS_OVERVIEW,
    icon: 'server',
  },
  {
    title: 'MCP',
    description:
      'Manage Oxy via AI agents. Connect Oxy AI (Alia) or your AI tool of choice to search, update and manage your Oxy workspace.',
    href: DOCS_OVERVIEW,
    icon: 'sparkles',
  },
];
