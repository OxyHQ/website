import { AgentAvatar, DEFAULT_CONFIG } from '@oxy.so/bloom/agent-avatar'

export default function AgentAvatarExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><AgentAvatar config={DEFAULT_CONFIG} size={180} portrait /></div>)
}
