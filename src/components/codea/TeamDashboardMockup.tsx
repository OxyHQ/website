// Static Team Dashboard mockup — team-wide productivity metrics panel.
// Purely visual, no interactivity.

const ArrowUp = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline-block">
    <path d="M6 9.5V2.5M6 2.5L3 5.5M6 2.5L9 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline-block">
    <path d="M6 2.5V9.5M6 9.5L3 6.5M6 9.5L9 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  direction: 'up' | 'down';
}

const StatCard = ({ label, value, change, direction }: StatCardProps) => (
  <div className="flex-1 rounded-lg border border-foreground/[0.06] bg-background p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="mt-1 flex items-end gap-2">
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="mb-0.5 flex items-center gap-0.5 text-xs text-success-text">
        {direction === 'up' ? <ArrowUp /> : <ArrowDown />}
        {change}
      </span>
    </div>
  </div>
);

interface TeamMember {
  name: string;
  role: string;
  tasks: number;
  activityPct: number; // 0–100, drives sparkline width
  color: string;
}

const members: TeamMember[] = [
  { name: 'Teammate A', role: 'Frontend', tasks: 34, activityPct: 92, color: 'var(--chart-5)' },
  { name: 'Teammate B', role: 'Backend', tasks: 28, activityPct: 82, color: 'var(--chart-7)' },
  { name: 'Teammate C', role: 'Full-stack', tasks: 22, activityPct: 58, color: 'var(--chart-4)' },
  { name: 'Teammate D', role: 'DevOps', tasks: 18, activityPct: 50, color: 'var(--chart-6)' },
  { name: 'Teammate E', role: 'Mobile', tasks: 25, activityPct: 78, color: 'var(--chart-1)' },
];

const MemberRow = ({ member }: { member: TeamMember }) => (
  <div className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-foreground/[0.02]">
    {/* Avatar */}
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-background"
      style={{ backgroundColor: member.color }}
    >
      {member.name.charAt(0)}
    </div>

    {/* Name + role */}
    <div className="w-28 shrink-0">
      <p className="text-sm leading-tight text-foreground">{member.name}</p>
      <p className="text-[11px] leading-tight text-muted-foreground">{member.role}</p>
    </div>

    {/* Sparkline bar */}
    <div className="flex-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.04]">
        <div
          className="h-full rounded-full bg-info/60"
          style={{ width: `${member.activityPct}%` }}
        />
      </div>
    </div>

    {/* Task count */}
    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
      {member.tasks} tasks
    </span>
  </div>
);

export default function TeamDashboardMockup() {
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-surface text-sm select-none"
      style={{
        boxShadow:
          'var(--shadow-m), 0 0 0 1px color-mix(in srgb, var(--foreground) 8%, transparent)',
      }}
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between border-b border-foreground/[0.06] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">Team Activity</h2>
        <span className="rounded-md border border-foreground/[0.08] bg-foreground/[0.04] px-2.5 py-1 text-xs text-muted-foreground">
          Last 7 days
        </span>
      </div>

      {/* ─── Stats row ─── */}
      <div className="flex gap-3 px-5 pt-4 pb-2">
        <StatCard label="Tasks completed" value="127" change="+23%" direction="up" />
        <StatCard label="PRs merged" value="84" change="+15%" direction="up" />
        <StatCard label="Avg. time to merge" value="1.2h" change="-42%" direction="down" />
      </div>

      {/* ─── Team members ─── */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <p className="text-xs font-medium text-muted-foreground">Members</p>
        <p className="text-xs text-muted-foreground/60">Activity</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {members.map((m) => (
          <MemberRow key={m.name} member={m} />
        ))}
      </div>
    </div>
  );
}
