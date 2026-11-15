jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  breadcrumbsIntegration: jest.fn(() => ({ name: "Breadcrumbs" })),
  wrap: jest.fn((component) => component),
}));

jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: jest.fn(() => ({})),
  log: jest.fn(),
  recordError: jest.fn(),
  setAttribute: jest.fn(() => Promise.resolve(null)),
}));

const mockExtra: Record<string, unknown> = { appVariant: "staging" };

jest.mock("expo-constants", () => ({
  ...jest.requireActual("expo-constants"),
  __esModule: true,
  default: {
    // Read lazily: the hoisted factory runs before this module's constants.
    get expoConfig() {
      return { extra: mockExtra };
    },
    executionEnvironment: "bare",
  },
}));

import type * as Sentry from "@sentry/react-native";

function Root() {
  return null;
}

const previousDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

afterEach(() => {
  delete mockExtra.firebase;
  if (previousDsn === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  else process.env.EXPO_PUBLIC_SENTRY_DSN = previousDsn;
});

test("development startup prints to the console and never initializes a remote SDK", () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  process.env.EXPO_PUBLIC_SENTRY_DSN = "https://key@example.test/123";
  mockExtra.firebase = { analytics: false, crashlytics: true };
  const failure = new Error("test");

  jest.isolateModules(() => {
    const sentry = require("@sentry/react-native") as typeof Sentry;
    const crashlytics = require("@react-native-firebase/crashlytics");
    const { initializeObservability: initialize, withObservability } =
      require("./observability") as typeof import("./observability");
    const first = initialize();

    expect(initialize()).toBe(first);
    first.captureException(failure, { operation: "app.startup" });

    expect(consoleError).toHaveBeenCalledWith("[error] app.startup", failure);
    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(crashlytics.getCrashlytics).not.toHaveBeenCalled();
    expect(withObservability(Root)).toBe(Root);
  });
});

test("release startup initializes once with the selected variant", () => {
  jest.replaceProperty(
    globalThis as typeof globalThis & Record<"__DEV__", boolean>,
    "__DEV__",
    false,
  );

  process.env.EXPO_PUBLIC_SENTRY_DSN = "https://key@example.test/123";

  jest.isolateModules(() => {
    const sentry = require("@sentry/react-native") as typeof Sentry;
    const { initializeObservability: initialize } =
      require("./observability") as typeof import("./observability");
    const first = initialize();

    expect(initialize()).toBe(first);
    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "staging", enableNative: true }),
    );
  });
});

test("release startup selects Crashlytics without initializing Sentry", () => {
  jest.replaceProperty(
    globalThis as typeof globalThis & Record<"__DEV__", boolean>,
    "__DEV__",
    false,
  );

  mockExtra.firebase = { analytics: false, crashlytics: true };

  jest.isolateModules(() => {
    const sentry = require("@sentry/react-native") as typeof Sentry;
    const crashlytics = require("@react-native-firebase/crashlytics");
    const { initializeObservability: initialize, withObservability } =
      require("./observability") as typeof import("./observability");
    const reporter = initialize();

    reporter.captureException(new Error("test"), { operation: "app.startup" });

    expect(sentry.init).not.toHaveBeenCalled();
    expect(crashlytics.recordError).toHaveBeenCalledTimes(1);
    expect(withObservability(Root)).toBe(Root);
    expect(sentry.wrap).not.toHaveBeenCalled();
  });
});
