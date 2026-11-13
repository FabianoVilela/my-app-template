import { render, screen, userEvent } from "@testing-library/react-native";
import { PasswordInput } from "./password-input";

// Keys stand in for translated accessibility labels.
jest.mock("@/shared/i18n", () => ({
  useAppTranslation: () => ({ t: (key: string) => key }),
}));

test("hides the password until the toggle is pressed", async () => {
  await render(
    <PasswordInput label="Password" value="secret" onChangeText={jest.fn()} />,
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
