import { render, screen, userEvent } from "@testing-library/react-native";
import { Plus } from "lucide-react-native";
import { IconButton } from "./icon-button";

test("is named by its accessibility label and calls onPress", async () => {
  const onPress = jest.fn();

  await render(
    <IconButton icon={Plus} accessibilityLabel="Add" onPress={onPress} />,
  );
  await userEvent.setup().press(screen.getByRole("button", { name: "Add" }));

  expect(onPress).toHaveBeenCalledTimes(1);
});

test("announces loading as busy and ignores presses", async () => {
  const onPress = jest.fn();

  await render(
    <IconButton
      icon={Plus}
      accessibilityLabel="Add"
      isLoading
      onPress={onPress}
    />,
  );
  const button = screen.getByRole("button", { name: "Add" });

  expect(button).toBeBusy();

  await userEvent.setup().press(button);

  expect(onPress).not.toHaveBeenCalled();
});
