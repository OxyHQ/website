import { AgentAvatar } from '@oxy.so/bloom/agent-avatar';

export default function AgentAvatarExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <AgentAvatar character={{ preset: 'blue_beret' }} size={180} portrait />
    </div>
  );
}
