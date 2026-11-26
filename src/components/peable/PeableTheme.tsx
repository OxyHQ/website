import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
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

/**
 * A plain Peable button is a text row (a disclosure, a card): its own height,
 * no side padding, the row's type. Bloom's inline type ramp steps aside
 * (`undefined`) so the row's classes set it, and the stylesheet's
 * `--bloom-btn-*` defaults fill in the rest.
 */
const PLAIN_LAYOUT: CSSProperties = {
  height: 'auto',
  paddingLeft: 0,
  paddingRight: 0,
  lineHeight: 1.5,
  fontSize: undefined,
  fontWeight: undefined,
  letterSpacing: undefined,
};

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
    >
      <button
        type="button"
        {...props}
        className={
          [appearance === 'plain' ? 'justify-start whitespace-normal' : '', className]
            .filter(Boolean)
            .join(' ') || undefined
        }
        style={appearance === 'plain' ? { ...PLAIN_LAYOUT, ...props.style } : props.style}
      >
        {children}
      </button>
    </Button>
  );
}
