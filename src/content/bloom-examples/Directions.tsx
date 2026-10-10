import { DirectionsSteps } from '@oxy.so/bloom/directions';

export default function DirectionsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <DirectionsSteps
        legs={[
          {
            id: 'walk',
            title: 'Walk to the studio',
            meta: '8 minutes',
            steps: [
              {
                id: '1',
                instruction: 'Continue along Market Street',
                distance: '300 m',
                maneuver: 'straight',
              },
              {
                id: '2',
                instruction: 'Turn left onto Park Avenue',
                distance: '150 m',
                maneuver: 'left',
              },
              { id: '3', instruction: 'Arrive at the studio', maneuver: 'arrive' },
            ],
          },
        ]}
      />
    </div>
  );
}
