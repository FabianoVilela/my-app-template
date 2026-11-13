import { render, screen, userEvent } from "@testing-library/react-native";
import { RadioButton } from "./radio-button";

test("selects an unselected option", async () => {
  const onSelect = jest.fn();

  await render(
    <RadioButton label="Monthly" isSelected={false} onSelect={onSelect} />,
  );
  const radio = screen.getByRole("radio", { name: "Monthly" });

  expect(radio).not.toBeChecked();

  await userEvent.setup().press(radio);

  expect(onSelect).toHaveBeenCalledTimes(1);
});

test("keeps the selection when the selected option is pressed", async () => {
  const onSelect = jest.fn();

  await render(<RadioButton label="Yearly" isSelected onSelect={onSelect} />);
  const radio = screen.getByRole("radio", { name: "Yearly" });

  expect(radio).toBeChecked();

  await userEvent.setup().press(radio);

  expect(onSelect).not.toHaveBeenCalled();
});

test("ignores presses when disabled", async () => {
  const onSelect = jest.fn();

  await render(
    <RadioButton
      label="Lifetime"
      isSelected={false}
      isDisabled
      onSelect={onSelect}
    />,
  );
  const radio = screen.getByRole("radio", { name: "Lifetime" });

  expect(radio).toBeDisabled();

  await userEvent.setup().press(radio);

  expect(onSelect).not.toHaveBeenCalled();
});
