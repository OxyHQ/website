import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button, type ButtonProps } from '@oxy.so/bloom/button';
import { BloomColorScope } from '@oxy.so/bloom/theme';
import { PEABLE_PRESET } from '../../theme/brands';

/** Keep the fixed editorial surfaces and Bloom controls on the same palette. */
export function PeableScope({ mode, children }: { mode?: 'light' | 'dark'; children: ReactNode }) {
  return (
    <BloomColorScope colorPreset={PEABLE_PRESET} mode={mode} style={{ display: 'contents' }}>
      {children}
    </BloomColorScope>
  );
}

/** Native event props stay on the slotted element; Bloom owns interaction and paint. */
export function PeableButton({
  appearance = 'plain',
  iconOnly,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Pick<ButtonProps, 'appearance' | 'iconOnly'>) {
  return (
    <Button
      asChild
      appearance={appearance}
      tone="neutral"
      size="lg"
      iconOnly={iconOnly}
      pressed={
        props['aria-pressed'] === undefined
          ? undefined
          : props['aria-pressed'] === true || props['aria-pressed'] === 'true'
      }
      className={`${appearance === 'plain' ? 'h-auto whitespace-normal p-0 leading-normal justify-start' : ''} ${className}`}
    >
      <button type="button" {...props}>
        {children}
      </button>
    </Button>
  );
}
