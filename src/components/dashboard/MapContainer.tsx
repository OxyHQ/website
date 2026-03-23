import { lazy, Suspense } from "react";

const DottedMap = lazy(() => import("./DottedMap"));

interface MapContainerProps {
  activeCountries?: Array<{ location: string; count: number }>;
}

export default function MapContainer({ activeCountries }: MapContainerProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[560px] bg-background animate-pulse rounded-md" />
      }
    >
      <DottedMap activeCountries={activeCountries} />
    </Suspense>
  );
}
