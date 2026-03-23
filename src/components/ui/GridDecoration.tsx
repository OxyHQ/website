export function HorizontalLine({ className = '' }: { className?: string }) {
  return (
    <svg width="100%" height="1" className={className}>
      <line
        x1="0"
        y1="0.5"
        x2="100%"
        y2="0.5"
        stroke="currentColor"
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
