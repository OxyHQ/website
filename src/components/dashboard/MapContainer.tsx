import { lazy, Suspense } from "react";
import type { InfraStatusNode, ActivityEvent } from "../../api/hooks";

const DottedMap = lazy(() => import("./DottedMap"));

interface MapContainerProps {
  activeCountries?: Array<{ location: string; count: number }>;
  infraStatus?: InfraStatusNode[];
  activityEvents?: ActivityEvent[];
}

export default function MapContainer({ activeCountries, infraStatus, activityEvents }: MapContainerProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[560px] bg-background animate-pulse rounded-md" />
      }
    >
      <DottedMap
        activeCountries={activeCountries}
        infraStatus={infraStatus}
        activityEvents={activityEvents}
      />
    </Suspense>
  );
}
