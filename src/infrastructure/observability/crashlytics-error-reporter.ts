import {
  getCrashlytics,
  log,
  recordError,
  setAttribute,
} from "@react-native-firebase/crashlytics";
import { type ErrorReporter, noopErrorReporter } from "./error-reporter";

/** Reporting must not replace the original failure or interrupt the operation. */
function ignoreFailure(call: () => unknown) {
  try {
    Promise.resolve(call()).catch(() => undefined);
  } catch {
    // Swallowed: telemetry is best-effort.
  }
}

type CrashlyticsErrorReporterOptions = {
  isEnabled: boolean;
};

/**
 * Native collection settings live in firebase.json: debug builds never send
 * and the JS handler does not chain into a duplicate native crash.
 */
export function createCrashlyticsErrorReporter(
  options: CrashlyticsErrorReporterOptions,
): ErrorReporter {
  if (!options.isEnabled) return noopErrorReporter;

  let crashlytics: ReturnType<typeof getCrashlytics>;
  try {
    crashlytics = getCrashlytics();
  } catch {
    // Telemetry is optional and must never prevent application startup.
    return noopErrorReporter;
  }

  return {
    captureException(error, context) {
      // Custom keys are sticky in Crashlytics: this holds the last reported
      // operation, not a per-event tag.
      ignoreFailure(() =>
        setAttribute(crashlytics, "operation", context.operation),
      );
      ignoreFailure(() =>
        recordError(
          crashlytics,
          error instanceof Error ? error : new Error("Non-Error exception"),
        ),
      );
    },
    addBreadcrumb(operation) {
      ignoreFailure(() => log(crashlytics, operation));
    },
  };
}
