// Exact 20×20 icon paths from the supplied america.gov reference.
const PATHS = {
  arrow: ['M10 3L8.59 4.41L13.17 9H3V11H13.17L8.59 15.59L10 17L17 10L10 3Z'],
  previous: ['M7.77 10L13.06 4.71L11.65 3.29L4.94 10L11.65 16.71L13.06 15.29L7.77 10Z'],
  next: ['M8.35 3.29L15.06 10L8.35 16.71L6.94 15.29L12.23 10L6.94 4.71L8.35 3.29Z'],
  play: ['M6 3L18 10L6 17L6 3Z'],
  pause: [
    'M8 4C8 3.45 7.55 3 7 3H5C4.45 3 4 3.45 4 4V16C4 16.55 4.45 17 5 17H7C7.55 17 8 16.55 8 16V4Z',
    'M16 4C16 3.45 15.55 3 15 3H13C12.45 3 12 3.45 12 4V16C12 16.55 12.45 17 13 17H15C15.55 17 16 16.55 16 16V4Z',
  ],
  lock: [
    'M14 7V5C14 2.79 12.21 1 10 1C7.79 1 6 2.79 6 5V11H8V5C8 3.9 8.9 3 10 3C11.1 3 12 3.9 12 5V7H14Z',
    'M15 7H5C3.9 7 3 7.9 3 9V17C3 18.1 3.9 19 5 19H15C16.1 19 17 18.1 17 17V9C17 7.9 16.1 7 15 7ZM11 15H9V11H11V15Z',
  ],
} as const;

export default function CommonsIcon({
  name,
  size = 20,
  className = '',
}: {
  name: keyof typeof PATHS;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      {PATHS[name].map((d, i) => (
        <path
          key={i}
          d={d}
          fillRule="evenodd"
          clipRule="evenodd"
          className={name === 'lock' && i === 0 ? 'commons-lock-shackle' : undefined}
        />
      ))}
    </svg>
  );
}
