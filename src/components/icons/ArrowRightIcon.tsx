import type { SVGProps } from 'react'

/** Right-pointing arrow used in pagination links and CTAs. */
export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
        d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5"
      />
    </svg>
  )
}
