import { LeaseSummaryCard } from '@oxy.so/bloom/tenancy'

export default function TenancyExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <LeaseSummaryCard title="Your home" startDate="1 October 2026" endDate="30 September 2027" rent="$950 / month" />
    </div>
  )
}
