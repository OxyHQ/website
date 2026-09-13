import type { ServiceStatusValue } from '../api/hooks'

export const STATUS_LABEL: Record<ServiceStatusValue, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Outage',
  unknown: 'Checking…',
}

export const STATUS_DOT: Record<ServiceStatusValue, string> = {
  operational: 'bg-success',
  degraded: 'bg-warning',
  down: 'bg-error',
  unknown: 'bg-muted-foreground/50',
}

export const STATUS_SURFACE: Record<ServiceStatusValue, string> = {
  operational: 'bg-success-subtle text-success-text',
  degraded: 'bg-warning-subtle text-warning-text',
  down: 'bg-error-subtle text-error-text',
  unknown: 'bg-muted-foreground/10 text-muted-foreground',
}
