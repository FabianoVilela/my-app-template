jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  breadcrumbsIntegration: jest.fn(() => ({ name: "Breadcrumbs" })),
  wrap: jest.fn((component) => component),
}));

jest.mock("expo-constants", () => ({
  ...jest.requireActual("expo-constants"),
  __esModule: true,
  default: {
    expoConfig: { extra: { appVariant: "staging" } },
    executionEnvironment: "bare",
  },
}));

import * as Sentry from "@sentry/react-native";
import { initializeObservability } from "./observability";

const previousDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

afterEach(() => {
  if (previousDsn === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  else process.env.EXPO_PUBLIC_SENTRY_DSN = previousDsn;
});

test("development startup is idempotent and never initializes the remote SDK", () => {
  process.env.EXPO_PUBLIC_SENTRY_DSN = "https://key@example.test/123";
  const first = initializeObservability();

  expect(initializeObservability()).toBe(first);
  first.captureException(new Error("test"), { operation: "app.startup" });

  expect(Sentry.init).not.toHaveBeenCalled();
  expect(Sentry.captureException).not.toHaveBeenCalled();
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
