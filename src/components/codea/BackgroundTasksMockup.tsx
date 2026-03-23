const tasks = [
  {
    name: "Migrate database schema",
    status: "completed" as const,
    progress: 100,
    time: "5m 12s",
    files: 12,
  },
  {
    name: "Add API rate limiting",
    status: "completed" as const,
    progress: 100,
    time: "3m 47s",
    files: 8,
  },
  {
    name: "Update test fixtures",
    status: "running" as const,
    progress: 68,
    time: "2m 34s",
    files: 4,
  },
  {
    name: "Refactor auth middleware",
    status: "running" as const,
    progress: 35,
    time: "1m 08s",
    files: 3,
  },
  {
    name: "Generate API documentation",
    status: "queued" as const,
    progress: 0,
    time: "queued",
    files: 0,
  },
];

function StatusIcon({ status }: { status: "completed" | "running" | "queued" }) {
  if (status === "completed") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15">
        <svg
          className="h-3 w-3 text-green-400"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.5L5 9l4.5-6" />
        </svg>
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center text-white/30">
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={7} cy={7} r={6} />
        <path d="M7 4v3.5l2.5 1.5" />
      </svg>
    </div>
  );
}

function ProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: "completed" | "running" | "queued";
}) {
  const fillColor =
    status === "completed"
      ? "bg-green-500"
      : status === "running"
        ? "bg-blue-500"
        : "bg-transparent";

  return (
    <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
      <div
        className={`h-full rounded-full ${fillColor} transition-all`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function BackgroundTasksMockup() {
  return (
    <div className="relative w-full rounded-2xl bg-[#1a1a1c] p-5 select-none">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-white/80">Background Tasks</span>
        <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-400">
          5 active
        </span>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div
            key={task.name}
            className="rounded-lg border border-white/[0.06] bg-[#141415] p-3"
          >
            <div className="mb-2 flex items-center gap-2.5">
              <StatusIcon status={task.status} />
              <span className="flex-1 truncate text-[13px] font-medium text-white/70">
                {task.name}
              </span>
              {task.files > 0 && (
                <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/30">
                  {task.files} files
                </span>
              )}
              <span
                className={`shrink-0 text-[11px] ${
                  task.status === "queued" ? "text-white/20" : "text-white/30"
                }`}
              >
                {task.time}
              </span>
            </div>
            <ProgressBar progress={task.progress} status={task.status} />
          </div>
        ))}
      </div>

      {/* Notification toast */}
      <div className="absolute right-5 bottom-5 left-5 rounded-xl border border-white/[0.06] bg-[#141415] p-4 shadow-xl">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15">
            <svg
              className="h-3 w-3 text-green-400"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 6.5L5 9l4.5-6" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-snug text-white/60">
              <span className="font-medium text-white/80">Task completed:</span>{" "}
              Add API rate limiting —{" "}
              <span className="text-white/40">12 files changed.</span>
            </p>
            <span className="mt-1 inline-block text-xs font-medium text-blue-400">
              View diff →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
