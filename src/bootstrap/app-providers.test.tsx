jest.mock("expo-splash-screen", () => ({ hide: jest.fn() }));
jest.mock("./startup", () => ({ startup: jest.fn() }));

import { act, render, screen, userEvent } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";
import { Text } from "react-native";
import { createI18nextAdapter } from "@/infrastructure/i18n/i18next-adapter";
import type { ErrorReporter } from "@/infrastructure/observability/error-reporter";
import { AppProviders } from "./app-providers";
import { type AppSession, startup } from "./startup";

const startupMock = jest.mocked(startup);

function createReporter(): ErrorReporter {
  return { captureException: jest.fn(), addBreadcrumb: jest.fn() };
}

async function createSession(): Promise<AppSession> {
  const dependencies = await createI18nextAdapter({
    storage: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
    getDeviceLocales: () => ["en-US"],
    onReadError: jest.fn(),
  });

  return { dependencies, dispose: jest.fn() };
}

function renderProviders(errorReporter = createReporter()) {
  return render(
    <AppProviders errorReporter={errorReporter}>
      <Text>Ready</Text>
    </AppProviders>,
  );
}

test("renders the application after startup and hides the splash screen", async () => {
  const session = await createSession();
  startupMock.mockResolvedValue(session);

  const view = await renderProviders();

  expect(await screen.findByText("Ready")).toBeOnTheScreen();
  expect(SplashScreen.hide).toHaveBeenCalled();

  await view.unmount();
  expect(session.dispose).toHaveBeenCalledTimes(1);
});

test("reports a failed startup once per attempt and retries", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
  const failure = new Error("Invalid environment configuration");
  const reporter = createReporter();
  startupMock
    .mockRejectedValueOnce(failure)
    .mockResolvedValueOnce(await createSession());

  await renderProviders(reporter);

  const retry = await screen.findByRole("button", {
    name: "Try again · Tentar novamente",
  });

  expect(screen.getByRole("header")).toHaveTextContent(
    "Something went wrong · Algo deu errado",
  );
  expect(SplashScreen.hide).toHaveBeenCalled();
  expect(reporter.captureException).toHaveBeenCalledTimes(1);
  expect(reporter.captureException).toHaveBeenCalledWith(failure, {
    operation: "app.startup",
  });

  await userEvent.setup().press(retry);

  expect(await screen.findByText("Ready")).toBeOnTheScreen();
  expect(startupMock).toHaveBeenCalledTimes(2);
  expect(reporter.captureException).toHaveBeenCalledTimes(1);
});

test("disposes a session that finishes after unmounting", async () => {
  const session = await createSession();
  let resolve: (value: AppSession) => void = () => undefined;
  startupMock.mockReturnValue(
    new Promise((next) => {
      resolve = next;
    }),
  );

  const view = await renderProviders();
  await view.unmount();
  await act(async () => resolve(session));

  expect(session.dispose).toHaveBeenCalledTimes(1);
});
