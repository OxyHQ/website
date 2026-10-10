import type { ReactNode } from 'react';
import {
  AdmonitionRoot,
  AdmonitionRow,
  AdmonitionIcon,
  AdmonitionContent,
} from '@oxy.so/bloom/admonition';
import { DocsExample } from '../docs/DocsExample';
import { DocsInstall } from '../docs/DocsInstall';
import { reactNodeToText } from '../../lib/useCopyToClipboard';
import { cn } from '../../lib/utils';
import CodeBlock from '../../content/_components/CodeBlock';

/* -------------------------------- Code -------------------------------- */

interface CodeProps {
  language?: string;
  children: ReactNode;
}

export function Code({ language, children }: CodeProps) {
  return <CodeBlock language={language}>{children}</CodeBlock>;
}

/* ------------------------------- Callout ------------------------------ */

interface CalloutProps {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: ReactNode;
}

export function Callout({ variant = 'info', title, children }: CalloutProps) {
  const type = variant === 'danger' ? 'error' : variant === 'success' ? 'tip' : variant;
  return (
    <div className="not-prose my-6 text-sm leading-[22px]" role="note">
      <AdmonitionRoot type={type} style={{ borderRadius: 16, padding: 16 }}>
        <AdmonitionRow>
          <AdmonitionIcon />
          <AdmonitionContent>
            {title ? <p className="mb-1 font-medium text-foreground">{title}</p> : null}
            <div className="text-muted-foreground [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
              {children}
            </div>
          </AdmonitionContent>
        </AdmonitionRow>
      </AdmonitionRoot>
    </div>
  );
}

/* -------------------------------- Badge ------------------------------- */

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}

const badgeStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success-subtle text-success-text',
  warning: 'bg-warning-subtle text-warning-text',
  danger: 'bg-error-subtle text-error-text',
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={cn(
        'not-prose inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        badgeStyles[variant],
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------- LiveExample ---------------------------- */

interface LiveExampleProps {
  /** Optional title shown above the preview. */
  title?: string;
  /** Live element to render. Passed in by MDX call-sites. */
  children: ReactNode;
  /** Optional source code shown below the preview. */
  source?: string;
}

export function LiveExample({ title, children, source }: LiveExampleProps) {
  return (
    <div className="my-6">
      <DocsExample title={title} code={source}>
        {children}
      </DocsExample>
    </div>
  );
}

/* -------------------------------- MdxPre ------------------------------ */

/**
 * Fenced code blocks (```lang). The fence's language comes through as the
 * inner `<code className="language-x">`; the block itself is the site's
 * `CodeBlock` (Bloom's code card), so a fenced block and an explicit
 * `<CodeBlock>` look and copy the same. Inline `code` keeps its own pill via
 * the tag map, so this only owns block code.
 */
export function MdxPre({ children }: { children?: ReactNode }) {
  let language: string | undefined;
  if (children && typeof children === 'object' && 'props' in children) {
    const className = (children as { props?: { className?: string } }).props?.className ?? '';
    language = /language-([\w-]+)/.exec(className)?.[1];
  }
  // Plain package installation commands use the same manager switcher as the
  // component reference. Scripts, flags and multiline commands stay verbatim.
  const command = reactNodeToText(children).trim();
  const install = /^(?:npm (?:install|i)|(?:pnpm|yarn|bun) add) ([^\n]+)$/.exec(command);
  if (install && (!language || ['sh', 'bash', 'shell'].includes(language))) {
    const packages = install[1].split(/\s+/);
    if (
      packages.every(
        (name) => /^(?:@[\w.-]+\/)?[\w.-]+(?:@[\w.^~*+-]+)?$/.test(name) && !name.startsWith('-'),
      )
    ) {
      return (
        <div className="my-5">
          <DocsInstall packageName={packages.join(' ')} />
        </div>
      );
    }
  }
  return (
    <CodeBlock language={language} className="my-5">
      {children}
    </CodeBlock>
  );
}
