/** Runnable examples for compositions whose useful entry point isn't the
 * alphabetically first export in their package. */
export const bloomUsage: Record<string, string> = {
  'multi-agent-chat': `import { MultiAgentChat } from '@oxy.so/bloom/multi-agent-chat'

<MultiAgentChat storageKey={null} defaultEditorId={null} style={{ height: 720 }} />`,
  'project-board': `import { ProjectBoard } from '@oxy.so/bloom/project-board'

<ProjectBoard
  title="Projects"
  projects={['Bloom']}
  initialColumns={[
    { id: 'todo', title: 'To do', limit: 5, tickets: [] },
    { id: 'progress', title: 'In progress', limit: 4, tickets: [] },
    { id: 'done', title: 'Done', limit: 8, tickets: [] },
  ]}
  style={{ height: 650 }}
/>`,
  'composer-loader': `import { useState } from 'react'
import { ComposerLoader } from '@oxy.so/bloom/composer-loader'
import { ComposerPill } from '@oxy.so/bloom/composer-panel'

export default function WorkingComposer() {
  const [value, setValue] = useState('')
  return (
    <ComposerLoader active>
      <ComposerPill
        value={value}
        onValueChange={setValue}
        onSubmit={() => setValue('')}
        surface={false}
        glass
      />
    </ComposerLoader>
  )
}`,
  'auth-card': `import { AuthCard } from '@oxy.so/bloom/auth-card'

<AuthCard
  mode="signin"
  providers={['google', 'github']}
  onSubmit={(values) => console.log(values)}
/>`,
  calendar: `import { CalendarView } from '@oxy.so/bloom/calendar'

<CalendarView events={[]} />`,
  'agent-thinking': `import { AgentThinking } from '@oxy.so/bloom/agent-thinking'

<AgentThinking label="Thinking" variant="wave" />`,
  'composer-panel': `import { ComposerAttachments } from '@oxy.so/bloom/composer-panel'

<ComposerAttachments attachments={[]} onSubmit={(message) => console.log(message)} />`,
  'agent-progress': `import { AgentProgress } from '@oxy.so/bloom/agent-progress'

<AgentProgress steps={['Read project files', 'Implement the interface', 'Run the build']} />`,
  'agent-limits-card': `import { AgentLimitsCard } from '@oxy.so/bloom/agent-limits-card'
import { useTheme } from '@oxy.so/bloom/theme'

export default function UsageLimits() {
  const { colors } = useTheme()
  return (
    <AgentLimitsCard
      context={{ max: 1000000, segments: [
        { label: 'Messages', tokens: 520000, color: colors.primary },
      ] }}
      limits={[{ label: 'Messages', used: 0.38, resets: 'In 2 hours' }]}
      plan="Pro"
    />
  )
}`,
  'web-search': `import { WebSearch } from '@oxy.so/bloom/web-search'

<WebSearch steps={[
  { label: 'Searching the web', heading: true },
  { label: 'Bloom documentation', query: 'Bloom UI components', sources: [
    { title: 'Bloom UI', domain: 'oxy.so', href: 'https://oxy.so/developers/docs/bloom/' },
  ] },
]} />`,
  'date-picker': `import { MeetingScheduler } from '@oxy.so/bloom/date-picker'

<MeetingScheduler
  host={{ name: 'Maya Collins', email: 'maya@example.com' }}
  meeting={{ title: 'Design review', durationMinutes: 30 }}
  timezone="Europe/Bucharest"
  onChange={(value) => console.log(value)}
/>`,
  'data-table': `import { DataTable } from '@oxy.so/bloom/data-table'

const customers = [
  { id: '1', name: 'Maya Collins', price: 145 },
  { id: '2', name: 'Alex Rivera', price: 338 },
];

<DataTable
  accessibilityLabel="Customer table"
  title="Customers"
  rows={customers}
  getRowId={(row) => row.id}
  columns={[
    { id: 'name', header: 'Name', accessor: (row) => row.name },
    { id: 'price', header: 'Price', accessor: (row) => row.price },
  ]}
  selectable
  pageSize={5}
/>`,
  sidebar: `import { useState } from 'react'
import { Sidebar } from '@oxy.so/bloom/sidebar'
import { RiHomeLine } from '@oxy.so/bloom/icons/RiHomeLine'

export default function Navigation() {
  const [collapsed, setCollapsed] = useState(false)
  const [selected, setSelected] = useState('home')
  return (
    <Sidebar
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      selected={selected}
      onNavigate={(item) => setSelected(item.key)}
      items={[{ key: 'home', label: 'Home', icon: RiHomeLine }]}
      account={{ name: 'Maya Collins', avatar: { initials: 'M' } }}
    />
  )
}`,
  'file-upload': `import { useState } from 'react'
import { FileUpload, type FileUploadFile } from '@oxy.so/bloom/file-upload'

export default function Upload() {
  const [file, setFile] = useState<FileUploadFile | null>(null)
  return (
    <FileUpload
      file={file}
      onFileSelected={setFile}
      allowedExtensions={['pdf', 'jpg', 'png']}
      maxBytes={8 * 1024 * 1024}
      accessibilityLabel="Upload a document"
    />
  )
}`,
  'ai-profile-card': `import { AiProfileCard } from '@oxy.so/bloom/ai-profile-card'

<AiProfileCard
  name="Maya Collins"
  handle="@maya"
  initials="M"
  contributions={958}
  delta="+14.8%"
  cells={Array.from({ length: 266 }, (_, index) => ({ count: (index * 17) % 5 }))}
  stats={[{ value: '9B', label: 'Lifetime tokens' }, { value: '62', label: 'Day streak' }]}
/>`,
  'ai-chat': `import { AiChatContainer, AiChatThread, AiChatUserMessage, AiChatAssistantMessage } from '@oxy.so/bloom/ai-chat'
import { ComposerPanel } from '@oxy.so/bloom/composer-panel'

<AiChatContainer title="Design assistant" composer={<ComposerPanel onSubmit={console.log} />}>
  <AiChatThread>
    <AiChatUserMessage>Help me design a dashboard.</AiChatUserMessage>
    <AiChatAssistantMessage>Let's start with the navigation and a few summary cards.</AiChatAssistantMessage>
  </AiChatThread>
</AiChatContainer>`,
  'agent-chat': `import { useState } from 'react'
import { AgentChat } from '@oxy.so/bloom/agent-chat'

export default function Conversation() {
  const [value, setValue] = useState('')
  return (
    <AgentChat
      title="Design assistant"
      value={value}
      onValueChange={setValue}
      messages={[{ id: '1', role: 'assistant', text: 'What would you like to build?' }]}
      onSubmit={(message) => { console.log(message); setValue('') }}
    />
  )
}`,
  'chart-cards': `import { EarningsChartCard } from '@oxy.so/bloom/chart-cards'

<EarningsChartCard
  headline={7462}
  delta={0.148}
  data={[
    { label: 'Mon', value: 1200 },
    { label: 'Tue', value: 1800 },
    { label: 'Wed', value: 1450 },
    { label: 'Thu', value: 2100 },
    { label: 'Fri', value: 912 },
  ]}
/>`,
  'patient-info-card': `import { PatientInfoCard } from '@oxy.so/bloom/patient-info-card'
import { RiCalendarLine } from '@oxy.so/bloom/icons/RiCalendarLine'

<PatientInfoCard
  name="Maya Collins"
  initials="M"
  details={[{ icon: RiCalendarLine, label: 'Date of birth', value: '28 July 1997' }]}
/>`,
  'important-alerts-card': `import { ImportantAlertsCard } from '@oxy.so/bloom/important-alerts-card'
import { RiHeartPulseLine } from '@oxy.so/bloom/icons/RiHeartPulseLine'

<ImportantAlertsCard title="Health" count={1} alerts={[
  { icon: RiHeartPulseLine, tone: 'rose', title: 'Heart rate', description: '120 BPM', date: '12 Jun' },
]} />`,
  'segmented-control': `import { useState } from 'react'
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '@oxy.so/bloom/segmented-control'

export default function ViewSelector() {
  const [view, setView] = useState('day')
  return (
    <SegmentedControl label="Calendar view" type="radio" value={view} onValueChange={setView}>
      {['day', 'week', 'month', 'year'].map((value) => (
        <SegmentedControlItem key={value} value={value}>
          <SegmentedControlItemText>{value}</SegmentedControlItemText>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )
}`,
};
