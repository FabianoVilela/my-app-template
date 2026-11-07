jest.mock("@/infrastructure/storage/mmkv-storage", () => ({
  createMmkvStorage: () => ({
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  }),
}));

import { AppState, type AppStateStatus } from "react-native";
import * as env from "@/infrastructure/env/read-env";
import type { ErrorReporter } from "@/infrastructure/observability/error-reporter";
import { startup } from "./startup";

function setup() {
  const errorReporter: ErrorReporter = {
    captureException: jest.fn(),
    addBreadcrumb: jest.fn(),
  };
  const remove = jest.fn();
  let listener: ((state: AppStateStatus) => void) | undefined;

  jest.spyOn(AppState, "addEventListener").mockImplementation((_, next) => {
    listener = next;
    return { remove };
  });

  return {
    errorReporter,
    remove,
    changeAppState: (state: AppStateStatus) => listener?.(state),
  };
}

test("prepares translations and refreshes the device locale in the foreground", async () => {
  const { errorReporter, changeAppState } = setup();
  const session = await startup({ errorReporter });
  const refresh = jest
    .spyOn(session.dependencies.runtime, "refreshDeviceLocale")
    .mockResolvedValue();

  expect(errorReporter.addBreadcrumb).toHaveBeenCalledWith("app.startup");
  expect(session.dependencies.runtime.getSnapshot().locale).toBe("en");

  changeAppState("background");
  expect(refresh).not.toHaveBeenCalled();

  changeAppState("active");
  expect(refresh).toHaveBeenCalledTimes(1);
});

test("reports a failed locale refresh at its handling boundary", async () => {
  const { errorReporter, changeAppState } = setup();
  const session = await startup({ errorReporter });
  const failure = new Error("refresh");

  jest
    .spyOn(session.dependencies.runtime, "refreshDeviceLocale")
    .mockRejectedValue(failure);
  changeAppState("active");
  await Promise.resolve();

  expect(errorReporter.captureException).toHaveBeenCalledWith(failure, {
    operation: "i18n.refresh-device-locale",
  });
});

test("dispose removes the foreground subscription", async () => {
  const { errorReporter, remove } = setup();
  const session = await startup({ errorReporter });

  session.dispose();

  expect(remove).toHaveBeenCalledTimes(1);
});

test("rejects without subscribing when configuration is invalid", async () => {
  const { errorReporter } = setup();
  const failure = new Error("Invalid environment configuration");

  jest.spyOn(env, "readEnv").mockImplementation(() => {
    throw failure;
  });

  await expect(startup({ errorReporter })).rejects.toBe(failure);
  expect(AppState.addEventListener).not.toHaveBeenCalled();
});
