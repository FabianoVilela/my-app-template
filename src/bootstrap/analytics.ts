import { Platform } from "react-native";
import { noopAnalyticsTracker } from "@/infrastructure/analytics/analytics-tracker";
import { readEnv } from "@/infrastructure/env/read-env";
import type { AppAnalyticsTracker } from "./analytics-events";

let tracker: AppAnalyticsTracker | undefined;

/** Process lifetime SDK access; call before mounting React, never per render. */
export function initializeAnalytics(): AppAnalyticsTracker {
  // Firebase Analytics is native-only here; web keeps the no-op tracker.
  if (Platform.OS === "web") return noopAnalyticsTracker;

  if (tracker) return tracker;

  try {
    const env = readEnv();
    if (env.firebase.analytics) {
      // Load lazily: React Native Firebase throws at import time when its
      // native module is not linked, which is the case unless selected.
      const { createFirebaseAnalyticsTracker } =
        require("@/infrastructure/analytics/firebase-analytics-tracker") as typeof import("@/infrastructure/analytics/firebase-analytics-tracker");
      tracker = createFirebaseAnalyticsTracker({ isEnabled: !__DEV__ });
    } else {
      tracker = noopAnalyticsTracker;
    }
  } catch {
    // Required configuration is still validated by normal startup and its retry UI.
    tracker = noopAnalyticsTracker;
  }

  return tracker;
}
