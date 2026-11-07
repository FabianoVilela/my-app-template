import * as SplashScreen from "expo-splash-screen";
import { type ReactNode, useEffect, useState } from "react";
import type { ErrorReporter } from "@/infrastructure/observability/error-reporter";
import { AppTranslationProvider } from "@/shared/i18n";
import { ErrorScreen } from "@/shared/ui/error-screen";
import { type AppDependencies, startup } from "./startup";

export type AppProvidersProps = {
  children: ReactNode;
  errorReporter: ErrorReporter;
};

type StartupState =
  | { status: "loading" }
  | { status: "ready"; dependencies: AppDependencies }
  | { status: "failed" };

/**
 * Runs startup per mounted application and composes its providers. The root
 * layout keeps the native splash screen visible until startup settles.
 */
export function AppProviders({ children, errorReporter }: AppProvidersProps) {
  const [state, setState] = useState<StartupState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt intentionally retries startup.
  useEffect(() => {
    let isActive = true;
    let dispose: (() => void) | undefined;

    startup({ errorReporter }).then(
      (session) => {
        if (!isActive) return session.dispose();

        dispose = session.dispose;
        setState({ status: "ready", dependencies: session.dependencies });
      },
      (error: unknown) => {
        errorReporter.captureException(error, { operation: "app.startup" });

        if (__DEV__) console.warn("Unable to initialize application");
        if (isActive) setState({ status: "failed" });
      },
    );

    return () => {
      isActive = false;
      dispose?.();
    };
  }, [attempt, errorReporter]);

  const isSettled = state.status !== "loading";

  useEffect(() => {
    if (isSettled) SplashScreen.hide();
  }, [isSettled]);

  function handleRetry() {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  if (state.status === "failed") return <ErrorScreen onRetry={handleRetry} />;

  // The native splash screen still covers this empty frame.
  if (state.status === "loading") return null;

  return (
    <AppTranslationProvider {...state.dependencies.i18n}>
      {children}
    </AppTranslationProvider>
  );
}
