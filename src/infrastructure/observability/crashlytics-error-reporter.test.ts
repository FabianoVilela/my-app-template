jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: jest.fn(() => ({ name: "crashlytics" })),
  log: jest.fn(),
  recordError: jest.fn(),
  setAttribute: jest.fn(() => Promise.resolve(null)),
}));

import {
  getCrashlytics,
  log,
  recordError,
  setAttribute,
} from "@react-native-firebase/crashlytics";
import { createCrashlyticsErrorReporter } from "./crashlytics-error-reporter";
import { noopErrorReporter } from "./error-reporter";

const instance = { name: "crashlytics" };

test("does not touch the SDK when disabled", () => {
  const reporter = createCrashlyticsErrorReporter({ isEnabled: false });

  expect(reporter).toBe(noopErrorReporter);
  expect(getCrashlytics).not.toHaveBeenCalled();
});

test("records errors with the reporting operation", () => {
  const reporter = createCrashlyticsErrorReporter({ isEnabled: true });
  const error = new Error("Startup failed");

  reporter.captureException(error, { operation: "app.startup" });

  expect(setAttribute).toHaveBeenCalledWith(
    instance,
    "operation",
    "app.startup",
  );
  expect(recordError).toHaveBeenCalledWith(instance, error);
});

test("does not serialize unknown thrown objects", () => {
  const reporter = createCrashlyticsErrorReporter({ isEnabled: true });

  reporter.captureException({ token: "private" }, { operation: "app.startup" });

  const [, recorded] = jest.mocked(recordError).mock.calls[0];
  expect(recorded).toEqual(new Error("Non-Error exception"));
  expect(JSON.stringify(recorded)).not.toContain("private");
});

test("logs operations as breadcrumbs", () => {
  createCrashlyticsErrorReporter({ isEnabled: true }).addBreadcrumb(
    "app.startup",
  );

  expect(log).toHaveBeenCalledWith(instance, "app.startup");
});

test("swallows SDK failures", async () => {
  jest.mocked(getCrashlytics).mockImplementationOnce(() => {
    throw new Error("No Firebase App");
  });

  expect(createCrashlyticsErrorReporter({ isEnabled: true })).toBe(
    noopErrorReporter,
  );

  const reporter = createCrashlyticsErrorReporter({ isEnabled: true });
  jest.mocked(setAttribute).mockRejectedValueOnce(new Error("native"));
  jest.mocked(recordError).mockImplementationOnce(() => {
    throw new Error("native");
  });
  jest.mocked(log).mockImplementationOnce(() => {
    throw new Error("native");
  });

  expect(() =>
    reporter.captureException(new Error("test"), { operation: "app.startup" }),
  ).not.toThrow();
  expect(() => reporter.addBreadcrumb("app.startup")).not.toThrow();
  await Promise.resolve();
});
