import type { IncidentHistoryEntry, IncidentSeverity, IncidentUpdateStatus } from '../../api/hooks'

const SEVERITY_TONE: Record<IncidentSeverity, string> = {
  minor: 'bg-muted-foreground/10 text-muted-foreground',
  major: 'bg-warning-subtle text-warning-text',
  critical: 'bg-error-subtle text-error-text',
}

const UPDATE_TONE: Record<IncidentUpdateStatus, string> = {
  investigating: 'bg-warning-subtle text-warning-text',
  identified: 'bg-warning-subtle text-warning-text',
  monitoring: 'bg-warning-subtle text-warning-text',
  resolved: 'bg-success-subtle text-success-text',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function IncidentCard({ incident }: { incident: IncidentHistoryEntry }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${SEVERITY_TONE[incident.severity]}`}>
            {incident.severity}
          </span>
          <h3 className="text-sm font-semibold text-foreground">{incident.title}</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {incident.affectedServices.length > 0 ? incident.affectedServices.map((s) => s.name).join(', ') : 'Site-wide'}
        </span>
      </header>
      <ul className="divide-y divide-border">
        {incident.updates.map((update) => (
          <li key={update._id} className="flex flex-col gap-1.5 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${UPDATE_TONE[update.status]}`}>
                {update.status}
              </span>
              <span className="text-xs text-muted-foreground">{formatDateTime(update.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">{update.body}</p>
          </li>
        ))}
      </ul>
    </article>
  )
}
