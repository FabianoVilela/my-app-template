import { render, screen, userEvent } from "@testing-library/react-native";
import { useState } from "react";
import { Input } from "./input";

function ControlledInput() {
  const [value, setValue] = useState("");

  return <Input label="Email" value={value} onChangeText={setValue} />;
}

test("forwards typed text through onChangeText", async () => {
  await render(<ControlledInput />);
  const input = screen.getByLabelText("Email");

  await userEvent.setup().type(input, "ana@example.com");

  expect(input).toHaveDisplayValue("ana@example.com");
});

test("shows the error instead of the helper text", async () => {
  await render(
    <Input
      label="Email"
      value="ana@"
      onChangeText={jest.fn()}
      helperText="We never share your email"
      errorText="Enter a valid email"
    />,
  );

  expect(screen.getByText("Enter a valid email")).toBeOnTheScreen();
  expect(screen.queryByText("We never share your email")).not.toBeOnTheScreen();
  expect(screen.getByLabelText("Email")).toHaveProp(
    "accessibilityHint",
    "Enter a valid email",
  );
});

test("is not editable when disabled", async () => {
  await render(
    <Input label="Name" value="Ana" isDisabled onChangeText={jest.fn()} />,
  );

  expect(screen.getByLabelText("Name")).toHaveProp("editable", false);
});
