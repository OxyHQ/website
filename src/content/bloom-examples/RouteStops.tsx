import { RouteStops } from '@oxy.so/bloom/route-stops';

export default function RouteStopsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <RouteStops
        stops={[
          { id: 'a', title: 'Central studio', subtitle: '14 Market Street', state: 'reached' },
          { id: 'b', title: 'Riverside workshop', subtitle: '8 Park Avenue', state: 'current' },
        ]}
      />
    </div>
  );
}
