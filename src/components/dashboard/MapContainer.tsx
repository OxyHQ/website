import { lazy, Suspense } from "react";

const DottedMap = lazy(() => import("./DottedMap"));

interface MapContainerProps {
  activeCountries?: Array<{ location: string; count: number }>;
}

export default function MapContainer({ activeCountries }: MapContainerProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[560px] bg-[var(--ds-background-100)] animate-pulse rounded-md" />
      }
    >
      <DottedMap activeCountries={activeCountries} />
    </Suspense>
  );
}
