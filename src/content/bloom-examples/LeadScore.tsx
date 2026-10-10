import { LeadScoreCard } from '@oxy.so/bloom/lead-score';

export default function LeadScoreExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <LeadScoreCard score={82} accessibilityLabel="Lead score: 82" />
    </div>
  );
}
