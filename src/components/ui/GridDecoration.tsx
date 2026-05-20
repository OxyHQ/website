export function HorizontalLine({
  className = '',
  dashed = false,
}: {
  className?: string;
  dashed?: boolean;
}) {
  return (
    <svg width="100%" height="1" className={className}>
      <line
        x1="0"
        y1="0.5"
        x2="100%"
        y2="0.5"
        stroke="currentColor"
        strokeDasharray={dashed ? '4 6' : undefined}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function VerticalLine({
  className = '',
  dashed = false,
}: {
  className?: string;
  dashed?: boolean;
}) {
  return (
    <svg width="1" height="100%" className={className}>
      <line
        x1="0.5"
        y1="0"
        x2="0.5"
        y2="100%"
        stroke="currentColor"
        strokeDasharray={dashed ? '4 6' : undefined}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CornerDot({ className = '' }: { className?: string }) {
  return <div className={`size-1 bg-input ${className}`} />;
}

/**
 * Three evenly-spaced dashed vertical lines spanning the section width.
 *
 * Used between rows on long marketing pages (CompanyPage, TechnologiesPage,
 * ReferralsPage, etc.) as a subtle grid divider. Defaults to a 20px tall
 * strip; pass a Tailwind height utility via `height` to change it.
 */
export function DashedVLines({ height = 'h-5' }: { height?: string }) {
  return (
    <div className={`grid w-full grid-cols-12 overflow-hidden ${height}`}>
      <div className="col-[2/-2] flex justify-between">
        <VerticalLine dashed className="text-border" />
        <VerticalLine dashed className="text-border" />
        <VerticalLine dashed className="text-border" />
      </div>
    </div>
  );
}
