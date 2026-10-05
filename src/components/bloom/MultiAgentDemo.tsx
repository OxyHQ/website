import { useState } from 'react'
import {
  MultiAgentChat,
  type MultiAgentChatWorkspace,
} from '@oxy.so/bloom/multi-agent-chat'
import { FOLD_CONFIG } from '@oxy.so/bloom/agent-avatar'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const agents: MultiAgentChatWorkspace['agents'] = [
  {
    id: 'design',
    name: 'landing page designer',
    label: 'Design',
    description: 'Thoughtful layouts and clear hierarchy.',
    avatar: { ...FOLD_CONFIG, foldShape: 'shield', hue: 80, saturation: 65 },
  },
  {
    id: 'content',
    name: 'content reviewer',
    label: 'Writing',
    description: 'Clear and concise writing.',
    avatar: { ...FOLD_CONFIG, foldShape: 'pocket', hue: 25, saturation: 60 },
  },
  {
    id: 'marketing',
    name: 'marketing bot',
    label: 'Marketing',
    description: 'Campaigns people remember.',
    avatar: { ...FOLD_CONFIG, foldShape: 'star', hue: 185, saturation: 50 },
  },
  {
    id: 'seo',
    name: 'seo bot',
    label: 'SEO',
    description: 'Help people find your work.',
    avatar: { ...FOLD_CONFIG, foldShape: 'flower', hue: 255, saturation: 65 },
  },
  {
    id: 'research',
    name: 'research assistant',
    label: 'Research',
    description: 'Explore questions and sources.',
    avatar: { ...FOLD_CONFIG, hue: 45, saturation: 75 },
  },
  {
    id: 'security',
    name: 'Security agent',
    label: 'Security',
    description: 'Review access and permissions.',
    avatar: { ...FOLD_CONFIG, foldShape: 'shield', hue: 175, saturation: 45 },
  },
  {
    id: 'product',
    name: 'Product planner',
    label: 'Product',
    description: 'Turn ideas into next steps.',
    avatar: { ...FOLD_CONFIG, foldShape: 'diamond', hue: 215, saturation: 70 },
  },
]
const initialWorkspace: MultiAgentChatWorkspace = {
  agents,
  chats: [
    {
      id: 'team',
      title: 'Design + Marketing + Product',
      agentIds: ['design', 'marketing', 'product'],
      messages: [],
    },
    ...agents.map((agent) => ({
      id: agent.id,
      title: agent.name,
      agentIds: [agent.id],
      messages: [],
    })),
  ],
  activeId: 'team',
}

export function MultiAgentDemo() {
  const desktop = useMediaQuery('(min-width: 1100px)')
  const [workspace, setWorkspace] = useState(initialWorkspace)
  return (
    <MultiAgentChat
      // Bloom's editor choice is initial-only. Remount its layout at the
      // breakpoint so a desktop rail never turns into an unsolicited dialog.
      key={desktop ? 'desktop' : 'compact'}
      initialWorkspace={workspace}
      onWorkspaceChange={setWorkspace}
      storageKey={null}
      defaultEditorId={desktop ? 'design' : null}
      style={{
        height: 720,
        width: '100%',
        borderRadius: 30,
        overflow: 'hidden',
      }}
    />
  )
}
