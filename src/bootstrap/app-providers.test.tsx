jest.mock("react-native-nitro-modules", () => ({}));
jest.mock("@/infrastructure/env/read-env", () => ({
  readEnv: () => {
    throw new Error("Invalid environment configuration");
  },
}));

import { render, screen, userEvent } from "@testing-library/react-native";
import type { ErrorReporter } from "@/infrastructure/observability/error-reporter";
import { AppProviders } from "./app-providers";

test("reports failed startup once per attempt and preserves retry", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => undefined);

  const reporter: ErrorReporter = {
    captureException: jest.fn(),
    addBreadcrumb: jest.fn(),
  };

  await render(<AppProviders errorReporter={reporter}>{null}</AppProviders>);

  const retry = await screen.findByRole("button", {
    name: "Retry",
  });

  expect(reporter.captureException).toHaveBeenCalledTimes(1);
  expect(reporter.captureException).toHaveBeenCalledWith(
    new Error("Invalid environment configuration"),
    { operation: "app.startup" },
  );

  await userEvent.setup().press(retry);
  expect(reporter.captureException).toHaveBeenCalledTimes(2);
});
