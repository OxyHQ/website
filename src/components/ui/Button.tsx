import type { ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { Link } from '../../lib/navigation';
import { Button as BloomButton } from '@oxy.so/bloom/button';
import type { BloomAppearance, BloomTone } from '@oxy.so/bloom/appearance';

type Variant = 'primary' | 'outline' | 'ghost' | 'inverse';

const VARIANT_STYLE: Record<Variant, { appearance: BloomAppearance; tone: BloomTone }> = {
  primary: { appearance: 'solid', tone: 'accent' },
  outline: { appearance: 'outline', tone: 'neutral' },
  ghost: { appearance: 'subtle', tone: 'neutral' },
  inverse: { appearance: 'solid', tone: 'neutral' },
};

interface ButtonBaseProps {
  variant?: Variant;
  /** Use a taller, touch-friendly size below the lg breakpoint */
  responsive?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({
  variant = 'primary',
  responsive = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const classes = [responsive && 'max-lg:!min-h-[46px] max-lg:!px-3.5 max-lg:!text-base', className]
    .filter(Boolean)
    .join(' ');
  const { appearance, tone } = VARIANT_STYLE[variant];

  if ('href' in props && props.href) {
    const { href, ...rest } = props as ButtonAsLink;
    if (href.startsWith('/')) {
      return (
        <BloomButton asChild appearance={appearance} tone={tone}>
          <Link to={href} {...rest} className={classes}>
            {children}
          </Link>
        </BloomButton>
      );
    }
    return (
      <BloomButton asChild appearance={appearance} tone={tone}>
        <a href={href} {...rest} className={classes}>
          {children}
        </a>
      </BloomButton>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <BloomButton asChild appearance={appearance} tone={tone} disabled={buttonProps.disabled}>
      <button {...buttonProps} className={classes}>
        {children}
      </button>
    </BloomButton>
  );
}
