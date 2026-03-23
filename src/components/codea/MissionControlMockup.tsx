// Static Mission Control mockup — automation/workflow interface panel.
// Purely visual, no interactivity.

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

const ToggleSwitch = ({ enabled }: { enabled: boolean }) => (
  <div
    className={`flex h-4 w-7 items-center rounded-full px-0.5 transition-colors ${
      enabled ? 'bg-emerald-500' : 'bg-white/10'
    }`}
  >
    <div
      className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
        enabled ? 'translate-x-3' : 'translate-x-0'
      }`}
    />
  </div>
);

const StatusDot = ({ color }: { color: 'green' | 'yellow' | 'red' }) => {
  const colors = {
    green: 'bg-emerald-400',
    yellow: 'bg-amber-400',
    red: 'bg-red-400',
  };
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${colors[color]}`} />;
};

export default function MissionControlMockup() {
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-[#1a1a1c] text-sm select-none"
      style={{
        boxShadow:
          '0 28px 70px rgba(0,0,0,0.14), 0 14px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 py-3">
        <h1 className="m-0 text-[20px] font-bold text-foreground">Mission Control Interface</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {/* Trigger section */}
        <div>
          <h2 className="mb-1.5 mt-0 text-[14px] font-semibold text-foreground">Trigger</h2>
          <div className="rounded-lg border border-white/[0.06] bg-[#141415] p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-foreground/80">
                <GitHubIcon />
              </div>
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-medium text-foreground">On PR created</p>
                <p className="m-0 mt-0.5 text-xs text-muted-foreground">
                  Runs when a new pull request is opened against the default branch
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Behavior section */}
        <div>
          <h2 className="mb-1.5 mt-0 text-[14px] font-semibold text-foreground">View Behavior</h2>
          <div className="space-y-1">
            {[
              { label: 'Run tests', desc: 'Execute full test suite', enabled: true },
              { label: 'Review code', desc: 'AI-powered code review', enabled: true },
              { label: 'Check lint', desc: 'Enforce style rules', enabled: false },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#141415] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="m-0 text-[13px] font-medium text-foreground">{item.label}</p>
                  <p className="m-0 text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ToggleSwitch enabled={item.enabled} />
              </div>
            ))}
          </div>
        </div>

        {/* Status panel */}
        <div>
          <h2 className="mb-1.5 mt-0 text-[14px] font-semibold text-foreground">Recent Runs</h2>
          <div className="rounded-lg border border-white/[0.06] bg-[#141415]">
            {[
              { name: 'feat/auth-flow #247', status: 'green' as const, time: '2m ago' },
              { name: 'fix/nav-links #245', status: 'green' as const, time: '18m ago' },
              { name: 'chore/deps #244', status: 'yellow' as const, time: '1h ago' },
              { name: 'feat/dashboard #242', status: 'red' as const, time: '3h ago' },
              { name: 'fix/api-types #240', status: 'green' as const, time: '5h ago' },
            ].map((run, i, arr) => (
              <div
                key={run.name}
                className={`flex items-center gap-2.5 px-3 py-2 ${
                  i < arr.length - 1 ? 'border-b border-white/[0.06]' : ''
                }`}
              >
                <StatusDot color={run.status} />
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/80">
                  {run.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{run.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
