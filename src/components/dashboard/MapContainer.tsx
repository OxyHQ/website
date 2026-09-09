import { lazy, Suspense } from "react";
import * as Skeleton from "@oxyhq/bloom/skeleton";
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
        <Skeleton.Box width="100%" height={560} borderRadius={6} />
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
