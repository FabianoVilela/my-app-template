import {
  getAnalytics,
  logEvent,
  logScreenView,
  setAnalyticsCollectionEnabled,
  setConsent,
} from "@react-native-firebase/analytics";
import {
  type AnalyticsTracker,
  noopAnalyticsTracker,
} from "./analytics-tracker";

/** Best-effort delivery: the SDK drops events before consent and owns retries. */
function ignoreFailure(send: () => unknown) {
  try {
    // Typed void for custom events, but the native call returns a promise.
    Promise.resolve(send()).catch(() => undefined);
  } catch {
    // Analytics must not interrupt the observed interaction.
  }
}

type FirebaseAnalyticsTrackerOptions = {
  isEnabled: boolean;
};

/**
 * firebase.json starts collection disabled with every consent type denied.
 * Advertising signals stay denied even after the user grants analytics.
 */
export function createFirebaseAnalyticsTracker(
  options: FirebaseAnalyticsTrackerOptions,
): AnalyticsTracker {
  if (!options.isEnabled) return noopAnalyticsTracker;

  let analytics: ReturnType<typeof getAnalytics>;
  try {
    analytics = getAnalytics();
  } catch {
    // Analytics is optional and must never prevent application startup.
    return noopAnalyticsTracker;
  }

  return {
    async setCollectionConsent(isGranted) {
      await setConsent(analytics, {
        analytics_storage: isGranted,
        ad_storage: false,
        ad_user_data: false,
        ad_personalization: false,
      });
      await setAnalyticsCollectionEnabled(analytics, isGranted);
    },
    logScreenView(screen) {
      ignoreFailure(() =>
        logScreenView(analytics, { screen_name: screen, screen_class: screen }),
      );
    },
    logEvent(name, params) {
      ignoreFailure(() => logEvent(analytics, name, params));
    },
  };
}
