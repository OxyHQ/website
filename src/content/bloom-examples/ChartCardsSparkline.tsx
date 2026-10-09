import { Sparkline } from '@oxy.so/bloom/chart-cards/sparkline'

export default function ChartCardsSparklineExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Sparkline data={[12,18,14,25,23,32,29,38]} />
    </div>
  )
}
