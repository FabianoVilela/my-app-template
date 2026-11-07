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

/** Process lifetime SDK setup; call before mounting React, never per render. */
export function initializeObservability(): ErrorReporter {
  // Do not create a process-global client for Expo Router server requests.
  if (Platform.OS === "web" && typeof window === "undefined")
    return noopErrorReporter;

  if (reporter) return reporter;

  try {
    const env = readEnv();
    reporter = createSentryErrorReporter({
      dsn: env.sentryDsn,
      environment: env.appVariant,
      isEnabled: !__DEV__,
      isNativeEnabled:
        Platform.OS !== "web" &&
        Constants.executionEnvironment !== ExecutionEnvironment.StoreClient,
    });
  } catch {
    // Required configuration is still validated by normal startup and its retry UI.
    reporter = noopErrorReporter;
  }

  return reporter;
}

export function withObservability<P extends Record<string, unknown>>(
  component: ComponentType<P>,
): ComponentType<P> {
  return reporter && reporter !== noopErrorReporter
    ? withSentryRoot(component)
    : component;
}
