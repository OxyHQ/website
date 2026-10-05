import { useMemo, useState } from 'react'
import { Button } from '@oxy.so/bloom/button'
import { PatientInfoCard } from '@oxy.so/bloom/patient-info-card'
import { ImportantAlertsCard } from '@oxy.so/bloom/important-alerts-card'
import {
  StepsCard,
  SleepScoreCard,
  ActivityRingsCard,
  MostActiveDaysCard,
  FunnelChartCard,
  EarningsChartCard,
  RevenueChartCard,
  RadarChartCard,
  SankeyChartCard,
  StageBarsCard,
  RadialChartCard,
  AreaChartCard,
  ComboChartCard,
} from '@oxy.so/bloom/chart-cards'
import { ContributionsCard } from '@oxy.so/bloom/chart-cards'
import { AiProfileCard } from '@oxy.so/bloom/ai-profile-card'
import { Avatar } from '@oxy.so/bloom/avatar'
import { Card } from '@oxy.so/bloom/card'
import { RadioGroup } from '@oxy.so/bloom/radio'
import { ButtonGroup, ButtonGroupItem } from '@oxy.so/bloom/button-group'
import TemplateDemo from './TemplateDemo'
import ProjectBoardDemo from './ProjectBoardDemo'
import {
  ComposerAttachments,
  ComposerPanelStatusTab,
} from '@oxy.so/bloom/composer-panel'
import { CalendarView } from '@oxy.so/bloom/calendar'
import { AiChatImageGeneration } from '@oxy.so/bloom/ai-chat'
import { MultiAgentDemo } from './MultiAgentDemo'
import { AgentProgress } from '@oxy.so/bloom/agent-progress'
import { AgentThinking } from '@oxy.so/bloom/agent-thinking'
import { AgentLimitsCard } from '@oxy.so/bloom/agent-limits-card'
import { WebSearch } from '@oxy.so/bloom/web-search'
import LoaderDemo from './LoaderDemo'
import { AgentChat, type AgentChatMessageData } from '@oxy.so/bloom/agent-chat'
import { Calendar, MeetingScheduler } from '@oxy.so/bloom/date-picker'
import { AuthCard } from '@oxy.so/bloom/auth-card'
import { Sidebar } from '@oxy.so/bloom/sidebar'
import { FileUpload, type FileUploadFile } from '@oxy.so/bloom/file-upload'
import TableDemo from './TableDemo'
import { Slider } from '@oxy.so/bloom/slider'
import { Switch } from '@oxy.so/bloom/switch'
import { Checkbox } from '@oxy.so/bloom/checkbox'
import { RiHeartPulseLine } from '@oxy.so/bloom/icons/RiHeartPulseLine'
import { RiCalendarLine } from '@oxy.so/bloom/icons/RiCalendarLine'
import { RiUserLine } from '@oxy.so/bloom/icons/RiUserLine'
import { RiHomeLine } from '@oxy.so/bloom/icons/RiHomeLine'
import { RiLayoutGridLine } from '@oxy.so/bloom/icons/RiLayoutGridLine'
import { RiChat3Line } from '@oxy.so/bloom/icons/RiChat3Line'
import { useTheme, buildTheme } from '@oxy.so/bloom/theme'
import { useTranslation } from '../../lib/i18n'
import type { BloomDemoName } from './BloomPreview'

const fit = { width: '100%' as const }
const cells = Array.from({ length: 259 }, (_, i) => ({
  count: (i * 17 + i * i) % 5 < 3 ? 0 : (i * 17 + i * i) % 31,
  date: `2026-${String(1 + Math.floor(i / 22)).padStart(2, '0')}-${String(1 + (i % 22)).padStart(2, '0')}`,
}))
const month = new Date(2026, 8, 15)

