import type { InfraStatusNode } from "../../api/hooks";
import { infrastructureNodes } from "../../data/dashboard/infra-nodes";

const STATUS_COLORS = {
  unknown: 'var(--muted-foreground)',
  online: 'var(--color-success)',
  degraded: 'var(--color-warning)',
  offline: 'var(--color-destructive)',
} as const;

interface InfraOverlayProps {
  nodes?: InfraStatusNode[];
}

export default function InfraOverlay({ nodes }: InfraOverlayProps) {
  if (!nodes || nodes.length === 0) return null;

  const statusMap = new Map<string, InfraStatusNode>();
  for (const node of nodes) statusMap.set(node.region, node);

  return (
    <div className="space-y-2">
      <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-muted-foreground">
        Infrastructure
      </h2>
      <ul className="list-none pl-0 space-y-1">
        {infrastructureNodes(nodes).map(infra => {
          const status = statusMap.get(infra.region);
          const state = status?.status ?? 'unknown';
          const totalServices = status
            ? status.instances ?? infra.services.length
            : infra.services.length;

          return (
            <li key={infra.region} className="flex items-center w-full md:w-fit justify-between md:justify-start">
              <span aria-hidden="true" className="inline-block translate-y-[-2px] translate-x-[2px]">
                <span style={{ color: STATUS_COLORS[state] }}>
                  {state === 'online' ? '■' : state === 'degraded' ? '▲' : '●'}
                </span>
              </span>
              <div className="text-left">
                <h3 className="inline-block my-0 font-medium text-[16px]" style={{ color: STATUS_COLORS[state] }}>
                  &nbsp;{infra.label}
                </h3>
              </div>
              <div className="w-[12ch] text-right">
                <span className="inline-flex tabular-nums text-muted-foreground text-sm">
                  {totalServices} svc
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
