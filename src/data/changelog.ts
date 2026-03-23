export interface ChangelogTag {
  label: string
  color: string
}

export interface ChangelogEntry {
  id: string
  title: string
  date: string
  tags: ChangelogTag[]
  content: string[]
  listItems?: string[]
  mediaType?: 'image' | 'video'
  mediaAspect?: string
}

export interface ChangelogGroup {
  date: string
  entries: ChangelogEntry[]
}

export const changelogData: ChangelogGroup[] = [
  {
    date: 'March 10, 2026',
    entries: [
      {
        id: 'ask-oxy-in-slack',
        title: 'Ask Oxy in Slack',
        date: 'March 10, 2026',
        tags: [
          { label: 'Design', color: 'rgb(255, 201, 90)' },
          { label: 'Enhancement', color: 'rgb(125, 96, 255)' },
          { label: 'Feature', color: 'rgb(38, 109, 240)' },
        ],
        content: [
          'Search through records, calls, emails, and conversation history in seconds.',
          'DM or mention Oxy in a channel, and ask anything about your customers and deals without leaving where you already work.',
          'Find out more on using Oxy in Slack in our Help Center.',
        ],
        mediaType: 'video',
        mediaAspect: '1.25 / 1',
      },
      {
        id: 'upgraded-ai-models',
        title: 'Upgraded AI models for Ask Oxy',
        date: 'March 10, 2026',
        tags: [
          { label: 'Enhancement', color: 'rgb(125, 96, 255)' },
          { label: 'Feature', color: 'rgb(38, 109, 240)' },
        ],
        content: [
          'We shipped Ask Oxy to change how you work with your CRM.',
          'This update takes it even further:',
        ],
        listItems: [
          'Ask Oxy is now powered by the latest frontier models for faster, more accurate responses.',
          'Responses are now streamed in real-time so you can start reading immediately.',
          'Ask Oxy can now reference data across linked records, giving you deeper context on every answer.',
          'New prompt suggestions help you discover what Ask Oxy can do.',
        ],
        mediaType: 'image',
        mediaAspect: '1.25 / 1',
      },
    ],
  },
  {
    date: 'February 25, 2026',
    entries: [
      {
        id: 'files-on-deals',
        title: 'Files on Deals and Custom objects',
        date: 'February 25, 2026',
        tags: [
          { label: 'Design', color: 'rgb(255, 201, 90)' },
          { label: 'Enhancement', color: 'rgb(125, 96, 255)' },
          { label: 'Feature', color: 'rgb(38, 109, 240)' },
        ],
        content: [
          'Keep contracts, decks, and documents where they belong — on the record.',
          'The files tab is now available on all object types, including deals and custom objects.',
          'Venture partners can store signed term sheets and due diligence docs on a deal, while sales teams can attach proposals or NDAs to each opportunity.',
          'We\'ve also refreshed the UI and rebuilt the backend for improved reliability.',
        ],
        mediaType: 'image',
        mediaAspect: '1.25 / 1',
      },
      {
        id: 'new-app-store-integrations',
        title: 'New App Store integrations',
        date: 'February 25, 2026',
        tags: [
          { label: 'Design', color: 'rgb(255, 201, 90)' },
          { label: 'Enhancement', color: 'rgb(125, 96, 255)' },
        ],
        content: [
          'Prep smarter, close faster, and keep your CRM in sync with over 25 new App Store arrivals.',
          'Check out:',
        ],
        listItems: [
          'Calendar Sync: Record meetings and sync AI summaries to your records.',
          'Document Hub: Auto-attach files from Google Drive and Dropbox to matching records.',
          'Lead Scoring: Automatically score and prioritize inbound leads based on fit signals.',
        ],
        mediaType: 'image',
        mediaAspect: '1.25 / 1',
      },
      {
        id: 'changelog-february-25-2026',
        title: 'Changelog (February 25, 2026)',
        date: 'February 25, 2026',
        tags: [
          { label: 'Fix', color: 'rgb(34, 197, 94)' },
          { label: 'Enhancement', color: 'rgb(125, 96, 255)' },
        ],
        content: [],
        listItems: [
          'Fixed an issue where filters on list views would reset after navigating away.',
          'Improved load times for records with large numbers of linked items.',
          'The timeline now correctly displays call recordings with transcripts.',
          'Bulk edit now supports updating relationship attributes across multiple records.',
          'CSV import now handles custom date formats more reliably.',
          'Fixed duplicate notification triggers on workflow status changes.',
        ],
      },
    ],
  },
  {
    date: 'February 11, 2026',
    entries: [
      {
        id: 'reporting-dashboards-v2',
        title: 'Reporting Dashboards v2',
        date: 'February 11, 2026',
        tags: [
          { label: 'Feature', color: 'rgb(38, 109, 240)' },
          { label: 'Design', color: 'rgb(255, 201, 90)' },
          { label: 'Reports', color: 'rgb(34, 197, 94)' },
        ],
        content: [
          'Build the reports your team actually needs — no spreadsheet gymnastics required.',
          'Dashboards v2 introduces a completely redesigned charting engine with new visualization types, drag-and-drop layout, and real-time data refresh.',
          'Pin your most important metrics to a shared dashboard and keep your entire team aligned on pipeline health, revenue targets, and activity goals.',
        ],
        mediaType: 'image',
        mediaAspect: '1.25 / 1',
      },
      {
        id: 'workflow-templates',
        title: 'Workflow templates library',
        date: 'February 11, 2026',
        tags: [
          { label: 'Feature', color: 'rgb(38, 109, 240)' },
          { label: 'Enhancement', color: 'rgb(125, 96, 255)' },
        ],
        content: [
          'Get started faster with pre-built workflows for the most common CRM automations.',
          'Browse our new template library to find workflows for lead routing, deal stage updates, follow-up sequences, and more. Each template is fully customizable — use it as-is or tweak it to match your exact process.',
        ],
        listItems: [
          'Lead assignment based on territory or round-robin rules.',
          'Automated follow-up emails when deals go stale.',
          'Slack notifications when high-value deals change stages.',
          'Weekly digest reports sent to team leads.',
        ],
        mediaType: 'image',
        mediaAspect: '1.25 / 1',
      },
      {
        id: 'changelog-february-11-2026',
        title: 'Changelog (February 11, 2026)',
        date: 'February 11, 2026',
        tags: [
          { label: 'Fix', color: 'rgb(34, 197, 94)' },
          { label: 'Enhancement', color: 'rgb(125, 96, 255)' },
        ],
        content: [],
        listItems: [
          'Fixed an edge case where merging duplicate records could lose linked activity data.',
          'Improved keyboard navigation in the command palette.',
          'Email sync now processes messages up to 3x faster for Gmail accounts.',
          'The API rate limit headers now return accurate remaining counts.',
          'Fixed a rendering issue with custom fields in the mobile app.',
        ],
      },
    ],
  },
]
