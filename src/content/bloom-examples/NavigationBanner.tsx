import { ArrivalBar } from '@oxy.so/bloom/navigation-banner';

export default function NavigationBannerExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ArrivalBar arrival="10:45" remainingTime="12 min" remainingDistance="3.2 km" />
    </div>
  );
}
