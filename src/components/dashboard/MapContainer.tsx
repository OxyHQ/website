import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Skeleton from "@oxy.so/bloom/skeleton";
import type { InfraStatusNode, PlatformActivityEvent } from "../../api/hooks";

const LiveGlobe = lazy(() => import("./LiveGlobe"));
const DottedMap = lazy(() => import("./DottedMap"));

interface MapContainerProps {
  isGlobe: boolean;
  infraStatus?: InfraStatusNode[];
  activityEvents?: PlatformActivityEvent[];
}

export default function MapContainer({ isGlobe, infraStatus, activityEvents }: MapContainerProps) {
  return (
    <div className="relative h-full w-full">
      <Suspense
        fallback={
          <Skeleton.Box width="100%" height={560} borderRadius={6} />
        }
      >
        <AnimatePresence initial={false} mode="wait">
          {isGlobe ? (
            <motion.div
              key="globe"
              className="absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LiveGlobe infraStatus={infraStatus} activityEvents={activityEvents} />
            </motion.div>
          ) : (
            <motion.div
              key="flat-map"
              className="absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DottedMap infraStatus={infraStatus} activityEvents={activityEvents} />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
