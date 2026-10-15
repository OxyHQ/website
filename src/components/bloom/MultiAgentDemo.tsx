import { useState } from 'react';
import { MultiAgentChat, type MultiAgentChatWorkspace } from '@oxy.so/bloom/multi-agent-chat';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { BLOOM_AGENT_PRESETS } from '../../content/bloom-agent-presets';

const agents: MultiAgentChatWorkspace['agents'] = [
  {
    id: 'design',
    name: 'landing page designer',
    label: 'Design',
    description: 'Thoughtful layouts and clear hierarchy.',
    avatar: BLOOM_AGENT_PRESETS[0].character,
  },
  {
    id: 'content',
    name: 'content reviewer',
    label: 'Writing',
    description: 'Clear and concise writing.',
    avatar: BLOOM_AGENT_PRESETS[1].character,
  },
  {
    id: 'marketing',
    name: 'marketing bot',
    label: 'Marketing',
    description: 'Campaigns people remember.',
    avatar: BLOOM_AGENT_PRESETS[2].character,
  },
  {
    id: 'seo',
    name: 'seo bot',
    label: 'SEO',
    description: 'Help people find your work.',
    avatar: BLOOM_AGENT_PRESETS[3].character,
  },
  {
    id: 'research',
    name: 'research assistant',
    label: 'Research',
    description: 'Explore questions and sources.',
    avatar: BLOOM_AGENT_PRESETS[4].character,
  },
  {
    id: 'security',
    name: 'Security agent',
    label: 'Security',
    description: 'Review access and permissions.',
    avatar: BLOOM_AGENT_PRESETS[6].character,
  },
  {
    id: 'product',
    name: 'Product planner',
    label: 'Product',
    description: 'Turn ideas into next steps.',
    avatar: BLOOM_AGENT_PRESETS[5].character,
  },
];
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
};

export function MultiAgentDemo() {
  const desktop = useMediaQuery('(min-width: 1100px)');
  const [workspace, setWorkspace] = useState(initialWorkspace);
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
  );
}
