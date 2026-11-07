import { getLocales } from "expo-localization";
import { AppState } from "react-native";
import { readEnv } from "@/infrastructure/env/read-env";
import { createI18nextAdapter } from "@/infrastructure/i18n/i18next-adapter";
import type { ErrorReporter } from "@/infrastructure/observability/error-reporter";
import { createMmkvStorage } from "@/infrastructure/storage/mmkv-storage";

/** One entry per capability; providers receive their entry, never the whole set. */
export type AppDependencies = {
  i18n: Awaited<ReturnType<typeof createI18nextAdapter>>;
};

export type AppSession = {
  dependencies: AppDependencies;
  /** Releases subscriptions; call when the mounted application ends. */
  dispose(): void;
};

type StartupOptions = { errorReporter: ErrorReporter };

/**
 * Prepares what the first screen needs. Rejects when required configuration
 * or resources are unavailable; the caller reports the failure and retries.
 */
export async function startup({
  errorReporter,
}: StartupOptions): Promise<AppSession> {
  errorReporter.addBreadcrumb("app.startup");

  const env = readEnv();
  const i18n = await createI18nextAdapter({
    defaultLocale: env.defaultLocale,
    storage: createMmkvStorage({ id: "app-preferences" }),
    getDeviceLocales: () => getLocales().map((locale) => locale.languageTag),
    onReadError: (error) =>
      errorReporter.captureException(error, {
        operation: "i18n.restore-preference",
      }),
  });

  // The device language can change while the app is in the background.
  const subscription = AppState.addEventListener("change", (state) => {
    if (state !== "active") return;

    i18n.runtime.refreshDeviceLocale().catch((error: unknown) =>
      errorReporter.captureException(error, {
        operation: "i18n.refresh-device-locale",
      }),
    );
  });

  return { dependencies: { i18n }, dispose: () => subscription.remove() };
}
