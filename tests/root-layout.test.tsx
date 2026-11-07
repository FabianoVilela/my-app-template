jest.mock("@/bootstrap/observability", () => {
  const reporter = { captureException: jest.fn(), addBreadcrumb: jest.fn() };

  return {
    initializeObservability: () => reporter,
    withObservability: (component: unknown) => component,
  };
});
jest.mock("@/bootstrap/startup", () => ({ startup: jest.fn() }));

import { renderRouter, screen } from "expo-router/testing-library";
import RootLayout, { ErrorBoundary } from "@/app/_layout";
import { initializeObservability } from "@/bootstrap/observability";
import { startup } from "@/bootstrap/startup";
import { createI18nextAdapter } from "@/infrastructure/i18n/i18next-adapter";

function BrokenScreen(): never {
  throw new Error("render");
}

test("the root boundary reports a screen render error and offers retry", async () => {
  // React logs errors caught by boundaries.
  jest.spyOn(console, "error").mockImplementation(() => undefined);

  jest.mocked(startup).mockResolvedValue({
    dependencies: await createI18nextAdapter({
      storage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      },
      getDeviceLocales: () => ["en-US"],
      onReadError: jest.fn(),
    }),
    dispose: jest.fn(),
  });

  await renderRouter(
    // The layout module's own exports: its default and its ErrorBoundary.
    {
      _layout: { default: () => <RootLayout />, ErrorBoundary },
      index: BrokenScreen,
    },
    { initialUrl: "/" },
  );

  expect(
    await screen.findByRole("button", { name: "Try again · Tentar novamente" }),
  ).toBeOnTheScreen();
  expect(initializeObservability().captureException).toHaveBeenCalledWith(
    new Error("render"),
    { operation: "app.render" },
  );
});
