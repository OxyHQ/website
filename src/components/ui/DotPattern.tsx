interface DotPatternProps {
  className?: string;
  id?: string;
}

export default function DotPattern({ className = '', id = 'dot-pattern' }: DotPatternProps) {
  return (
    <svg
      width="100%"
      height="100%"
      className={`text-default-stroke absolute inset-0 ${className}`}
      style={{
        mask: 'radial-gradient(circle, transparent 0%, black 100%)',
        WebkitMask: 'radial-gradient(circle, transparent 0%, black 100%)',
      }}
    >
      <defs>
        <pattern
          id={id}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
