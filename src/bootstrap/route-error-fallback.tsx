import type { ErrorBoundaryProps } from "expo-router";
import { useEffect } from "react";
import type { ErrorReporter } from "@/infrastructure/observability/error-reporter";
import { ErrorScreen } from "@/shared/ui/error-screen";

export type RouteErrorFallbackProps = ErrorBoundaryProps & {
  errorReporter: ErrorReporter;
};

/**
 * Reports a render error caught by a route boundary once and offers retry.
 * Expo Router hides the splash screen itself when a boundary catches.
 */
export function RouteErrorFallback({
  error,
  retry,
  errorReporter,
}: RouteErrorFallbackProps) {
  useEffect(() => {
    errorReporter.captureException(error, { operation: "app.render" });
  }, [error, errorReporter]);

  function handleRetry() {
    void retry();
  }

  return <ErrorScreen onRetry={handleRetry} />;
}
