import { getLocales } from "expo-localization";
import { type ReactNode, useEffect, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { readEnv } from "@/infrastructure/env/read-env";
import { createI18nextAdapter } from "@/infrastructure/i18n/i18next-adapter";
import type { ErrorReporter } from "@/infrastructure/observability/error-reporter";
import { createMmkvStorage } from "@/infrastructure/storage/mmkv-storage";
import { AppTranslationProvider } from "@/shared/i18n";

type Dependencies = Awaited<ReturnType<typeof createI18nextAdapter>>;
type AppProvidersProps = { children: ReactNode; errorReporter: ErrorReporter };

export function AppProviders({ children, errorReporter }: AppProvidersProps) {
  const [dependencies, setDependencies] = useState<Dependencies | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt intentionally retries startup.
  useEffect(() => {
    let active = true;
    let subscription: ReturnType<typeof AppState.addEventListener> | undefined;

    async function start() {
      try {
        errorReporter.addBreadcrumb("app.startup");
        const env = readEnv();
        const dependencies = await createI18nextAdapter({
          defaultLocale: env.defaultLocale,
          storage: createMmkvStorage({ id: "app-preferences" }),
          getDeviceLocales: () =>
            getLocales().map((locale) => locale.languageTag),
          onReadError: (error) =>
            errorReporter.captureException(error, {
              operation: "i18n.restore-preference",
            }),
        });

        if (!active) return;
        setDependencies(dependencies);
        subscription = AppState.addEventListener("change", (state) => {
          if (state === "active")
            void dependencies.runtime.refreshDeviceLocale().catch((error) =>
              errorReporter.captureException(error, {
                operation: "i18n.refresh-device-locale",
              }),
            );
        });
      } catch (error: unknown) {
        errorReporter.captureException(error, { operation: "app.startup" });

        if (__DEV__) console.warn("Unable to initialize application");
        if (active) setHasFailed(true);
      }
    }
    // Instance creation stays outside render and server requests never share it.
    void start();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [attempt, errorReporter]);

  if (hasFailed)
    return (
      <View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setHasFailed(false);
            setAttempt((value) => value + 1);
          }}
        >
          <Text>Retry</Text>
        </Pressable>
      </View>
    );

  if (!dependencies) return null;

  return (
    <AppTranslationProvider {...dependencies}>
      {children}
    </AppTranslationProvider>
  );
}
