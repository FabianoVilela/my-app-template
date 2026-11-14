import { usePathname, useSegments } from "expo-router";
import { useEffect } from "react";
import type { AnalyticsTracker } from "@/infrastructure/analytics/analytics-tracker";

/** `["(tabs)", "items", "[id]"]` becomes `/items/[id]`: groups and values dropped. */
export function toRoutePattern(segments: readonly string[]): string {
  return `/${segments.filter((segment) => !/^\(.*\)$/.test(segment)).join("/")}`;
}

/**
 * Logs one screen view per navigation. The pathname only triggers the log;
 * the reported name is the route pattern, so parameters never leave the app.
 */
export function useScreenTracking(analytics: AnalyticsTracker) {
  const pathname = usePathname();
  const pattern = toRoutePattern(useSegments());

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname marks a new navigation to the same pattern.
  useEffect(() => {
    analytics.logScreenView(pattern);
  }, [analytics, pathname, pattern]);
}
