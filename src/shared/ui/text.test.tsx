import { render, screen } from "@testing-library/react-native";
import { Text } from "./text";

test("announces heading variants as headers", async () => {
  await render(<Text variant="h1">Settings</Text>);

  expect(screen.getByRole("header", { name: "Settings" })).toBeOnTheScreen();
});

test("renders body text without a header role", async () => {
  await render(<Text>Welcome back</Text>);

  expect(screen.getByText("Welcome back")).toBeOnTheScreen();
  expect(screen.queryByRole("header")).not.toBeOnTheScreen();
});

test("lets the caller override the accessibility role", async () => {
  await render(
    <Text variant="h2" accessibilityRole="link">
      Privacy policy
    </Text>,
  );

  expect(
    screen.getByRole("link", { name: "Privacy policy" }),
  ).toBeOnTheScreen();
});
