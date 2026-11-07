import * as Sentry from "@sentry/react-native";
import type { ComponentType } from "react";
import { type ErrorReporter, noopErrorReporter } from "./error-reporter";

type SentryErrorReporterOptions = {
  dsn?: string;
  environment: string;
  isEnabled: boolean;
  isNativeEnabled: boolean;
};

/** Keep request bodies, arbitrary extras and identity out of JS error events. */
function sanitizeErrorEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  delete event.request;
  delete event.user;
  delete event.extra;
  return event;
}

export function createSentryErrorReporter(
  options: SentryErrorReporterOptions,
): ErrorReporter {
  if (!options.isEnabled || !options.dsn) return noopErrorReporter;

  try {
    Sentry.init({
      dsn: options.dsn,
      environment: options.environment,
      enableNative: options.isNativeEnabled,
      sendDefaultPii: false,
      debug: false,
      enableLogs: false,
      enableAutoPerformanceTracing: false,
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      maxBreadcrumbs: 30,
      integrations: [
        Sentry.breadcrumbsIntegration({
          console: false,
          fetch: false,
          xhr: false,
        }),
      ],
      // Only explicit technical breadcrumbs survive, including native merges.
      beforeBreadcrumb: (breadcrumb) =>
        breadcrumb.category === "app.operation" ? breadcrumb : null,
      beforeSend: (event) => {
        event.breadcrumbs = event.breadcrumbs?.filter(
          (breadcrumb) => breadcrumb.category === "app.operation",
        );
        return sanitizeErrorEvent(event);
      },
    });
  } catch {
    // Telemetry is optional and must never prevent application startup.
    return noopErrorReporter;
  }

  return {
    captureException(error, context) {
      try {
        // Per-event context avoids leaking operation tags into subsequent events.
        Sentry.captureException(
          error instanceof Error ? error : new Error("Non-Error exception"),
          {
            tags: { operation: context.operation },
          },
        );
      } catch {
        // Reporting must not replace the original application failure.
      }
    },
    addBreadcrumb(operation) {
      try {
        Sentry.addBreadcrumb({
          category: "app.operation",
          message: operation,
          level: "info",
        });
      } catch {
        // Breadcrumb collection must not interrupt the observed operation.
      }
    },
  };
}

/** Framework integration stays at the technical edge, outside the reporting port. */
export function withSentryRoot<P extends Record<string, unknown>>(
  component: ComponentType<P>,
): ComponentType<P> {
  return Sentry.wrap(component);
}
