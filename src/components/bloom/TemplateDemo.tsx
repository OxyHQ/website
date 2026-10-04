import { useEffect, useRef, useState } from 'react'
import {
  AiChatShell,
  AiChatContainer,
  AiChatThread,
  AiChatUserMessage,
  AiChatAssistantMessage,
  AiChatCodePanel,
} from '@oxy.so/bloom/ai-chat'
import { ComposerPanel } from '@oxy.so/bloom/composer-panel'
import { Sidebar } from '@oxy.so/bloom/sidebar'
import { AgentProgress } from '@oxy.so/bloom/agent-progress'
import { AgentThinking } from '@oxy.so/bloom/agent-thinking'
import { Link } from '../../lib/navigation'
import { Button } from '@oxy.so/bloom/button'
import { RiLayoutGridLine } from '@oxy.so/bloom/icons/RiLayoutGridLine'
import { RiChat3Line } from '@oxy.so/bloom/icons/RiChat3Line'
import { RiHeartPulseLine } from '@oxy.so/bloom/icons/RiHeartPulseLine'
import { RiUserLine } from '@oxy.so/bloom/icons/RiUserLine'
import { useTranslation } from '../../lib/i18n'
import BloomDemos from './BloomDemos'
import ProjectBoardDemo from './ProjectBoardDemo'

export type TemplateKind =
  'chat' | 'dashboard' | 'health' | 'projects' | 'profile'
const code = `import { BloomProvider } from '@oxy.so/bloom/provider'
import { AgentChat, type AgentChatMessageData } from '@oxy.so/bloom/agent-chat'
import { useState } from 'react'

export default function App() {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<AgentChatMessageData[]>([])

  function send(text: string) {
    setMessages(previous => [
      ...previous,
      { id: String(previous.length), role: 'user', text },
    ])
    setValue('')
  }

  return (
    <BloomProvider>
      <AgentChat
        title="My workspace"
        value={value}
        onValueChange={setValue}
        messages={messages}
        onSubmit={send}
      />
    </BloomProvider>
  )
}
`
const templateDocs = {
  dashboard: 'chart-cards',
  health: 'patient-info-card',
  profile: 'ai-profile-card',
} as const

/** A full workspace composed of Bloom surfaces, in the reference's preview frame. */
export default function TemplateDemo({
  kind,
  active,
}: {
  kind: TemplateKind
  active: boolean
}) {
  const { t } = useTranslation()
  const frame = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [selected, setSelected] = useState<TemplateKind>(kind)
  useEffect(() => {
    const node = frame.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [selected])
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const text = (key: string) => t(`bloom.${key}`)
  const sidebar = (
    <Sidebar
      size="sm"
      surface="card"
      account={{ name: 'Maya Collins', avatar: { initials: 'M' } }}
      showThemeToggle={false}
      searchShortcut={false}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      selected={selected}
      items={[
        { key: 'chat', label: text('chat'), icon: RiChat3Line },
        { key: 'dashboard', label: text('dashboard'), icon: RiLayoutGridLine },
        { key: 'projects', label: text('projects'), icon: RiLayoutGridLine },
        { key: 'health', label: text('health'), icon: RiHeartPulseLine },
        { key: 'profile', label: text('profile'), icon: RiUserLine },
      ].map((item) => ({
        ...item,
        onPress: () => setSelected(item.key as TemplateKind),
      }))}
      style={{ height: '100%' }}
    />
  )
  if (selected === 'chat') {
    const chat = (
      <AiChatContainer
        project="bloom-ui"
        title={text('chat')}
        style={{ height: '100%', flex: 1 }}
        composer={
          <ComposerPanel
            value={value}
            onValueChange={setValue}
            placeholder={text('demoPrompt')}
            onSubmit={(prompt) => {
              if (!prompt.trim()) return
              setMessages((previous) => [...previous, prompt.trim()])
              setValue('')
            }}
          />
        }
      >
        <AiChatThread>
          <AiChatUserMessage animate={false}>
            {text('demoPrompt')}
          </AiChatUserMessage>
          <AiChatAssistantMessage animate={false}>
            <div className="flex flex-col gap-5">
              <p>{text('demoReply')}</p>
              <AgentProgress
                steps={[
                  text('readFiles'),
                  text('install'),
                  text('lightTheme'),
                  text('darkTheme'),
                  text('verifyBuild'),
                ]}
                paused={!active}
              />
              <AgentThinking
                variant="spin"
                label={text('thinking')}
                showTimer={false}
                shimmer={active}
              />
            </div>
          </AiChatAssistantMessage>
          {messages.map((message, index) => (
            <div key={index} className="flex flex-col gap-6">
              <AiChatUserMessage animate={false}>{message}</AiChatUserMessage>
              <AiChatAssistantMessage animate={false}>
                {text('demoReply')}
              </AiChatAssistantMessage>
            </div>
          ))}
        </AiChatThread>
      </AiChatContainer>
    )
    return (
      <div ref={frame} className="h-full w-full min-w-0">
        {width >= 1024 ? (
          <AiChatShell
            sidebar={sidebar}
            sidebarCollapsed={collapsed}
            defaultPanelWidth={360}
            minPanelWidth={280}
            panel={(panelWidth) => (
              <AiChatCodePanel
                width={panelWidth}
                language="tsx"
                code={code}
                changedFiles={[{ path: 'App.tsx', additions: 28 }]}
                changeCount={1}
                additions={28}
                deletions={0}
                browser={
                  <div className="p-5">
                    <BloomDemos name="chat" active={active} />
                  </div>
                }
              />
            )}
            style={{ height: '100%', minHeight: 650, width: '100%' }}
          >
            {chat}
          </AiChatShell>
        ) : (
          chat
        )}
      </div>
    )
  }
  if (selected === 'projects') {
    return (
      <div className="flex h-full min-h-[650px] w-full gap-5 p-2.5 [container-type:inline-size]">
        <div className="hidden h-full shrink-0 @min-[900px]:block">
          {sidebar}
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl bg-background-primary-default p-3">
          <ProjectBoardDemo />
        </div>
      </div>
    )
  }
  const demos = {
    dashboard: ['earnings', 'funnel', 'table'],
    health: ['patient', 'steps', 'sleep', 'days', 'activity', 'alerts'],
    profile: ['ai-profile'],
  } as const
  return (
    <div className="flex h-full min-h-[650px] w-full gap-5 p-2.5 [container-type:inline-size]">
      <div className="hidden h-full shrink-0 @min-[900px]:block">{sidebar}</div>
      <div className="min-w-0 flex-1 overflow-auto rounded-3xl bg-background-primary-default p-5">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h3 className="text-[24px] leading-[30px] font-medium">
            {text(selected)}
          </h3>
          <Button asChild size="sm" appearance="outline">
            <Link
              to={`/developers/docs/bloom/components/${templateDocs[selected]}/`}
            >
              {text('view')}
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-5 @min-[700px]:grid-cols-2 @min-[1000px]:grid-cols-3">
          {demos[selected].map((name) => (
            <div
              key={name}
              className={
                name === 'table' || name === 'ai-profile' ? 'col-span-full' : ''
              }
            >
              <BloomDemos name={name} active={active} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
