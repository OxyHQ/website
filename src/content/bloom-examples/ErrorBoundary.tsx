import { ErrorBoundary } from '@oxy.so/bloom/error-boundary';

export default function ErrorBoundaryExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ErrorBoundary>
        <div className="rounded-xl border border-border p-6">
          This content is protected by an error boundary.
        </div>
      </ErrorBoundary>
    </div>
  );
}
