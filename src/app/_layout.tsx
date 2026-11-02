import { Stack } from "expo-router";
import { AppProviders } from "@/bootstrap/app-providers";
import { useAppTranslation } from "@/shared/i18n";

export function AppNavigation() {
  const { t } = useAppTranslation("navigation");

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("home") }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AppNavigation />
    </AppProviders>
  );
}
