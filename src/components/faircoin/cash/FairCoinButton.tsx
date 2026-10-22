import type { ComponentProps } from 'react';
import Button from '../../ui/Button';

/** Bloom interaction/semantics with this surface's generated, scoped palette. */
export default function FairCoinButton({
  variant = 'outline',
  className = '',
  ...props
}: ComponentProps<typeof Button>) {
  const palette =
    variant === 'inverse'
      ? '!bg-transparent !text-ring !border-transparent [&::after]:!bg-primary-foreground'
      : variant === 'ghost'
        ? '!bg-transparent !text-inherit !border-transparent [&::after]:!bg-transparent'
        : '!bg-transparent !text-inherit !border-current [&::after]:!bg-transparent';
  return (
    <Button
      variant={variant}
      className={`!min-h-12 !rounded-full !border !px-6 !text-sm !font-normal !shadow-none ![font-family:'FairCoin_Editorial',sans-serif] [&::before]:!hidden ${palette} ${className}`}
      {...props}
    />
  );
}
