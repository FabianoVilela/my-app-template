import { Stack } from "expo-router";
import { useAppTranslation } from "@/shared/i18n";

/** Root navigator, outside src/app/ so tests can mount it without the layout. */
export function AppNavigation() {
  const { t } = useAppTranslation("navigation");

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("home") }} />
    </Stack>
  );
}
