jest.mock("@react-native-firebase/analytics", () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(() => Promise.resolve()),
  logScreenView: jest.fn(() => Promise.resolve()),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  setConsent: jest.fn(() => Promise.resolve()),
}));

function initializeWith(firebase?: {
  analytics: boolean;
  crashlytics: boolean;
}) {
  let result: ReturnType<typeof import("./analytics").initializeAnalytics>;
  let analytics: typeof import("@react-native-firebase/analytics");
  let isNoop = false;

  jest.isolateModules(() => {
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: { extra: { appVariant: "staging", firebase } } },
    }));
    analytics = require("@react-native-firebase/analytics");
    const { initializeAnalytics } =
      require("./analytics") as typeof import("./analytics");
    const { noopAnalyticsTracker } =
      require("@/infrastructure/analytics/analytics-tracker") as typeof import("@/infrastructure/analytics/analytics-tracker");
    result = initializeAnalytics();
    isNoop = result === noopAnalyticsTracker;
    expect(initializeAnalytics()).toBe(result);
  });

  // biome-ignore lint/style/noNonNullAssertion: assigned synchronously above.
  return { tracker: result!, analytics: analytics!, isNoop };
}

function releaseBuild() {
  jest.replaceProperty(
    globalThis as typeof globalThis & Record<"__DEV__", boolean>,
    "__DEV__",
    false,
  );
}

test("stays inert when Analytics is not selected", () => {
  releaseBuild();
  const { isNoop, analytics } = initializeWith();

  expect(isNoop).toBe(true);
  expect(analytics.getAnalytics).not.toHaveBeenCalled();
});

test("debug builds never use the SDK", () => {
  const { isNoop, analytics } = initializeWith({
    analytics: true,
    crashlytics: false,
  });

  expect(isNoop).toBe(true);
  expect(analytics.getAnalytics).not.toHaveBeenCalled();
});

test("release builds use Firebase once Analytics is selected", () => {
  releaseBuild();
  const { tracker, analytics } = initializeWith({
    analytics: true,
    crashlytics: false,
  });

  tracker.logScreenView("/");

  expect(analytics.getAnalytics).toHaveBeenCalledTimes(1);
  expect(analytics.logScreenView).toHaveBeenCalledTimes(1);
});
