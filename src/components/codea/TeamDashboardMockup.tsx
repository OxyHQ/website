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
  <div className="flex-1 rounded-lg border border-white/[0.06] bg-[#141415] p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="mt-1 flex items-end gap-2">
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="mb-0.5 flex items-center gap-0.5 text-xs text-green-400">
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
  { name: 'Sarah Chen', role: 'Frontend', tasks: 34, activityPct: 92, color: '#6366f1' },
  { name: 'Marcus J.', role: 'Backend', tasks: 28, activityPct: 82, color: '#f59e0b' },
  { name: 'Priya S.', role: 'Full-stack', tasks: 22, activityPct: 58, color: '#10b981' },
  { name: 'Alex R.', role: 'DevOps', tasks: 18, activityPct: 50, color: '#f43f5e' },
  { name: 'Emily Z.', role: 'Mobile', tasks: 25, activityPct: 78, color: '#8b5cf6' },
];

const MemberRow = ({ member }: { member: TeamMember }) => (
  <div className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-white/[0.02]">
    {/* Avatar */}
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
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
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-blue-500/60"
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
      className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-[#1a1a1c] text-sm select-none"
      style={{
        boxShadow:
          '0 28px 70px rgba(0,0,0,0.14), 0 14px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">Team Activity</h2>
        <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground">
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
