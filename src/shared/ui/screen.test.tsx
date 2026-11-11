import { render, screen } from "@testing-library/react-native";
import { Screen } from "./screen";
import { Text } from "./text";

test("renders its content", async () => {
  await render(
    <Screen>
      <Text>Profile</Text>
    </Screen>,
  );

  expect(screen.getByText("Profile")).toBeOnTheScreen();
});

test("renders its content when scrollable", async () => {
  await render(
    <Screen isScrollable edges={["bottom"]}>
      <Text>Terms</Text>
    </Screen>,
  );

  expect(screen.getByText("Terms")).toBeOnTheScreen();
});
