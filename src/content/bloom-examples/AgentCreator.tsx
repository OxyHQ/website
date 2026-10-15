import { useState } from 'react';
import { AgentCreator, type AgentCreatorAgent } from '@oxy.so/bloom/agent-creator';

export default function AgentCreatorExample() {
  const [agent, setAgent] = useState<AgentCreatorAgent>({
    id: 'alex',
    name: 'Alex',
    label: 'Research assistant',
    description: 'Helps your team explore ideas.',
    avatar: { preset: 'blue_beret' },
  });
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <AgentCreator agent={agent} onChange={setAgent} />
    </div>
  );
}
