import { render, screen, userEvent } from "@testing-library/react-native";
import { useState } from "react";
import { Input, type InputProps } from "./input";

// Keys stand in for translated accessibility labels.
jest.mock("@/shared/i18n", () => ({
  useAppTranslation: () => ({ t: (key: string) => key }),
}));

function ControlledInput(props: Omit<InputProps, "value" | "onChangeText">) {
  const [value, setValue] = useState("");

  return <Input {...props} value={value} onChangeText={setValue} />;
}

test("forwards typed text through onChangeText", async () => {
  await render(<ControlledInput label="Email" />);
  const input = screen.getByLabelText("Email");

  await userEvent.setup().type(input, "ana@example.com");

  expect(input).toHaveDisplayValue("ana@example.com");
});

test("toggles password visibility", async () => {
  await render(
    <Input
      label="Password"
      type="password"
      value="secret"
      onChangeText={jest.fn()}
    />,
  );
  const user = userEvent.setup();

  expect(screen.getByLabelText("Password")).toHaveProp("secureTextEntry", true);

  await user.press(screen.getByRole("button", { name: "showPassword" }));

  expect(screen.getByLabelText("Password")).toHaveProp(
    "secureTextEntry",
    false,
  );
  expect(
    screen.getByRole("button", { name: "hidePassword" }),
  ).toBeOnTheScreen();
});

test("clears a search only when it has text", async () => {
  await render(<ControlledInput label="Search" type="search" isLabelHidden />);
  const user = userEvent.setup();

  expect(
    screen.queryByRole("button", { name: "clearSearch" }),
  ).not.toBeOnTheScreen();

  await user.type(screen.getByLabelText("Search"), "invoices");
  await user.press(screen.getByRole("button", { name: "clearSearch" }));

  expect(screen.getByLabelText("Search")).toHaveDisplayValue("");
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
