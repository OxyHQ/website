import { AgentLogRow, AgentLogWorkingRow } from '@oxy.so/bloom/agent-log';

export default function AgentLogExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <AgentLogRow first last={false}>
        <p>Reading your project</p>
      </AgentLogRow>
      <AgentLogWorkingRow label="Exploring ideas" />
    </div>
  );
}