export default function BloomDemos({
  name,
  active,
}: {
  name: BloomDemoName
  active: boolean
}) {
  const { t, locale } = useTranslation()
  const { colors, mode } = useTheme()
  // Bloom supplies both the neutral chrome and every coloured data series.
  const tones = useMemo(() => buildTheme('teal', mode).chartColors!, [mode])
  const accents = useMemo(
    () => ({
      blue: buildTheme('blue', mode).colors.primary,
      purple: buildTheme('purple', mode).colors.primary,
      pink: buildTheme('pink', mode).colors.primary,
    }),
    [mode],
  )
  const medicalFit = {
    ...fit,
    backgroundColor: colors.background,
    borderRadius: 20,
  }
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState('home')
  const [collapsed, setCollapsed] = useState(false)
  const [slider, setSlider] = useState(1)
  const [toggle, setToggle] = useState(true)
  const [date, setDate] = useState<Date | null>(month)
  const [file, setFile] = useState<FileUploadFile | null>(null)
  const [filter, setFilter] = useState('all')
  const [notice, setNotice] = useState(false)
  const [messages, setMessages] = useState<AgentChatMessageData[]>([
    { id: '1', role: 'user', text: t('bloom.demoPrompt') },
    { id: '2', role: 'assistant', text: t('bloom.demoReply') },
  ])
  const n = new Intl.NumberFormat(locale)
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    label: new Intl.DateTimeFormat(locale, { month: 'short' }).format(
      new Date(2026, i, 1),
    ),
    value: [420, 510, 480, 620, 590, 710, 680, 540, 760, 650, 720, 782][i]!,
    organic: [
      2800, 3100, 3600, 3200, 3800, 4300, 3900, 4600, 4800, 5100, 5400, 5900,
    ][i]!,
    referral: [
      1200, 1500, 1600, 1700, 1900, 2100, 2200, 2400, 2300, 2700, 3000, 3300,
    ][i]!,
    paid: [
      800, 900, 1100, 1000, 1200, 1400, 1500, 1700, 1800, 2000, 2300, 2600,
    ][i]!,
    sessions: [
      4200, 5100, 4800, 6200, 5900, 7100, 6800, 5400, 7600, 9200, 9700, 11200,
    ][i]!,
    conversion: [2.1, 2.4, 2.8, 2.6, 3.1, 3.4, 3.2, 3.8, 4.1, 4.6, 5.1, 5.4][
      i
    ]!,
  }))
  const title = (key: string) => t(`bloom.${key}`)
  const localNotice = notice && (
    <p role="status" className="bloom-demo-notice">
      {title('demoReply')}
    </p>
  )

  switch (name) {
    case 'patient':
      return (
        <PatientInfoCard
          name="Maya Collins"
          initials="M"
          details={[
            {
              icon: RiCalendarLine,
              label: title('birthDate'),
              value: new Intl.DateTimeFormat(locale, {
                dateStyle: 'medium',
              }).format(new Date(1997, 6, 28)),
            },
            {
              icon: RiUserLine,
              label: title('gender'),
              value: title('female'),
            },
            {
              icon: RiHeartPulseLine,
              label: title('bloodType'),
              value: 'A Rh+',
            },
            { icon: RiUserLine, label: title('doctor'), value: 'Alex Rivera' },
          ]}
          style={medicalFit}
        />
      )
    case 'steps':
      return (
        <StepsCard
          {...tones[0]!}
          data={Array.from({ length: 7 }, (_, i) => ({
            label: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
              new Date(2026, 5, 29 + i),
            ),
            value: [2540, 3820, 4460, 5290, 3380, 6410, 5700][i]!,
          }))}
          title={title('steps')}
          range="29 Jun – 5 Jul"
          format={n.format}
          style={medicalFit}
        />
      )
    case 'sleep':
      return (
        <SleepScoreCard
          metrics={[
            {
              label: title('duration'),
              detail: '7h 50m',
              score: 49,
              max: 50,
              color: accents.purple,
            },
            {
              label: title('bedtime'),
              detail: '20m',
              score: 29,
              max: 30,
              color: accents.pink,
            },
            {
              label: title('interruptions'),
              detail: '5m',
              score: 20,
              max: 20,
              color: accents.blue,
            },
          ]}
          range="29 Jun – 5 Jul"
          style={medicalFit}
        />
      )
    case 'activity':
      return (
        <ActivityRingsCard
          rings={[
            {
              label: title('move'),
              value: '1,592 kcal',
              goalPct: 0.82,
              color: accents.pink,
            },
            {
              label: title('exercise'),
              value: '1h 45m',
              goalPct: 0.64,
              color: tones[0]!.color,
            },
            {
              label: title('running'),
              value: '5.2 km',
              goalPct: 0.91,
              color: accents.blue,
            },
          ]}
          style={medicalFit}
        />
      )
    case 'days':
      return (
        <MostActiveDaysCard
          ringColors={[accents.pink, tones[0]!.color, accents.blue]}
          year={2026}
          initialMonth={8}
          headline={32459}
          format={n.format}
          rings={({ day, month: m }) => [
            ((day * 17 + m) % 100) / 100,
            ((day * 31) % 100) / 100,
            ((day * 11) % 100) / 100,
          ]}
          style={medicalFit}
        />
      )
    case 'alerts':
      return (
        <ImportantAlertsCard
          count={3}
          title={title('health')}
          alerts={[
            {
              icon: RiHeartPulseLine,
              tone: 'rose',
              title: 'Heart rate',
              description: '120 BPM',
              date: '12 Jun',
            },
            {
              icon: RiUserLine,
              tone: 'blue',
              title: 'Medical ID',
              description: 'Maya Collins · A Rh+',
              date: '9 Jun',
            },
            {
              icon: RiCalendarLine,
              tone: 'emerald',
              title: title('calendar'),
              description: 'Dr. Alex Rivera · 09:00',
              date: '8 Jun',
            },
          ]}
          height={330}
          style={fit}
        />
      )
    case 'calendar':
      return (
        <Calendar
          defaultMonth={month}
          value={date}
          onChange={setDate}
          locale={locale}
          style={fit}
        />
      )
    case 'calendar-view':
      return (
        <CalendarView
          defaultMonth={month}
          headingLevel={3}
          compact
          events={Array.from({ length: 22 }, (_, i) => ({
            id: String(i),
            date: new Date(2026, 8, 1 + ((i * 7) % 30)),
            title: [
              title('chat'),
              title('projects'),
              title('docs'),
              title('components'),
            ][i % 4]!,
            time: ['09:30', '11:00', '15:00', '16:30'][i % 4]!,
            color: (['blue', 'pink', 'purple', 'lime', 'emerald'] as const)[
              i % 5
            ]!,
          }))}
          inboxAccounts={[
            {
              email: 'maya@example.com',
              feeds: [{ id: 'bloom', label: 'Bloom', color: 'blue' }],
            },
          ]}
          onNewEvent={() => setNotice(true)}
          locale={locale}
          style={fit}
        />
      )
    case 'controls':
      return (
        <div className="flex w-full items-center gap-3">
          <Button
            onPress={() => setNotice(!notice)}
            style={{ flex: 1, height: 40, borderRadius: 10 }}
          >
            {title('primaryButton')}
          </Button>
          <Button
            appearance="outline"
            onPress={() => setToggle(!toggle)}
            style={{ flex: 1, height: 40, borderRadius: 10 }}
          >
            {title('secondaryButton')}
          </Button>
        </div>
      )
    case 'upload':
      return (
        <FileUpload
          file={file}
          progress={file ? 100 : 0}
          onFileSelected={setFile}
          labels={{ prompt: title('demo'), select: t('common.tryItFree') }}
          onPickFiles={() => {
            const sample = { name: 'bloom-design.pdf', size: 245760 }
            setFile(sample)
            return sample
          }}
          allowedExtensions={['pdf', 'jpg', 'png']}
          maxBytes={8 * 1024 * 1024}
          accessibilityLabel="FileUpload"
          style={fit}
        />
      )
    case 'table':
      return <TableDemo />
    case 'profile':
      return (
        <ContributionsCard
          color={accents.purple}
          total={958}
          cells={cells}
          delta={0.148}
          animateIn={active}
          stats={[
            { value: '9B', label: title('lifetimeTokens') },
            { value: '562.7M', label: title('peakTokens') },
            { value: '12h 54m', label: title('longestTask') },
            { value: '62', label: title('streak') },
          ]}
          style={{ ...fit, backgroundColor: colors.backgroundSecondary }}
        />
      )
    case 'ai-profile':
      return (
        <AiProfileCard
          name="Maya Collins"
          handle="@maya"
          initials="M"
          contributions={958}
          format={n.format}
          countUpDuration={active ? 1600 : 0}
          delta="+14.8%"
          cells={cells}
          columns={37}
          color={accents.purple}
          animateIn={active}
          actions={
            <div className="flex gap-2.5">
              <Button
                size="sm"
                appearance="outline"
                onPress={() => setNotice(true)}
              >
                {title('view')}
              </Button>
              <Button
                size="sm"
                appearance="outline"
                onPress={() => setNotice(true)}
              >
                {title('docs')}
              </Button>
            </div>
          }
          stats={[
            { value: '9B', label: title('lifetimeTokens') },
            { value: '562.7M', label: title('peakTokens') },
            { value: '12h 54m', label: title('longestTask') },
            { value: '62', label: title('streak') },
          ]}
          style={fit}
        />
      )
    case 'sidebar':
      return (
        <div
          className="h-full shrink-0 transition-[width] duration-300 ease-in-out motion-reduce:transition-none"
          style={{ width: collapsed ? 60 : 260 }}
        >
          <Sidebar
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            fluid
            items={[
              { key: 'home', label: 'Bloom', icon: RiHomeLine, badge: 152 },
              {
                key: 'projects',
                label: title('projects'),
                icon: RiLayoutGridLine,
              },
              { key: 'chat', label: title('chat'), icon: RiChat3Line },
              {
                key: 'calendar',
                label: title('calendar'),
                icon: RiCalendarLine,
              },
              { key: 'health', label: title('health'), icon: RiHeartPulseLine },
              { key: 'profile', label: title('profile'), icon: RiUserLine },
            ].map((item) => ({
              ...item,
              onPress: () => setSelected(item.key),
            }))}
            selected={selected}
            showThemeToggle={false}
            showSearch
            searchShortcut={false}
            account={{ name: 'Maya Collins', avatar: { initials: 'M' } }}
            team={{ name: 'Bloom team', email: 'team@example.com' }}
            secondaryItems={[
              {
                key: 'support',
                label: t('common.contactUs'),
                icon: RiChat3Line,
              },
              {
                key: 'settings',
                label: t('footer.settings'),
                icon: RiLayoutGridLine,
              },
            ]}
            style={{ width: '100%', height: 732 }}
          />
        </div>
      )
    case 'progress':
      return (
        <AgentProgress
          steps={[
            title('readFiles'),
            title('install'),
            title('lightTheme'),
            title('darkTheme'),
            title('verifyBuild'),
          ]}
          paused={!active}
          style={fit}
        />
      )
    case 'auth':
    case 'auth-signup':
      return (
        <>
          <AuthCard
            mode={name === 'auth-signup' ? 'signup' : 'signin'}
            headingLevel={3}
            providers={
              name === 'auth-signup' ? ['google', 'apple'] : ['github']
            }
            onSubmit={() => setNotice(true)}
            onProvider={() => setNotice(true)}
            onForgotPassword={() => setNotice(true)}
            onSwitch={() => setNotice(true)}
            style={fit}
          />
          {localNotice}
        </>
      )
    case 'attachments':
      return (
        <ComposerAttachments
          value={value}
          onValueChange={setValue}
          onSubmit={() => {
            setValue('')
            setNotice(true)
          }}
          defaultPermission="bypass"
          status={<ComposerPanelStatusTab branch="Main" project="bloom-ui" />}
          providers={[
            {
              id: 'bloom',
              name: 'Bloom',
              models: [{ id: 'design', name: 'Design agent' }],
            },
          ]}
          attachments={[
            {
              id: 'a',
              name: 'bloom.webp',
              kind: 'image',
              src: '/images/nav-bloom-ui.webp',
              progress: active ? 0 : undefined,
            },
            {
              id: 'b',
              name: 'design.docx',
              kind: 'document',
              progress: active ? 0 : undefined,
            },
          ]}
          style={fit}
        />
      )
    case 'search':
      return (
        <WebSearch
          run={active}
          revealed={active ? undefined : 2}
          reduce={!active}
          steps={[
            { label: t('bloom.searchSummary', { count: 3 }), heading: true },
            {
              label: title('thinking'),
              query: 'Bloom UI components',
              sources: [
                {
                  title: 'Bloom UI',
                  domain: 'github.com',
                  href: 'https://github.com/OxyHQ/Bloom',
                  brand: 'github',
                },
              ],
            },
            {
              label: title('docs'),
              query: '@oxy.so/bloom',
              sources: [
                {
                  title: 'Bloom docs',
                  domain: 'oxy.so',
                  href: '/developers/docs/bloom/components/',
                },
              ],
            },
          ]}
          style={fit}
        />
      )
    case 'limits':
      return (
        <AgentLimitsCard
          context={{
            max: 1000000,
            segments: [
              { label: title('messages'), tokens: 520000, color: accents.blue },
              { label: title('files'), tokens: 100000, color: accents.purple },
              { label: title('tools'), tokens: 65000, color: accents.pink },
              { label: title('docs'), tokens: 60000, color: tones[2]!.color },
              {
                label: title('components'),
                tokens: 45000,
                color: tones[0]!.color,
              },
              {
                label: title('projects'),
                tokens: 30000,
                color: tones[1]!.color,
              },
            ],
          }}
          limits={[
            { label: title('messages'), used: 0.38, resets: '' },
            { label: title('files'), used: 0.03, resets: '' },
            { label: title('tools'), used: 0.05, resets: '' },
          ]}
          plan={title('demo')}
          defaultExpanded={false}
          style={fit}
        />
      )
    case 'thinking':
      return (
        <div className="flex flex-col items-start gap-3.5">
          <AgentThinking
            variant="wave"
            label={title('thinking')}
            showTimer={false}
            shimmer={active}
          />
          <AgentThinking
            variant="spin"
            label={title('thinking')}
            showTimer={false}
            shimmer={active}
          />
          <AgentThinking
            variant="stars"
            label={title('docs')}
            showTimer={false}
            shimmer={active}
          />
          <AgentThinking
            variant="infinity"
            label={title('components')}
            showTimer={false}
            shimmer={active}
          />
        </div>
      )
    case 'meeting':
      return (
        <div className="w-full">
          <MeetingScheduler
            host={{ name: 'Maya Collins', email: 'maya@example.com' }}
            meeting={{ title: 'Bloom UI', durationMinutes: 30 }}
            timezone="Europe/Bucharest"
            defaultValue={{ date: month, time: null }}
            locale={locale}
            onChange={() => setNotice(true)}
            style={fit}
          />
          {localNotice}
        </div>
      )
    case 'chat':
      return (
        <AgentChat
          title={title('chat')}
          model={title('demo')}
          value={value}
          onValueChange={setValue}
          messages={messages}
          onSubmit={(text) => {
            setMessages((prev) => [
              ...prev,
              { id: `${prev.length}-u`, role: 'user', text },
              {
                id: `${prev.length}-a`,
                role: 'assistant',
                text: title('demoReply'),
              },
            ])
            setValue('')
          }}
          onNewChat={() => setMessages([])}
          style={{ ...fit, height: 480 }}
        />
      )
    case 'loader':
    case 'loader-feature':
      return <LoaderDemo active={active} controls={name === 'loader-feature'} />
    case 'widgets':
      return (
        <div className="flex gap-5">
          <div className="w-[360px] shrink-0">
            <BloomDemos name="activity" active={active} />
          </div>
          <div className="w-[360px] shrink-0">
            <BloomDemos name="steps" active={active} />
          </div>
        </div>
      )
    case 'image':
      return (
        <AiChatImageGeneration
          source={{ uri: '/images/nav-bloom-ui.webp' }}
          alt="Bloom UI"
          duration={6000}
          ready={!active}
          hideHeader
          style={fit}
        />
      )
    case 'accounts':
      return (
        <Card
          radius="radius-16"
          cornerCurve="round"
          elevation="none"
          border="thin"
          style={{ ...fit, padding: 10, minHeight: 235 }}
        >
          <div className="relative z-10 flex flex-1 flex-col">
            <div className="flex w-full flex-col gap-1.5 pt-[5px]">
              <span className="px-2 text-body-medium text-text-secondary">
                {title('usersWithAccess')}
              </span>
              <div className="flex w-full flex-col gap-1">
                {['Maya Collins', 'Steven Raule', 'Lauren Proso'].map(
                  (name, i) => (
                    <div
                      className="flex w-full items-center gap-2 rounded-2lg px-2 py-1.5"
                      key={name}
                    >
                      <Avatar
                        initials={name[0]}
                        color={(['neutral', 'lime', 'pink'] as const)[i]}
                        size={20}
                      />
                      <span className="truncate text-body-medium text-text-primary">
                        {name}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="-mx-2.5 mt-3.5 mb-2.5 h-px bg-border-button-default" />
            <div className="flex flex-1 items-center gap-3 px-2">
              <Button
                appearance="outline"
                tone="neutral"
                size="sm"
                onPress={() => setNotice(true)}
                style={{ flex: 1, borderRadius: 8 }}
              >
                {title('addUser')}
              </Button>
              <Button
                appearance="outline"
                tone="neutral"
                size="sm"
                onPress={() => setNotice(true)}
                style={{ flex: 1, borderRadius: 8 }}
              >
                {title('manage')}
              </Button>
            </div>
            {localNotice}
          </div>
        </Card>
      )
    case 'models':
      return (
        <Card
          radius="radius-16"
          cornerCurve="round"
          elevation="none"
          border="thin"
          style={{ ...fit, padding: 16 }}
        >
          <div className="relative z-10 flex flex-col gap-4">
            <span className="text-body-medium text-text-secondary">
              {title('models')}
            </span>
            <RadioGroup
              value={selected}
              onValueChange={setSelected}
              label={title('models')}
              options={[
                { value: 'home', label: 'Design agent' },
                { value: 'review', label: 'Review agent' },
                { value: 'research', label: 'Research agent' },
                { value: 'code', label: 'Code agent' },
              ]}
            />
            <span className="text-body-medium">{title('effort')}</span>
            <Slider
              showTooltip={false}
              max={5}
              step={1}
              value={slider}
              onValueChange={setSlider}
              accessibilityLabel={title('effort')}
            />
          </div>
        </Card>
      )
    case 'segments':
      return (
        <ButtonGroup accessibilityLabel={title('calendar')}>
          {['day', 'week', 'month', 'year'].map((key) => (
            <ButtonGroupItem
              key={key}
              selected={filter === key || (filter === 'all' && key === 'day')}
              onPress={() => setFilter(key)}
            >
              {title(key)}
            </ButtonGroupItem>
          ))}
        </ButtonGroup>
      )
    case 'checks':
      return (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={toggle}
            onCheckedChange={setToggle}
            accessibilityLabel={title('primaryButton')}
          />
          <Checkbox
            checked={!toggle}
            onCheckedChange={(v) => setToggle(!v)}
            accessibilityLabel={title('secondaryButton')}
          />
          <Switch
            checked={toggle}
            onCheckedChange={setToggle}
            accessibilityLabel={t('common.theme')}
          />
        </div>
      )
    case 'template-chat':
    case 'template-dashboard':
    case 'template-health':
    case 'template-projects':
    case 'template-profile':
      return (
        <TemplateDemo
          key={name}
          kind={
            name.replace(
              'template-',
              '',
            ) as import('./TemplateDemo').TemplateKind
          }
          active={active}
        />
      )
    case 'project-board':
      return (
        <div style={{ height: 650 }}>
          <ProjectBoardDemo />
        </div>
      )
    case 'multi-agent':
      return <MultiAgentDemo />
    case 'funnel':
      return (
        <FunnelChartCard
          stages={['Link opened', 'Started', 'Completed', 'Converted'].map(
            (label, i) => ({ label, value: [197, 110, 77, 38][i]! }),
          )}
          title="Sign-up funnel"
          delta={0.052}
          range="Last 7 days"
          format={n.format}
          style={fit}
        />
      )
    case 'earnings':
      return (
        <EarningsChartCard
          {...tones[1]!}
          data={chartData}
          headline={7462}
          delta={0.148}
          ranges={[
            {
              id: 'weekly',
              label: title('week'),
              data: chartData,
              headline: 7462,
              delta: 0.148,
            },
            {
              id: 'monthly',
              label: title('month'),
              data: chartData.map((d) => ({ ...d, value: d.value * 2 })),
              headline: 18240,
              delta: 0.094,
            },
            {
              id: 'yearly',
              label: title('year'),
              data: chartData.map((d) => ({ ...d, value: d.value * 4 })),
              headline: 91200,
              delta: 0.22,
            },
          ]}
          style={fit}
        />
      )
    case 'revenue':
      return (
        <RevenueChartCard
          {...tones[0]!}
          data={chartData.map((d) => ({
            label: d.label,
            current: d.organic,
            previous: d.referral,
          }))}
          style={fit}
        />
      )
    case 'radar':
    case 'comparison':
      return (
        <RadarChartCard
          title="Visitors"
          variant={name === 'comparison' ? 'lines' : 'filled'}
          legend="overlay"
          data={chartData.slice(0, 6).map((_, i) => ({
            label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(
              new Date(2026, i, 1),
            ),
            desktop: [186, 305, 237, 273, 209, 214][i]!,
            mobile: [80, 200, 120, 190, 130, 140][i]!,
          }))}
          series={
            name === 'comparison'
              ? [
                  { key: 'desktop', label: 'Desktop' },
                  { key: 'mobile', label: 'Mobile' },
                ]
              : [{ key: 'desktop', label: 'Visitors' }]
          }
          headline={1424}
          delta={0.052}
          range="H1 2024"
          tiles
          format={n.format}
          style={fit}
        />
      )
    case 'sankey':
      return (
        <SankeyChartCard
          nodes={[
            'Focus',
            'Meetings',
            'Breaks',
            'Admin',
            'Learning',
            'Browsing',
            'Writing',
            'Messaging',
            'Productivity',
            'Email',
            'Video calls',
            'Everything else',
          ].map((name) => ({ name }))}
          links={[
            { source: 0, target: 5, value: 10 },
            { source: 0, target: 6, value: 12 },
            { source: 0, target: 8, value: 10 },
            { source: 1, target: 7, value: 6 },
            { source: 1, target: 10, value: 12 },
            { source: 2, target: 5, value: 4 },
            { source: 2, target: 11, value: 8 },
            { source: 3, target: 7, value: 5 },
            { source: 3, target: 9, value: 7 },
            { source: 3, target: 11, value: 2 },
            { source: 4, target: 5, value: 5 },
            { source: 4, target: 6, value: 4 },
            { source: 4, target: 11, value: 1 },
          ]}
          range="This week"
          height={430}
          style={fit}
        />
      )
    case 'stages':
      return (
        <StageBarsCard
          stages={[
            'Visits',
            'Signup',
            'Active',
            'Pro',
            'Team',
            'Enterprise',
          ].map((label, i) => ({
            label,
            value: [1180, 790, 460, 250, 120, 40][i]!,
          }))}
          delta={0.024}
          range="Last 7 days"
          format={n.format}
          style={fit}
        />
      )
    case 'radial':
    case 'gauge':
      return (
        <RadialChartCard
          data={
            name === 'gauge'
              ? ['Desktop', 'Mobile', 'Tablet', 'TV'].map((label, i) => ({
                  label,
                  value: [1180, 620, 380, 320][i]!,
                }))
              : ['Other', 'Edge', 'Firefox', 'Safari', 'Chrome'].map(
                  (label, i) => ({
                    label,
                    value: [90, 173, 187, 200, 275][i]!,
                  }),
                )
          }
          variant={name === 'gauge' ? 'stacked' : 'labels'}
          delta={0.052}
          range="Last 7 days"
          tiles
          format={n.format}
          style={fit}
        />
      )
    case 'area':
      return (
        <AreaChartCard
          data={chartData}
          series={[
            { key: 'organic', label: 'Organic' },
            { key: 'referral', label: 'Referral' },
            { key: 'paid', label: 'Paid' },
          ]}
          delta={0.082}
          range="This year"
          tiles
          style={fit}
        />
      )
    case 'combo':
      return (
        <ComboChartCard
          data={chartData}
          bar={{ key: 'sessions', label: 'Sessions' }}
          line={{
            key: 'conversion',
            label: 'Conversion',
            format: (value) => `${value.toFixed(1)}%`,
          }}
          delta={0.094}
          range="This year"
          tiles
          style={fit}
        />
      )
  }
}
