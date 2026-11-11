import { render, screen, userEvent } from "@testing-library/react-native";
import { Checkbox } from "./checkbox";

test("reports the toggled value when pressed", async () => {
  const onCheckedChange = jest.fn();

  await render(
    <Checkbox
      label="Remember me"
      isChecked={false}
      onCheckedChange={onCheckedChange}
    />,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Remember me" });

  expect(checkbox).not.toBeChecked();

  await userEvent.setup().press(checkbox);

  expect(onCheckedChange).toHaveBeenCalledWith(true);
});

test("exposes the checked state and ignores presses when disabled", async () => {
  const onCheckedChange = jest.fn();

  await render(
    <Checkbox
      label="Newsletter"
      isChecked
      isDisabled
      onCheckedChange={onCheckedChange}
    />,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Newsletter" });

  expect(checkbox).toBeChecked();
  expect(checkbox).toBeDisabled();

  await userEvent.setup().press(checkbox);

  expect(onCheckedChange).not.toHaveBeenCalled();
});
