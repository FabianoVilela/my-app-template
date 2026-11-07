import { render, screen, userEvent } from "@testing-library/react-native";
import type { ErrorReporter } from "@/infrastructure/observability/error-reporter";
import { RouteErrorFallback } from "./route-error-fallback";

test("reports the render error once and retries the route", async () => {
  const errorReporter: ErrorReporter = {
    captureException: jest.fn(),
    addBreadcrumb: jest.fn(),
  };
  const error = new Error("render");
  const retry = jest.fn(() => Promise.resolve());

  const view = await render(
    <RouteErrorFallback
      error={error}
      retry={retry}
      errorReporter={errorReporter}
    />,
  );
  await view.rerender(
    <RouteErrorFallback
      error={error}
      retry={retry}
      errorReporter={errorReporter}
    />,
  );

  expect(errorReporter.captureException).toHaveBeenCalledTimes(1);
  expect(errorReporter.captureException).toHaveBeenCalledWith(error, {
    operation: "app.render",
  });

  await userEvent
    .setup()
    .press(
      screen.getByRole("button", { name: "Try again · Tentar novamente" }),
    );

  expect(retry).toHaveBeenCalledTimes(1);
});
