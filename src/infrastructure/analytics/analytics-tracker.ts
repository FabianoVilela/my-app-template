/**
 * Values are fixed technical identifiers or bounded counts: never personal data,
 * user input, credentials, URLs or response payloads.
 */
export type AnalyticsParams = Record<string, string | number>;

export interface AnalyticsTracker {
  /** Records the user's analytics consent; collection starts only when granted. */
  setCollectionConsent(isGranted: boolean): Promise<void>;
  /** `screen` is a route pattern such as `/items/[id]`, never a concrete path. */
  logScreenView(screen: string): void;
  logEvent(name: string, params?: AnalyticsParams): void;
}

export const noopAnalyticsTracker: AnalyticsTracker = {
  setCollectionConsent: async () => undefined,
  logScreenView: () => undefined,
  logEvent: () => undefined,
};
