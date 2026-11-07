import { Stack } from "expo-router";
import { AppProviders } from "@/bootstrap/app-providers";
import {
  initializeObservability,
  withObservability,
} from "@/bootstrap/observability";
import { useAppTranslation } from "@/shared/i18n";

const errorReporter = initializeObservability();

export function AppNavigation() {
  const { t } = useAppTranslation("navigation");

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("home") }} />
    </Stack>
  );
}

function RootLayout() {
  return (
    <AppProviders errorReporter={errorReporter}>
      <AppNavigation />
    </AppProviders>
  );
}

export default withObservability(RootLayout);
