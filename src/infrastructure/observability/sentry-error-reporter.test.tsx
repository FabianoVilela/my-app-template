jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  breadcrumbsIntegration: jest.fn(() => ({ name: "Breadcrumbs" })),
  wrap: jest.fn((component) => component),
}));

import * as Sentry from "@sentry/react-native";
import { noopErrorReporter } from "./error-reporter";
import { createSentryErrorReporter } from "./sentry-error-reporter";

const options = {
  dsn: "https://key@example.test/123",
  environment: "staging",
  isEnabled: true,
  isNativeEnabled: true,
};

beforeEach(() => {
  jest.mocked(Sentry.init).mockReset();
  jest.mocked(Sentry.captureException).mockReset();
  jest.mocked(Sentry.addBreadcrumb).mockReset();
});

test("does not initialize or send without a DSN or when disabled", () => {
  for (const overrides of [{ dsn: undefined }, { isEnabled: false }]) {
    const reporter = createSentryErrorReporter({ ...options, ...overrides });
    expect(reporter).toBe(noopErrorReporter);
    reporter.captureException(new Error("test"), { operation: "app.startup" });
    reporter.addBreadcrumb("app.startup");
  }

  expect(Sentry.init).not.toHaveBeenCalled();
  expect(Sentry.captureException).not.toHaveBeenCalled();
});

test("preserves errors and scopes operation context to each event", () => {
  const reporter = createSentryErrorReporter(options);
  const error = new Error("Startup failed");
  reporter.captureException(error, { operation: "app.startup" });
  reporter.captureException(error, { operation: "i18n.restore-preference" });

  expect(Sentry.captureException).toHaveBeenNthCalledWith(1, error, {
    tags: { operation: "app.startup" },
  });
  expect(Sentry.captureException).toHaveBeenNthCalledWith(2, error, {
    tags: { operation: "i18n.restore-preference" },
  });

  reporter.addBreadcrumb("app.startup");

  expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
    category: "app.operation",
    message: "app.startup",
    level: "info",
  });
});

test("does not serialize unknown thrown objects", () => {
  const reporter = createSentryErrorReporter(options);

  reporter.captureException(
    { password: "secret" },
    { operation: "app.startup" },
  );

  expect(Sentry.captureException).toHaveBeenCalledWith(
    new Error("Non-Error exception"),
    expect.anything(),
  );
});

test("telemetry failures never interrupt application code", () => {
  jest.mocked(Sentry.init).mockImplementationOnce(() => {
    throw new Error("SDK unavailable");
  });

  expect(createSentryErrorReporter(options)).toBe(noopErrorReporter);
  const reporter = createSentryErrorReporter(options);

  jest.mocked(Sentry.captureException).mockImplementationOnce(() => {
    throw new Error("SDK unavailable");
  });

  jest.mocked(Sentry.addBreadcrumb).mockImplementationOnce(() => {
    throw new Error("SDK unavailable");
  });

  expect(() =>
    reporter.captureException(new Error("test"), { operation: "app.startup" }),
  ).not.toThrow();
  expect(() => reporter.addBreadcrumb("app.startup")).not.toThrow();
});

test("removes request, identity, extras and automatic breadcrumbs before sending", () => {
  createSentryErrorReporter({ ...options, isNativeEnabled: false });
  const config = jest.mocked(Sentry.init).mock.calls[0][0];

  expect(config).toMatchObject({
    enableNative: false,
    sendDefaultPii: false,
    enableLogs: false,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });

  const event: Sentry.ErrorEvent = {
    type: undefined,
    request: { url: "https://private.test?token=secret" },
    user: { email: "private@example.test" },
    extra: { password: "secret" },
    breadcrumbs: [
      { category: "http", data: { token: "secret" } },
      { category: "app.operation", message: "app.startup" },
    ],
    exception: { values: [{ type: "Error", value: "Startup failed" }] },
  };

  expect(config?.beforeSend?.(event, {})).toEqual({
    type: undefined,
    exception: event.exception,
    breadcrumbs: [{ category: "app.operation", message: "app.startup" }],
  });
  expect(
    config?.beforeBreadcrumb?.({ category: "console", message: "secret" }, {}),
  ).toBeNull();
});
