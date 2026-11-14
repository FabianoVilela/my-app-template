import { Stack } from "expo-router";
import { useUnistyles } from "react-native-unistyles";
import { useAppTranslation } from "@/shared/i18n";
import type { AppAnalyticsTracker } from "./analytics-events";
import { useScreenTracking } from "./screen-tracking";

export type AppNavigationProps = {
  analytics: AppAnalyticsTracker;
};

/** Root navigator, outside src/app/ so tests can mount it without the layout. */
export function AppNavigation({ analytics }: AppNavigationProps) {
  useScreenTracking(analytics);
  const { t } = useAppTranslation("navigation");
  // Navigator options are props, not styles, so they read the theme here.
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("home") }} />
    </Stack>
  );
}
