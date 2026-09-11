/**
 * `Link`, `NavLink` and `Navigate` that resolve to the canonical URL.
 *
 * Import these instead of the react-router originals — `no-restricted-imports`
 * in `eslint.config.js` enforces it, and `scripts/internal-links.test.ts` fails
 * the build on a hand-written anchor that skips both. The normalisation itself,
 * and why it exists, lives in `./canonicalPath`.
 */
import { forwardRef, useCallback } from 'react'
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  Navigate as RouterNavigate,
  useNavigate as useRouterNavigate,
  type LinkProps,
  type NavLinkProps,
  type NavigateProps,
  type NavigateOptions,
  type To,
} from 'react-router-dom'
import { canonicalTo } from './canonicalPath'

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  return <RouterLink ref={ref} to={canonicalTo(to)} {...rest} />
})

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, ...rest },
  ref,
) {
  return <RouterNavLink ref={ref} to={canonicalTo(to)} {...rest} />
})

/**
 * A client-side redirect lands a URL in the address bar, and that is the URL
 * people copy and share. Sending them to the slash-less form would hand them
 * one that 308s.
 */
export function Navigate({ to, ...rest }: NavigateProps) {
  return <RouterNavigate to={canonicalTo(to)} {...rest} />
}

/**
 * `useNavigate`, normalising the path it pushes. Same reason as `Navigate`:
 * whatever ends up in the address bar is what gets copied and shared.
 */
export function useNavigate(): ReturnType<typeof useRouterNavigate> {
  const navigate = useRouterNavigate()
  return useCallback<ReturnType<typeof useRouterNavigate>>(
    (to: To | number, options?: NavigateOptions) => {
      // `navigate(-1)` is history traversal, not a URL.
      if (typeof to === 'number') return navigate(to)
      return navigate(canonicalTo(to), options)
    },
    [navigate],
  )
}

export type { LinkProps, NavLinkProps, NavigateProps }
