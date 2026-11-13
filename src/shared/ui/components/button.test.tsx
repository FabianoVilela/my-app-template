import { render, screen, userEvent } from "@testing-library/react-native";
import { ArrowRight } from "lucide-react-native";
import { Button } from "./button";

test("calls onPress when pressed", async () => {
  const onPress = jest.fn();

  await render(
    <Button label="Continue" trailingIcon={ArrowRight} onPress={onPress} />,
  );
  await userEvent
    .setup()
    .press(screen.getByRole("button", { name: "Continue" }));

  expect(onPress).toHaveBeenCalledTimes(1);
});

test("announces loading as busy and ignores presses", async () => {
  const onPress = jest.fn();

  await render(<Button label="Sending" isLoading onPress={onPress} />);
  const button = screen.getByRole("button", { name: "Sending" });

  expect(button).toBeBusy();

  await userEvent.setup().press(button);

  expect(onPress).not.toHaveBeenCalled();
});

test("ignores presses when disabled", async () => {
  const onPress = jest.fn();

  await render(
    <Button label="Save" variant="secondary" isDisabled onPress={onPress} />,
  );
  const button = screen.getByRole("button", { name: "Save" });

  expect(button).toBeDisabled();

  await userEvent.setup().press(button);

  expect(onPress).not.toHaveBeenCalled();
});
