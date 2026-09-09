import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Skeleton from "@oxyhq/bloom/skeleton";
import type { InfraStatusNode, PlatformActivityEvent } from "../../api/hooks";
import { ACTIVITY_CATEGORIES } from "../../data/dashboard/activity-categories";

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
      <div className="pointer-events-none absolute left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border/40 bg-background/55 px-3 py-2 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-md sm:text-xs">
        {ACTIVITY_CATEGORIES.map((category) => (
          <span key={category.id} className="flex items-center gap-1.5 whitespace-nowrap">
            <i className="h-2 w-2 rounded-full" style={{ background: category.color }} />
            {category.label}
          </span>
        ))}
      </div>
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
