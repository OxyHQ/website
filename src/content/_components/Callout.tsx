import type { ReactNode } from 'react';
import {
  AdmonitionRoot,
  AdmonitionRow,
  AdmonitionIcon,
  AdmonitionContent,
} from '@oxy.so/bloom/admonition';

interface CalloutProps {
  type?: 'info' | 'warning' | 'tip' | 'danger';
  title?: string;
  children: ReactNode;
}

/** The content API stays stable; Bloom owns the callout's design and status colors. */
export default function Callout({ type = 'info', title, children }: CalloutProps) {
  return (
    <div className="not-prose my-6 text-sm leading-relaxed" role="note">
      <AdmonitionRoot type={type === 'danger' ? 'error' : type}>
        <AdmonitionRow>
          <AdmonitionIcon />
          <AdmonitionContent>
            {title && <div className="mb-1 font-semibold">{title}</div>}
            <div className="opacity-90 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
              {children}
            </div>
          </AdmonitionContent>
        </AdmonitionRow>
      </AdmonitionRoot>
    </div>
  );
}
