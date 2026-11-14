import type { ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { initializeAnalytics } from "@/bootstrap/analytics";
import { AppNavigation } from "@/bootstrap/app-navigation";
import { AppProviders } from "@/bootstrap/app-providers";
import {
  initializeObservability,
  withObservability,
} from "@/bootstrap/observability";
import { RouteErrorFallback } from "@/bootstrap/route-error-fallback";

// Module scope, before React renders: AppProviders hides it after startup.
void SplashScreen.preventAutoHideAsync();

const errorReporter = initializeObservability();
const analytics = initializeAnalytics();

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <RouteErrorFallback {...props} errorReporter={errorReporter} />;
}

function RootLayout() {
  return (
    <AppProviders errorReporter={errorReporter}>
      <AppNavigation analytics={analytics} />
    </AppProviders>
  );
}

export default withObservability(RootLayout);
