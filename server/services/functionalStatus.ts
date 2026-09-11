import { CloudWatchClient, DescribeAlarmsCommand, type StateValue } from '@aws-sdk/client-cloudwatch'
import { fromHttp } from '@aws-sdk/credential-provider-http'

export type PublicServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown'

export interface FunctionalSignal {
  readonly alarmName: string
  readonly state: StateValue | 'MISSING'
  readonly checkedAt: string
}

export interface StatusCandidate {
  readonly id: string
  readonly status: PublicServiceStatus
}

const SERVICE_ALARMS = {
  alia: 'oxy-alia-functional-failures',
  kaana: 'oxy-kaana-routing-readiness-not-confirmed',
} as const

/**
 * Audited machine endpoints. A public page, app shell or API root is not a
 * health signal and therefore never belongs here. Products absent from this
 * map remain `unknown` instead of manufacturing a green state from a landing
 * page. Keep each entry paired with the owning service's documented contract.
 */
const AUTHORITATIVE_PROBES: Readonly<Record<string, string>> = {
  alia: 'https://api.alia.onl/health/ready',
  allo: 'https://api.allo.you/api/health',
  clarity: 'https://api.clarity.surf/health/ready',
  crowdsource: 'https://api.crowdsource.oxy.so/health/ready',
  'faircoin-bridge': 'https://bridge.fairco.in/health',
  'faircoin-buy': 'https://bridge.fairco.in/health/buy',
  'faircoin-explorer': 'https://explorer.fairco.in/api/mining-info?network=mainnet',
  kaana: 'https://kaana.ai/livez',
  mercaria: 'https://api.mercaria.co/health/ready',
  moovo: 'https://api.moovo.now/health/ready',
  nilo: 'https://api.nilo.so/health/ready',
  noted: 'https://api.noted.oxy.so/health/ready',
  'oxy-api': 'https://api.oxy.so/health',
  'website-api': 'https://website-api.oxy.so/api/health',
}

const SERVICE_DEPENDENCIES: Readonly<Record<string, readonly string[]>> = {
  alia: ['oxy-api', 'kaana'],
  accounts: ['oxy-api'],
  allo: ['oxy-api'],
  clarity: ['oxy-api', 'kaana'],
  crowdsource: ['oxy-api'],
  homiio: ['oxy-api'],
  inbox: ['oxy-api'],
  mention: ['oxy-api'],
  mercaria: ['oxy-api'],
  moovo: ['oxy-api'],
  nilo: ['oxy-api'],
  noted: ['oxy-api'],
  'oxy-ai': ['kaana'],
  peable: ['oxy-api'],
  syra: ['oxy-api'],
}

let client: CloudWatchClient | null = null

function cloudWatch(): CloudWatchClient {
  if (client !== null) return client
  client = new CloudWatchClient({
    region: process.env.AWS_REGION ?? 'us-west-2',
    // The website still has legacy static S3 credentials in its environment.
    // Status reads must use the task role deliberately, whose policy is read-only.
    credentials: fromHttp({ timeout: 1_000, maxRetries: 2 }),
  })
  return client
}

export function statusFromAlarm(state: FunctionalSignal['state']): PublicServiceStatus {
  if (state === 'OK') return 'operational'
  if (state === 'ALARM') return 'down'
  return 'unknown'
}

export function authoritativeProbeUrl(serviceId: string): string | null {
  return AUTHORITATIVE_PROBES[serviceId] ?? null
}

export async function readFunctionalSignals(): Promise<ReadonlyMap<string, FunctionalSignal>> {
  const names = Object.values(SERVICE_ALARMS)
  try {
    const response = await cloudWatch().send(new DescribeAlarmsCommand({ AlarmNames: names }))
    const byName = new Map((response.MetricAlarms ?? []).map((alarm) => [alarm.AlarmName, alarm]))
    const checkedAt = new Date().toISOString()
    return new Map(Object.entries(SERVICE_ALARMS).map(([serviceId, alarmName]) => {
      const alarm = byName.get(alarmName)
      return [serviceId, {
        alarmName,
        state: alarm?.StateValue ?? 'MISSING',
        checkedAt: alarm?.StateUpdatedTimestamp?.toISOString() ?? checkedAt,
      }]
    }))
  } catch {
    const checkedAt = new Date().toISOString()
    return new Map(Object.entries(SERVICE_ALARMS).map(([serviceId, alarmName]) => [
      serviceId,
      { alarmName, state: 'MISSING', checkedAt },
    ]))
  }
}

function worse(left: PublicServiceStatus, right: PublicServiceStatus): PublicServiceStatus {
  const severity: Record<PublicServiceStatus, number> = {
    operational: 0,
    unknown: 1,
    degraded: 2,
    down: 3,
  }
  return severity[left] >= severity[right] ? left : right
}

export function applyFunctionalSignals<T extends StatusCandidate>(
  services: readonly T[],
  signals: ReadonlyMap<string, FunctionalSignal>,
): Array<Omit<T, 'status'> & StatusCandidate> {
  const withSignals = services.map((service) => {
    const signal = signals.get(service.id)
    return signal === undefined
      ? service
      : { ...service, status: worse(service.status, statusFromAlarm(signal.state)) }
  })
  const byId = new Map(withSignals.map((service) => [service.id, service]))
  return withSignals.map((service) => {
    const dependencies = SERVICE_DEPENDENCIES[service.id] ?? []
    const dependencyStatus = dependencies.reduce<PublicServiceStatus>(
      (status, dependencyId) => worse(status, byId.get(dependencyId)?.status ?? 'unknown'),
      'operational',
    )
    return { ...service, status: worse(service.status, dependencyStatus) }
  })
}
