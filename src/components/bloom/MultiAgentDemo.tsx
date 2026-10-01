import { MultiAgentChat } from '@oxy.so/bloom/multi-agent-chat'
import { useMediaQuery } from '../../hooks/useMediaQuery'

/** Bloom owns the conversations, agent editor, avatar motion and demo replies. */
export function MultiAgentDemo() {
  const desktop = useMediaQuery('(min-width: 1100px)')
  return (
    <MultiAgentChat
      storageKey={null}
      defaultEditorId={desktop ? 'security' : null}
      style={{
        height: 720,
        width: '100%',
        borderRadius: 30,
        overflow: 'hidden',
      }}
    />
  )
}
