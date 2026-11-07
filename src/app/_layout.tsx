import { AppNavigation } from "@/bootstrap/app-navigation";
import { AppProviders } from "@/bootstrap/app-providers";
import {
  initializeObservability,
  withObservability,
} from "@/bootstrap/observability";

const errorReporter = initializeObservability();

function RootLayout() {
  return (
    <AppProviders errorReporter={errorReporter}>
      <AppNavigation />
    </AppProviders>
  );
}

export default withObservability(RootLayout);
