import { lazy, Suspense } from "react";
import * as Skeleton from "@oxyhq/bloom/skeleton";
import type { InfraStatusNode } from "../../api/hooks";

const DottedMap = lazy(() => import("./DottedMap"));

interface MapContainerProps {
  infraStatus?: InfraStatusNode[];
}

export default function MapContainer({ infraStatus }: MapContainerProps) {
  return (
    <Suspense
      fallback={
        <Skeleton.Box width="100%" height={560} borderRadius={6} />
      }
    >
      <DottedMap
        infraStatus={infraStatus}
      />
    </Suspense>
  );
}
