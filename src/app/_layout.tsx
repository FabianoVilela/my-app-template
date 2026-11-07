import * as SplashScreen from "expo-splash-screen";
import { AppNavigation } from "@/bootstrap/app-navigation";
import { AppProviders } from "@/bootstrap/app-providers";
import {
  initializeObservability,
  withObservability,
} from "@/bootstrap/observability";

// Module scope, before React renders: AppProviders hides it after startup.
void SplashScreen.preventAutoHideAsync();

const errorReporter = initializeObservability();

function RootLayout() {
  return (
    <AppProviders errorReporter={errorReporter}>
      <AppNavigation />
    </AppProviders>
  );
}

export default withObservability(RootLayout);
