import { renderRouter, screen } from "expo-router/testing-library";

import Index from "@/app/index";

test("opens the home route from its URL", async () => {
  const result = await renderRouter({ index: Index }, { initialUrl: "/" });

  expect(result.getPathname()).toBe("/");
  expect(
    screen.getByText("Edit src/app/index.tsx to edit this screen."),
  ).toBeOnTheScreen();
});
