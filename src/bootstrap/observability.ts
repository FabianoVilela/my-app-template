import Constants, { ExecutionEnvironment } from "expo-constants";
import type { ComponentType } from "react";
import { Platform } from "react-native";
import { readEnv } from "@/infrastructure/env/read-env";
import {
  type ErrorReporter,
  noopErrorReporter,
} from "@/infrastructure/observability/error-reporter";
import {
  createSentryErrorReporter,
  withSentryRoot,
} from "@/infrastructure/observability/sentry-error-reporter";

let reporter: ErrorReporter | undefined;
let isSentryActive = false;

/** Process lifetime SDK setup; call before mounting React, never per render. */
export function initializeObservability(): ErrorReporter {
  // Do not create a process-global client for Expo Router server requests.
  if (Platform.OS === "web" && typeof window === "undefined")
    return noopErrorReporter;

  if (reporter) return reporter;

  try {
    const env = readEnv();

    // app.config.ts guarantees Crashlytics and a Sentry DSN are exclusive.
    if (env.firebase.crashlytics && Platform.OS !== "web") {
      // Load lazily: React Native Firebase throws at import time when its
      // native module is not linked, which is the case unless selected.
      const { createCrashlyticsErrorReporter } =
        require("@/infrastructure/observability/crashlytics-error-reporter") as typeof import("@/infrastructure/observability/crashlytics-error-reporter");
      reporter = createCrashlyticsErrorReporter({ isEnabled: !__DEV__ });
    } else {
      reporter = createSentryErrorReporter({
        dsn: env.sentryDsn,
        environment: env.appVariant,
        isEnabled: !__DEV__,
        isNativeEnabled:
          Platform.OS !== "web" &&
          Constants.executionEnvironment !== ExecutionEnvironment.StoreClient,
      });
      isSentryActive = reporter !== noopErrorReporter;
    }
  } catch {
    // Required configuration is still validated by normal startup and its retry UI.
    reporter = noopErrorReporter;
  }

  return reporter;
}

export function withObservability<P extends Record<string, unknown>>(
  component: ComponentType<P>,
): ComponentType<P> {
  return isSentryActive ? withSentryRoot(component) : component;
}
