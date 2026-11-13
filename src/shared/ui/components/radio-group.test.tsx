import { render, screen, userEvent } from "@testing-library/react-native";
import { useState } from "react";
import { RadioButton } from "./radio-button";
import { RadioGroup } from "./radio-group";

function Plans({ onValueChange }: { onValueChange?: (value: string) => void }) {
  const [plan, setPlan] = useState<string | undefined>("monthly");

  return (
    <RadioGroup
      label="Billing period"
      value={plan}
      onValueChange={(value) => {
        setPlan(value);
        onValueChange?.(value);
      }}
    >
      <RadioButton value="monthly" label="Monthly" />
      <RadioButton value="yearly" label="Yearly" />
      <RadioButton value="lifetime" label="Lifetime" isDisabled />
    </RadioGroup>
  );
}

function radio(name: string) {
  return screen.getByRole("radio", { name });
}

test("exposes the options as a named radio group", async () => {
  await render(<Plans />);

  // The group is a container, not an accessibility element itself, so its
  // radios stay individually focusable; query it by label.
  expect(screen.getByLabelText("Billing period")).toHaveProp(
    "accessibilityRole",
    "radiogroup",
  );
  expect(radio("Monthly")).toBeChecked();
  expect(radio("Yearly")).not.toBeChecked();
});

test("moves the selection to the pressed option", async () => {
  const onValueChange = jest.fn();

  await render(<Plans onValueChange={onValueChange} />);
  await userEvent.setup().press(radio("Yearly"));

  expect(onValueChange).toHaveBeenCalledWith("yearly");
  expect(radio("Yearly")).toBeChecked();
  expect(radio("Monthly")).not.toBeChecked();
});

test("keeps the selection when the selected option is pressed", async () => {
  const onValueChange = jest.fn();

  await render(<Plans onValueChange={onValueChange} />);
  await userEvent.setup().press(radio("Monthly"));

  expect(onValueChange).not.toHaveBeenCalled();
});

test("ignores presses on a disabled option", async () => {
  const onValueChange = jest.fn();

  await render(<Plans onValueChange={onValueChange} />);
  const lifetime = radio("Lifetime");

  expect(lifetime).toBeDisabled();

  await userEvent.setup().press(lifetime);

  expect(onValueChange).not.toHaveBeenCalled();
});

test("throws when rendered outside a group", async () => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);

  await expect(
    render(<RadioButton value="monthly" label="Monthly" />),
  ).rejects.toThrow("RadioButton must be rendered inside a RadioGroup.");
});
