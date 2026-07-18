import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  /** Subtree to guard. Errors thrown anywhere inside render to fallback UI. */
  children: ReactNode
  /**
   * Optional fallback. Either a static React node or a render function that
   * receives the caught error + a `reset()` callback that clears the boundary
   * state so the children re-mount. Defaults to a minimal Tailwind card.
   */
  fallback?: ReactNode | ((args: { error: Error; reset: () => void }) => ReactNode)
  /**
   * Optional onError hook — fires once per caught error. Use for logging
   * to Sentry / a custom telemetry sink. Synchronous; do not throw.
   */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Route-level error boundary.
 *
 * Wraps a route subtree so a render-time throw doesn't bubble up to the
 * SPA root and leave `<div id="root">` empty. Without this, a `.map()` on
 * `undefined` (or any other render-phase exception) inside a lazy page would
 * unmount the entire app — the cold-load symptom that surfaced on
 * `/initiative` before this guard existed.
 *
 * Classes are still the only way to implement an error boundary in React;
 * `componentDidCatch` + `getDerivedStateFromError` together cover both the
 * state transition and the side-effect log. The fallback resets itself when
 * the user clicks "Try again", remounting the children once the underlying
 * issue is fixed (or the user navigates back).
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info)
    // Surface the failure so it's not swallowed silently in production.
    console.error('[ErrorBoundary] caught render error:', error, info)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    const { fallback } = this.props
    if (typeof fallback === 'function') {
      return fallback({ error, reset: this.reset })
    }
    if (fallback !== undefined) return fallback
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-24"
        role="alert"
      >
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Something went wrong loading this page.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We hit an unexpected error while rendering. Try refreshing. If the
            problem persists, our team has already been notified.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/90 cursor-pointer"
            >
              Try again
            </button>
            <a
              className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent"
              href="/"
            >
              Back home
            </a>
          </div>
        </div>
      </main>
    )
  }
}
