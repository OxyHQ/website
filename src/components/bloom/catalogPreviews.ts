import type { BloomDemoName } from './BloomPreview';

export interface CatalogPreview {
  name: BloomDemoName;
  title: string;
  description: string;
  width: number;
  height: number;
  /** Some reference thumbnails crop a full-size component instead of shrinking it. */
  thumbnailScale?: number;
}

// Reuse the landing's real Bloom compositions in the component documentation.
// Keys are published subpaths, so every preview links to its actual API.
export const catalogPreviews: Record<string, CatalogPreview> = {
  'multi-agent-chat': {
    name: 'multi-agent',
    title: 'Multi-agent chat',
    description:
      'Group conversations with an agent library, animated avatars and a live profile editor.',
    width: 1258,
    height: 720,
  },
  'project-board': {
    name: 'project-board',
    title: 'Project board',
    description: 'Move tickets between columns, create tasks and edit their details.',
    width: 1100,
    height: 650,
  },
  'composer-loader': {
    name: 'loader',
    title: 'Composer loader',
    description: 'An orbiting light band for a working composer.',
    width: 560,
    height: 90,
  },
  'composer-panel': {
    name: 'attachments',
    title: 'Composer attachments',
    description: 'A prompt with file uploads, models and permission controls.',
    width: 699,
    height: 250,
  },
  'agent-thinking': {
    name: 'thinking',
    title: 'Agent thinking',
    description: 'Animated thinking, searching and writing indicators.',
    width: 260,
    height: 154,
  },
  'agent-progress': {
    name: 'progress',
    title: 'Agent progress',
    description: 'Follow each step as an agent completes its work.',
    width: 341,
    height: 220,
  },
  'agent-limits-card': {
    name: 'limits',
    title: 'Agent limits',
    description: 'Context usage, token breakdowns and plan limits.',
    width: 350,
    height: 250,
  },
  'web-search': {
    name: 'search',
    title: 'Web search',
    description: 'The searches and sources behind an answer.',
    width: 350,
    height: 220,
  },
  'auth-card': {
    name: 'auth',
    title: 'Auth card',
    description: 'Sign in with email or a connected account.',
    width: 400,
    height: 460,
  },
  calendar: {
    name: 'calendar-view',
    title: 'Calendar',
    description: 'A monthly view of events and connected calendars.',
    width: 660,
    height: 440,
  },
  'date-picker': {
    name: 'meeting',
    title: 'Date picker',
    description: 'Choose a date and time for your next meeting.',
    width: 700,
    height: 420,
  },
  'data-table': {
    name: 'table',
    title: 'Data table',
    description: 'Search, filter and paginate a customer table.',
    width: 790,
    height: 465,
  },
  sidebar: {
    name: 'sidebar',
    title: 'Sidebar',
    description: 'Collapsible navigation, search and account controls.',
    width: 260,
    height: 732,
    thumbnailScale: 1,
  },
  'file-upload': {
    name: 'upload',
    title: 'File upload',
    description: 'Select a file and follow its upload progress.',
    width: 265,
    height: 240,
  },
  'ai-profile-card': {
    name: 'ai-profile',
    title: 'Contributor profile',
    description: 'Activity, token usage and contribution streaks.',
    width: 680,
    height: 510,
  },
  'ai-chat': {
    name: 'template-chat',
    title: 'AI chat',
    description: 'A complete conversation workspace with a composer.',
    width: 1100,
    height: 680,
  },
  'agent-chat': {
    name: 'chat',
    title: 'Agent chat',
    description: 'An interactive conversation with a working agent.',
    width: 560,
    height: 480,
  },
  'chart-cards': {
    name: 'earnings',
    title: 'Chart cards',
    description: 'Earnings and trends with period comparisons.',
    width: 596,
    height: 329,
  },
  'patient-info-card': {
    name: 'patient',
    title: 'Patient information',
    description: 'Patient details and medical information at a glance.',
    width: 360,
    height: 330,
  },
  'important-alerts-card': {
    name: 'alerts',
    title: 'Health alerts',
    description: 'Recent health updates and important notifications.',
    width: 360,
    height: 330,
  },
  'segmented-control': {
    name: 'segments',
    title: 'Segmented control',
    description: 'Switch between related views and date ranges.',
    width: 300,
    height: 60,
  },
};
