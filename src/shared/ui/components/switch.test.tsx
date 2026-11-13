import { render, screen, userEvent } from "@testing-library/react-native";
import { Switch } from "./switch";

test("reports the toggled value when pressed", async () => {
  const onValueChange = jest.fn();

  await render(
    <Switch label="Notifications" isOn onValueChange={onValueChange} />,
  );
  const control = screen.getByRole("switch", { name: "Notifications" });

  expect(control).toBeChecked();

  await userEvent.setup().press(control);

  expect(onValueChange).toHaveBeenCalledWith(false);
});

test("ignores presses when disabled", async () => {
  const onValueChange = jest.fn();

  await render(
    <Switch
      label="Face ID"
      isOn={false}
      isDisabled
      onValueChange={onValueChange}
    />,
  );
  const control = screen.getByRole("switch", { name: "Face ID" });

  expect(control).toBeDisabled();

  await userEvent.setup().press(control);

  expect(onValueChange).not.toHaveBeenCalled();
});
