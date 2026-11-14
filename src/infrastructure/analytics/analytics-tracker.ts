/**
 * Values are fixed technical identifiers or bounded counts: never personal data,
 * user input, credentials, URLs or response payloads.
 */
export type AnalyticsParams = Record<string, string | number>;

/** Event name mapped to its parameters, or `undefined` for an event without any. */
export type AnalyticsEventMap = Record<string, AnalyticsParams | undefined>;

/** Parameters are optional only when the event's entry allows `undefined`. */
export type AnalyticsEventArgs<Params> = undefined extends Params
  ? [params?: Params]
  : [params: Params];

/**
 * Bootstrap binds the app's event catalog and route patterns; the defaults
 * accept any name and exist for adapters and their tests.
 */
export interface AnalyticsTracker<
  Events extends AnalyticsEventMap = AnalyticsEventMap,
  Screen extends string = string,
> {
  /** Records the user's analytics consent; collection starts only when granted. */
  setCollectionConsent(isGranted: boolean): Promise<void>;
  /** `screen` is a route pattern such as `/items/[id]`, never a concrete path. */
  logScreenView(screen: Screen): void;
  logEvent<Name extends keyof Events & string>(
    name: Name,
    ...args: AnalyticsEventArgs<Events[Name]>
  ): void;
}

export const noopAnalyticsTracker: AnalyticsTracker = {
  setCollectionConsent: async () => undefined,
  logScreenView: () => undefined,
  logEvent: () => undefined,
};
