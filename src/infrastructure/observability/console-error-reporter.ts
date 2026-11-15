import type { ErrorReporter } from "./error-reporter";

/**
 * Development reporter: prints what release builds send to the crash SDK, so
 * handled failures stay visible in the Metro terminal and LogBox. The only
 * application module allowed to use the console (see biome.json).
 */
export function createConsoleErrorReporter(): ErrorReporter {
  return {
    captureException(error, context) {
      console.error(`[error] ${context.operation}`, error);
    },
    addBreadcrumb(operation) {
      console.info(`[breadcrumb] ${operation}`);
    },
  };
}
