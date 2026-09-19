import type { UptimeDay } from '../../api/hooks'

const BAR_TONE: Record<UptimeDay['status'], string> = {
  operational: 'bg-success',
  degraded: 'bg-warning',
  down: 'bg-error',
  'no-data': 'bg-muted-foreground/10',
}

function formatTooltip(day: UptimeDay): string {
  const date = new Date(day.date + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
  if (day.status === 'no-data') return `${date} — no data`
  return `${date} — ${day.uptimePct}% uptime`
}

export default function UptimeBar({ days }: { days: UptimeDay[] }) {
  return (
    <div className="flex items-end gap-[2px]" role="img" aria-label={`${days.length}-day uptime history`}>
      {days.map((day) => (
        <span
          key={day.date}
          title={formatTooltip(day)}
          className={`h-6 flex-1 rounded-[2px] ${BAR_TONE[day.status]}`}
        />
      ))}
    </div>
  )
}
