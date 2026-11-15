import { createConsoleErrorReporter } from "./console-error-reporter";

test("prints reported errors with their operation", () => {
  const error = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  const failure = new Error("font missing");

  createConsoleErrorReporter().captureException(failure, {
    operation: "fonts.load",
  });

  expect(error).toHaveBeenCalledWith("[error] fonts.load", failure);
});

test("prints breadcrumbs as information", () => {
  const info = jest.spyOn(console, "info").mockImplementation(() => undefined);

  createConsoleErrorReporter().addBreadcrumb("app.startup");

  expect(info).toHaveBeenCalledWith("[breadcrumb] app.startup");
});
