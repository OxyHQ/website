import type { ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: Variant
  size?: Size
  children: ReactNode
  className?: string
}

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }

type ButtonAsLink = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

type ButtonProps = ButtonAsButton | ButtonAsLink

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 gap-x-1.5 rounded-full px-3 text-sm',
  md: 'h-9 gap-x-1.5 rounded-full px-4 text-[15px]',
  lg: 'h-11.5 gap-x-2 rounded-full px-5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex cursor-pointer items-center justify-center text-nowrap border font-medium transition-colors duration-300 ease-in-out hover:duration-150 active:duration-50 disabled:pointer-events-none disabled:cursor-default select-none'

  const classes = `${base} button-${variant} ${sizeClasses[size]} ${className}`

  if ('href' in props && props.href) {
    const { href, ...rest } = props as ButtonAsLink
    if (href.startsWith('/')) {
      return (
        <Link className={classes} to={href} {...rest}>
          {children}
        </Link>
      )
    }
    return (
      <a className={classes} href={href} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  )
}
