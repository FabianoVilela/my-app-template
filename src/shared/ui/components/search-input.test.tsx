import { render, screen, userEvent } from "@testing-library/react-native";
import { useState } from "react";
import { SearchInput } from "./search-input";

// Keys stand in for translated accessibility labels.
jest.mock("@/shared/i18n", () => ({
  useAppTranslation: () => ({ t: (key: string) => key }),
}));

function ControlledSearch() {
  const [value, setValue] = useState("");

  return <SearchInput label="Search" value={value} onChangeText={setValue} />;
}

test("shows no visible label but keeps it as the accessible name", async () => {
  await render(<ControlledSearch />);

  expect(screen.getByLabelText("Search")).toBeOnTheScreen();
  expect(screen.queryByText("Search")).not.toBeOnTheScreen();
});

test("clears the search only when it has text", async () => {
  await render(<ControlledSearch />);
  const user = userEvent.setup();

  expect(
    screen.queryByRole("button", { name: "clearSearch" }),
  ).not.toBeOnTheScreen();

  await user.type(screen.getByLabelText("Search"), "invoices");
  await user.press(screen.getByRole("button", { name: "clearSearch" }));

  expect(screen.getByLabelText("Search")).toHaveDisplayValue("");
});
