import type { ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { Button as BloomButton } from '@oxyhq/bloom/button'

type Variant = 'primary' | 'outline' | 'ghost' | 'inverse'
type Size = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: Variant
  size?: Size
  /** Use a taller, touch-friendly size below the lg breakpoint */
  responsive?: boolean
  children: ReactNode
  className?: string
}

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }

type ButtonAsLink = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

type ButtonProps = ButtonAsButton | ButtonAsLink

export default function Button({
  variant = 'primary',
  size = 'md',
  responsive = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const classes = [
    responsive && 'max-lg:!min-h-[46px] max-lg:!px-3.5 max-lg:!text-base',
    className,
  ].filter(Boolean).join(' ')

  if ('href' in props && props.href) {
    const { href, ...rest } = props as ButtonAsLink
    if (href.startsWith('/')) {
      return (
        <BloomButton asChild variant={variant} size={size} className={classes}>
          <Link to={href} {...rest}>{children}</Link>
        </BloomButton>
      )
    }
    return (
      <BloomButton asChild variant={variant} size={size} className={classes}>
        <a href={href} {...rest}>{children}</a>
      </BloomButton>
    )
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <BloomButton
      asChild
      variant={variant}
      size={size}
      className={classes}
      disabled={buttonProps.disabled}
    >
      <button {...buttonProps}>{children}</button>
    </BloomButton>
  )
}
